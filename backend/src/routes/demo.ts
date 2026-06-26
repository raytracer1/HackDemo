import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { uploadAudio, getUploadUrl, getR2Url } from '../services/storage.js';
import { generateNarration } from '../services/narration.js';
import { generateAudioForStep } from '../services/voiceover.js';
import type { StepItem, DemoResponse } from '../shared/types.js';

// ── Process async ──

async function processDemo(demoId: string, steps: StepItem[], language?: string, demoType?: string): Promise<void> {
  try {
    console.log(`[Demo ${demoId}] Narration...`);
    await query(`UPDATE demos SET status = 'processing_narration', updated_at = now() WHERE id = $1`, [demoId]);

    const stepInputs = steps.map((s) => ({
      index: s.index,
      description: s.description,
      pageContext: { title: s.page_title, url: s.page_url },
    }));

    const narrations = await generateNarration(stepInputs, language, demoType);
    for (let i = 0; i < steps.length; i++) {
      steps[i].narration = narrations[i];
    }

    console.log(`[Demo ${demoId}] Voiceover (parallel)...`);
    await query(
      `UPDATE demos SET status = 'processing_audio', steps = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(steps), demoId]
    );

    const results = await Promise.all(
      steps
        .filter((s) => s.narration)
        .map(async (s) => {
          const audio = await generateAudioForStep(s.narration!, language);
          const audioKey = await uploadAudio(demoId, s.index, audio.buffer);
          return { index: s.index, key: audioKey, durationMs: audio.durationMs };
        })
    );

    for (const r of results) {
      steps[r.index].audio_key = r.key;
      steps[r.index].duration_ms = r.durationMs;
    }

    await query(
      `UPDATE demos SET status = 'completed', steps = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(steps), demoId]
    );

    console.log(`[Demo ${demoId}] Complete!`);
  } catch (err: any) {
    console.error(`[Demo ${demoId}] Failed:`, err.message);
    await query(`UPDATE demos SET status = 'failed', updated_at = now() WHERE id = $1`, [demoId]);
  }
}

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
    const uploadUrls: string[] = [];

    // Build step items and generate upload URLs
    const stepItems: StepItem[] = [];
    for (let i = 0; i < rawSteps.length; i++) {
      const s = rawSteps[i];
      const screenshotKey = `demos/${demoId}/screenshots/${i}.jpg`;

      // Generate pre-signed upload URL (extension uploads directly to R2)
      const uploadUrl = await getUploadUrl(screenshotKey, 'image/jpeg');
      uploadUrls.push(uploadUrl);

      stepItems.push({
        index: i,
        description: s.description || '',
        screenshot_key: screenshotKey,
        audio_key: null,
        narration: null,
        duration_ms: null,
        start_time: s.startTime || 0,
        end_time: s.endTime || 0,
        page_url: s.pageContext?.url || '',
        page_title: s.pageContext?.title || '',
        highlights: s.highlights || [],
      });
    }

    // Insert demo with screenshot keys (not yet confirmed uploaded)
    await query(
      `INSERT INTO demos (id, title, status, steps, language, demo_type) VALUES ($1, $2, 'awaiting_upload', $3, $4, $5)`,
      [demoId, title, JSON.stringify(stepItems), language || 'English', demoType || 'product-demo']
    );

    return reply.status(201).send({
      id: demoId,
      uploadUrls,
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

    // Start async processing
    processDemo(id, steps, demo.language, demo.demo_type).catch((err) => {
      console.error(`[Demo ${id}] Async error:`, err);
    });

    return reply.send({ id, status: 'processing' });
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
        screenshotUrl: step.screenshot_key ? await getR2Url(step.screenshot_key) : '',
        audioUrl: step.audio_key ? await getR2Url(step.audio_key) : null,
        durationMs: step.duration_ms,
        startTime: step.start_time,
        endTime: step.end_time,
        pageUrl: step.page_url,
        pageTitle: step.page_title,
        highlights: step.highlights || [],
      }))
    );

    const response: DemoResponse = {
      id: demo.id,
      title: demo.title,
      status: demo.status,
      steps,
    };

    return reply.send(response);
  });
}
