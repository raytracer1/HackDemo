import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { uploadAudio, getUploadUrl, getR2Url } from '../services/storage.js';
import { generateNarration } from '../services/narration.js';
import { generateAudioForStep } from '../services/voiceover.js';
import type { StepItem, DemoResponse } from '../shared/types.js';

// ── Process async ──

async function processNarration(demoId: string, steps: StepItem[], language?: string, demoType?: string): Promise<StepItem[]> {
  console.log(`[Demo ${demoId}] Narration...`);
  await query(`UPDATE demos SET status = 'processing_narration', updated_at = now() WHERE id = $1`, [demoId]);
  const inputs = steps.map(s => ({ index: s.index, description: s.description, pageContext: { title: s.page_title, url: s.page_url } }));
  const narrations = await generateNarration(inputs, language, demoType);
  for (let i = 0; i < steps.length; i++) steps[i].narration = narrations[i];
  await query(`UPDATE demos SET status = 'narration_done', steps = $1, updated_at = now() WHERE id = $2`, [JSON.stringify(steps), demoId]);
  console.log(`[Demo ${demoId}] Narration done`);
  return steps;
}

async function processAudio(demoId: string, steps: StepItem[], language?: string): Promise<void> {
  console.log(`[Demo ${demoId}] Voiceover...`);
  await query(`UPDATE demos SET status = 'processing_audio', updated_at = now() WHERE id = $1`, [demoId]);
  const results = await Promise.all(
    steps.filter(s => s.narration).map(async s => {
      const audio = await generateAudioForStep(s.narration!, language);
      const key = await uploadAudio(demoId, s.index, audio.buffer);
      return { index: s.index, key, durationMs: audio.durationMs };
    })
  );
  for (const r of results) { steps[r.index].audio_key = r.key; steps[r.index].duration_ms = r.durationMs; }
  await query(`UPDATE demos SET status = 'completed', steps = $1, updated_at = now() WHERE id = $2`, [JSON.stringify(steps), demoId]);
  console.log(`[Demo ${demoId}] Complete!`);
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
        start_time: s.startTime || 0,
        end_time: s.endTime || 0,
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

    return reply.send({ id, status: 'uploaded' });
  });

  fastify.post('/api/demos/:id/process-narration', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await query(`SELECT * FROM demos WHERE id = $1`, [id]);
    if (!result.rows?.length) return reply.status(404).send({ error: 'Demo not found' });
    const demo = result.rows[0];
    if (demo.status === 'narration_done' || demo.status === 'completed') return reply.send({ id, status: demo.status });
    try {
      await processNarration(id, demo.steps || [], demo.language, demo.demo_type);
      return reply.send({ id, status: 'narration_done' });
    } catch (err: any) { return reply.status(500).send({ error: err.message }); }
  });

  fastify.post('/api/demos/:id/process-audio', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await query(`SELECT * FROM demos WHERE id = $1`, [id]);
    if (!result.rows?.length) return reply.status(404).send({ error: 'Demo not found' });
    const demo = result.rows[0];
    if (demo.status === 'completed') return reply.send({ id, status: 'completed' });
    try {
      await processAudio(id, demo.steps || [], demo.language);
      return reply.send({ id, status: 'completed' });
    } catch (err: any) { return reply.status(500).send({ error: err.message }); }
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
        startTime: step.start_time,
        endTime: step.end_time,
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
    };

    return reply.send(response);
  });
}
