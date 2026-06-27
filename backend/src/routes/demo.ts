import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { getUploadUrl, getR2Url, uploadAudio } from '../services/storage.js';
import type { StepItem, DemoResponse } from '../shared/types.js';

// ── Process async ──

// ── Routes ──

export default async function demoRoutes(fastify: FastifyInstance) {

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

    const demoId = uuidv4();
    const videoKey = `demos/${demoId}/recording.webm`;
    const videoUploadUrl = await getUploadUrl(videoKey, 'video/webm');

    const stepItems: StepItem[] = [];
    for (let i = 0; i < rawSteps.length; i++) {
      const s = rawSteps[i];
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
      `INSERT INTO demos (id, title, status, steps, language, demo_type) VALUES ($1, $2, 'awaiting_upload', $3, $4, $5)`,
      [demoId, title, JSON.stringify(stepItems), language || 'English', demoType || 'product-demo']
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
   * PUT /api/demos/:id — internal: worker updates status/steps
   */
  fastify.put('/api/demos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!body || !body.status) return reply.status(400).send({ error: 'Missing status' });

    if (body.steps) {
      await query(`UPDATE demos SET status = $1, steps = $2, updated_at = now() WHERE id = $3`, [body.status, JSON.stringify(body.steps), id]);
    } else {
      await query(`UPDATE demos SET status = $1, updated_at = now() WHERE id = $2`, [body.status, id]);
    }
    return reply.send({ id, status: body.status });
  });

  /**
   * POST /api/demos/:id/audio — worker uploads audio for a step
   * Body: { index: number, audio: base64 string, duration_ms: number }
   */
  fastify.post('/api/demos/:id/audio', async (request, reply) => {
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
    };

    return reply.send(response);
  });
}
