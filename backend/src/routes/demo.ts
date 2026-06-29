import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { getUploadUrl, getR2Url, uploadAudio } from '../services/storage.js';
import type { StepItem, DemoResponse } from '../shared/types.js';
import { authenticate } from '../auth/token.js';

// ── Routes ──

export default async function demoRoutes(fastify: FastifyInstance) {

  /**
   * GET /api/users/me/demos — returns the current user's demos for history page.
   */
  fastify.get('/api/users/me/demos', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth || auth.role !== 'user') {
      return reply.status(401).send({ error: 'Authentication required.' });
    }

    const page = parseInt((request.query as any).page || '1', 10);
    const limit = Math.min(parseInt((request.query as any).limit || '10', 10), 20);
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM demos WHERE user_id = $1`,
      [auth.sub],
    );
    const total = parseInt(countResult.rows?.[0]?.count || '0', 10);

    const result = await query(
      `SELECT id, title, status, language, created_at, updated_at
       FROM demos WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [auth.sub, limit, offset],
    );
    return reply.send({ demos: result.rows || [], total, page, limit });
  });

  /**
   * GET /api/demos/:id/credits — worker checks user balance before processing.
   */
  fastify.get('/api/demos/:id/credits', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth) return reply.status(401).send({ error: 'Authentication required.' });

    const { id } = request.params as { id: string };
    const demo = await query(
      `SELECT d.user_id, u.credits FROM demos d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [id],
    );
    const row = demo.rows?.[0];
    if (!row) return reply.status(404).send({ error: 'Demo not found' });
    return reply.send({
      userId: row.user_id,
      credits: row.credits ? parseFloat(row.credits) : 0,
      minCredits: parseFloat(process.env.MIN_CREDITS || '0.10'),
    });
  });

  /**
   * POST /api/demos — JSON only, no files.
   * Returns pre-signed R2 upload URLs for each screenshot.
   */
  fastify.post('/api/demos', async (request, reply) => {
    const body = request.body as any;
    const { title, steps: rawSteps, language, demoType } = body || {};

    if (!title || !rawSteps || !Array.isArray(rawSteps) || rawSteps.length === 0) {
      return reply.status(400).send({ error: 'Missing title or steps' });
    }

    // Require authentication
    const auth = await authenticate(request.headers.authorization);
    if (!auth) {
      return reply.status(401).send({ error: 'Authentication required.' });
    }
    const userId = auth.sub;

    const demoId = uuidv4();
    const videoKey = `demos/${demoId}/recording.webm`;
    const videoUploadUrl = await getUploadUrl(videoKey, 'video/webm');

    const stepItems: StepItem[] = [];
    var validSteps = rawSteps.filter(function (s: any) { return s.events && s.events.length > 0; });
    for (let i = 0; i < validSteps.length; i++) {
      const s = validSteps[i];
      stepItems.push({
        index: i,
        description: s.description || '',
        screenshot_key: '',
        audio_key: null,
        narration: null,
        duration_ms: null,
        startTime: s.startTime || 0,
        endTime: s.endTime || 0,
        stableTime: s.stableTime || null,
        page_url: s.pageContext?.url || '',
        page_title: s.pageContext?.title || '',
        highlights: s.highlights || [],
      });
    }

    await query(
      `INSERT INTO demos (id, title, status, steps, language, demo_type, user_id) VALUES ($1, $2, 'awaiting_upload', $3, $4, $5, $6)`,
      [demoId, title, JSON.stringify(stepItems), language || 'English', demoType || 'product-demo', userId]
    );

    return reply.status(201).send({
      id: demoId,
      videoUploadUrl,
    });
  });

  /**
   * POST /api/demos/:id/confirm — screenshots uploaded, start processing.
   */
  fastify.post('/api/demos/:id/confirm', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth) return reply.status(401).send({ error: 'Authentication required.' });

    const { id } = request.params as { id: string };

    const result = await query(`SELECT * FROM demos WHERE id = $1`, [id]);
    if (!result.rows || result.rows.length === 0) {
      return reply.status(404).send({ error: 'Demo not found' });
    }

    const demo = result.rows[0];
    const steps = demo.steps || [];

    // Publish job to Ably worker
    try {
      const Ably = await import('ably');
      const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY || '' });
      await ably.channels.get('hackdemo-jobs').publish('new-demo', { demoId: id });
      ably.close();
    } catch (_) {}

    return reply.send({ id, status: 'processing' });
  });

  /**
   * POST /api/demos/:id/retry — user retries a failed demo after topping up credits.
   */
  fastify.post('/api/demos/:id/retry', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth) return reply.status(401).send({ error: 'Authentication required.' });

    const { id } = request.params as { id: string };
    const result = await query(`SELECT * FROM demos WHERE id = $1`, [id]);
    if (!result.rows?.length) return reply.status(404).send({ error: 'Demo not found' });

    const demo = result.rows[0];

    // Only allow retry for failed demos that belong to this user
    if (demo.status !== 'failed') {
      return reply.status(400).send({ error: 'Demo is not in failed state' });
    }
    if (auth.role === 'user' && demo.user_id !== auth.sub) {
      return reply.status(403).send({ error: 'Not your demo' });
    }

    // Reset to processing so the worker picks it up
    await query(`UPDATE demos SET status = 'processing', tokens_charged = false, updated_at = now() WHERE id = $1`, [id]);

    // Notify worker via Ably
    try {
      const Ably = await import('ably');
      const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY || '' });
      await ably.channels.get('hackdemo-jobs').publish('new-demo', { demoId: id });
      ably.close();
    } catch (_) {}

    return reply.send({ id, status: 'processing' });
  });

  /**
   * PUT /api/demos/:id — internal: worker updates status/steps
   */
  fastify.put('/api/demos/:id', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth) return reply.status(401).send({ error: 'Authentication required.' });

    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!body || !body.status) return reply.status(400).send({ error: 'Missing status' });

    // Charge for AI tokens if this update includes narration
    if (body.token_count && body.token_count > 0) {
      const demo = await query(`SELECT user_id, tokens_charged FROM demos WHERE id = $1`, [id]);
      const row = demo.rows?.[0];
      if (row && !row.tokens_charged && row.user_id) {
        const rate = parseFloat(process.env.AI_TOKEN_RATE || '0.000005');
        const cost = body.token_count * rate;
        await query(
          `UPDATE users SET credits = credits - $1, updated_at = now() WHERE id = $2 AND credits >= $1`,
          [cost, row.user_id],
        );
        await query(
          `INSERT INTO transactions (id, user_id, type, amount, description)
           VALUES ($1, $2, 'ai_usage', $3, $4)`,
          [crypto.randomUUID(), row.user_id, -cost, `AI narration — demo ${id} (${body.token_count} tokens)`],
        );
        await query(
          `UPDATE demos SET token_count = $1, tokens_charged = true WHERE id = $2`,
          [body.token_count, id],
        );
        console.log(`[Billing] Demo ${id}: ${body.token_count} tokens → $${cost.toFixed(6)}`);
      }
    }

    if (body.steps) {
      await query(
        `UPDATE demos SET status = $1, steps = $2, fail_reason = COALESCE($4, fail_reason), updated_at = now() WHERE id = $3`,
        [body.status, JSON.stringify(body.steps), id, body.fail_reason || null],
      );
    } else {
      await query(
        `UPDATE demos SET status = $1, fail_reason = COALESCE($3, fail_reason), updated_at = now() WHERE id = $2`,
        [body.status, id, body.fail_reason || null],
      );
    }
    return reply.send({ id, status: body.status });
  });

  /**
   * POST /api/demos/:id/audio — worker uploads audio for a step
   * Body: { index: number, audio: base64 string, duration_ms: number }
   */
  fastify.post('/api/demos/:id/audio', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth) return reply.status(401).send({ error: 'Authentication required.' });

    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!body || body.index === undefined || !body.audio) {
      return reply.status(400).send({ error: 'Missing index or audio' });
    }
    const buffer = Buffer.from(body.audio, 'base64');
    const key = await uploadAudio(id, body.index, buffer);
    return reply.send({ key, duration_ms: body.duration_ms || 0 });
  });

  /**
   * GET /api/demos?status=pending — worker polls for unprocessed demos
   */
  fastify.get('/api/demos', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth) return reply.status(401).send({ error: 'Authentication required.' });

    const status = (request.query as any).status;
    if (status === 'pending') {
      const result = await query(
        `SELECT id, status FROM demos WHERE status IN ('processing', 'narration_done') ORDER BY created_at ASC LIMIT 10`,
      );
      return reply.send(result.rows || []);
    }
    return reply.status(400).send({ error: 'Use /api/demos/:id' });
  });

  /**
   * GET /api/demos/:id
   */
  fastify.get('/api/demos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await query(`SELECT * FROM demos WHERE id = $1`, [id]);

    if (!result.rows || result.rows.length === 0) {
      return reply.status(404).send({ error: 'Demo not found' });
    }

    const demo = result.rows[0];

    const steps = await Promise.all(
      (demo.steps || []).map(async (step: StepItem) => ({
        index: step.index,
        description: step.description,
        narration: step.narration,
        screenshotUrl: '',
        audioUrl: step.audio_key ? await getR2Url(step.audio_key) : null,
        durationMs: step.duration_ms,
        startTime: step.startTime || 0,
        endTime: step.endTime || 0,
        stableTime: step.stableTime || null,
        pageUrl: step.page_url,
        pageTitle: step.page_title,
        highlights: step.highlights || [],
      }))
    );

    const videoKey = `demos/${demo.id}/recording.webm`;
    const videoUrl = await getR2Url(videoKey);

    const response: DemoResponse = {
      id: demo.id,
      title: demo.title,
      status: demo.status,
      videoUrl,
      steps,
      language: demo.language || 'English (US)',
      demoType: demo.demo_type || 'product-demo',
      failReason: demo.fail_reason || null,
      minCredits: parseFloat(process.env.MIN_CREDITS || '0.10'),
    };

    return reply.send(response);
  });

  /**
   * Parse MP3 file to calculate exact duration from frame headers.
   */
  function getMp3Duration(buf: Buffer): number {
    if (buf.length < 4) return 0;
    let offset = 0;

    // Skip ID3v2 tag
    if (buf.length >= 10 && buf.toString('ascii', 0, 3) === 'ID3') {
      const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
      offset = 10 + size;
    }

    const bitrateTableV1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
    const bitrateTableV2L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
    const sampleRateTable: Record<number, number[]> = {
      3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000],
    };

    let totalSamples = 0;
    let sampleRate = 0;

    while (offset + 4 <= buf.length) {
      if (buf[offset] !== 0xff || (buf[offset + 1] & 0xe0) !== 0xe0) { offset++; continue; }
      const version = (buf[offset + 1] >> 3) & 0x03;
      const layer = (buf[offset + 1] >> 1) & 0x03;
      if (version === 1 || layer !== 1) { offset++; continue; }
      const bitrateIndex = (buf[offset + 2] >> 4) & 0x0f;
      const sampleRateIndex = (buf[offset + 2] >> 2) & 0x03;
      const padding = (buf[offset + 2] >> 1) & 0x01;
      if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) { offset++; continue; }
      const currentSR = sampleRateTable[version]?.[sampleRateIndex];
      if (!currentSR) { offset++; continue; }
      if (sampleRate === 0) sampleRate = currentSR;
      const isMpeg1 = version === 3;
      const bitrate = isMpeg1 ? bitrateTableV1L3[bitrateIndex] : bitrateTableV2L3[bitrateIndex];
      const samplesPerFrame = isMpeg1 ? 1152 : 576;
      const frameLen = Math.floor((isMpeg1 ? 144000 : 72000) * bitrate / currentSR) + padding;
      if (frameLen <= 0 || offset + frameLen > buf.length) break;
      totalSamples += samplesPerFrame;
      offset += frameLen;
    }

    if (sampleRate === 0 || totalSamples === 0) return 0;
    return Math.round((totalSamples * 1000) / sampleRate);
  }

  /**
   * POST /api/demos/:id/tts — process TTS for all steps with narration but no audio.
   * Called by worker after DeepSeek narration is complete.
   * Internally parallelises Google TTS calls (max 5 concurrent).
   */
  fastify.post('/api/demos/:id/tts', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth) return reply.status(401).send({ error: 'Authentication required.' });

    const { id } = request.params as { id: string };

    // ── Load demo ──
    const result = await query(`SELECT * FROM demos WHERE id = $1`, [id]);
    if (!result.rows?.length) return reply.status(404).send({ error: 'Demo not found' });

    const demo = result.rows[0];
    const steps: StepItem[] = demo.steps || [];
    const language = demo.language || 'English (US)';

    // Language map (same as worker)
    const LANG_MAP: Record<string, string> = {
      'English (US)': 'en', 'English (UK)': 'en',
      'Chinese (Mandarin)': 'zh-CN', 'Chinese (Cantonese)': 'zh-CN',
      'Japanese': 'ja', 'Korean': 'ko',
      'Spanish': 'es', 'French': 'fr', 'German': 'de',
      'Portuguese': 'pt', 'Italian': 'it', 'Russian': 'ru',
      'Arabic': 'ar', 'Hindi': 'hi', 'Dutch': 'nl',
      'Polish': 'pl', 'Turkish': 'tr', 'Swedish': 'sv',
      'Thai': 'th', 'Vietnamese': 'vi', 'Indonesian': 'id',
    };
    const tl = LANG_MAP[language] || 'en';

    function splitText(text: string, maxLen = 180): string[] {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const result: string[] = [];
      let cur = '';
      for (const s of sentences) {
        if (cur.length + s.length > maxLen && cur.length > 0) { result.push(cur.trim()); cur = ''; }
        cur += s;
      }
      if (cur.trim()) result.push(cur.trim());
      return result.length > 0 ? result : [text];
    }

    // ── Concurrency-limited parallel execution ──
    async function limitedParallel<T, R>(
      items: T[],
      fn: (item: T, i: number) => Promise<R>,
      limit = 5,
    ): Promise<R[]> {
      const results: R[] = new Array(items.length);
      let cursor = 0;

      async function worker() {
        while (cursor < items.length) {
          const i = cursor++;
          results[i] = await fn(items[i], i);
        }
      }

      await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
      return results;
    }

    // ── Build TTS tasks — one per chunk ──
    interface TtsTask { stepIndex: number; chunk: string; }
    const tasks: TtsTask[] = [];
    for (const step of steps) {
      if (!step.narration || step.audio_key) continue;
      const chunks = splitText(step.narration);
      for (const chunk of chunks) {
        tasks.push({ stepIndex: step.index, chunk });
      }
    }

    if (tasks.length === 0) {
      return reply.send({ id, status: demo.status, audios: [] });
    }

    console.log(`[TTS] Demo ${id}: ${tasks.length} chunks across ${steps.filter(s => s.narration && !s.audio_key).length} steps`);

    // ── Parallel TTS (max 5 concurrent) ──
    const ttsResults = await limitedParallel(tasks, async (task) => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(task.chunk)}&tl=${tl}&client=tw-ob`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!resp.ok) throw new Error(`Google TTS ${resp.status}`);
      const arr = await resp.arrayBuffer();
      return { stepIndex: task.stepIndex, buffer: Buffer.from(arr) };
    });

    // ── Merge chunks per step, upload to R2, and update DB ──
    const audioResults: { index: number; key: string; durationMs: number }[] = [];

    // Group buffers by stepIndex
    const grouped = new Map<number, Buffer[]>();
    for (const r of ttsResults) {
      if (!grouped.has(r.stepIndex)) grouped.set(r.stepIndex, []);
      grouped.get(r.stepIndex)!.push(r.buffer);
    }

    for (const [stepIndex, buffers] of grouped) {
      const full = Buffer.concat(buffers);
      const durationMs = getMp3Duration(full);
      const key = await uploadAudio(id, stepIndex, full);
      steps[stepIndex].audio_key = key;
      steps[stepIndex].duration_ms = durationMs;
      audioResults.push({ index: stepIndex, key, durationMs });
    }

    // Write updated steps back to DB
    await query(
      `UPDATE demos SET steps = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(steps), id],
    );

    console.log(`[TTS] Demo ${id}: done — ${audioResults.length} steps`);
    return reply.send({ id, status: demo.status, audios: audioResults });
  });
}
