import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { uploadScreenshot, uploadAudio, getR2Url } from '../services/storage.js';
import { generateNarration } from '../services/narration.js';
import { generateAudioForStep } from '../services/voiceover.js';
import type { StepItem, DemoResponse } from '../shared/types.js';

async function processDemo(demoId: string, steps: StepItem[]): Promise<void> {
  try {
    console.log(`[Demo ${demoId}] Narration...`);
    await query(`UPDATE demos SET status = 'processing_narration', updated_at = now() WHERE id = $1`, [demoId]);

    const stepInputs = steps.map((s) => ({
      index: s.index,
      description: s.description,
      pageContext: { title: s.page_title, url: s.page_url },
    }));

    const narrations = await generateNarration(stepInputs);
    for (let i = 0; i < steps.length; i++) {
      steps[i].narration = narrations[i];
    }

    console.log(`[Demo ${demoId}] Voiceover (parallel)...`);
    await query(
      `UPDATE demos SET status = 'processing_audio', steps = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(steps), demoId]
    );

    // Parallel TTS for all steps
    const results = await Promise.all(
      steps
        .filter((s) => s.narration)
        .map(async (s) => {
          const audio = await generateAudioForStep(s.narration!);
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

export default async function demoRoutes(fastify: FastifyInstance) {

  fastify.post('/api/demos', async (request, reply) => {
    const parts = request.parts();
    let title = '';
    const screenshotBuffers: Buffer[] = [];
    let stepsJson = '';

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'title') title = part.value as string;
        else if (part.fieldname === 'steps') stepsJson = part.value as string;
      } else if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        screenshotBuffers.push(Buffer.concat(chunks));
      }
    }

    if (!title || !stepsJson) {
      return reply.status(400).send({ error: 'Missing title or steps' });
    }

    let uploadSteps: any[];
    try { uploadSteps = JSON.parse(stepsJson); } catch {
      return reply.status(400).send({ error: 'Invalid steps JSON' });
    }
    if (uploadSteps.length === 0) {
      return reply.status(400).send({ error: 'No steps provided' });
    }

    const demoId = uuidv4();

    const stepItems: StepItem[] = [];
    for (let i = 0; i < uploadSteps.length; i++) {
      const s = uploadSteps[i];
      let screenshotKey = '';
      if (screenshotBuffers[i]) {
        screenshotKey = await uploadScreenshot(demoId, i, screenshotBuffers[i]);
      }
      stepItems.push({
        index: s.index,
        description: s.description,
        screenshot_key: screenshotKey,
        audio_key: null,
        narration: null,
        duration_ms: null,
        start_time: s.startTime,
        end_time: s.endTime,
        page_url: s.pageContext?.url || '',
        page_title: s.pageContext?.title || '',
        highlights: s.highlights || [],
      });
    }

    await query(
      `INSERT INTO demos (id, title, status, steps) VALUES ($1, $2, 'processing_narration', $3)`,
      [demoId, title, JSON.stringify(stepItems)]
    );

    processDemo(demoId, stepItems).catch((err) => {
      console.error(`[Demo ${demoId}] Async error:`, err);
    });

    return reply.status(201).send({ id: demoId, status: 'processing_narration' });
  });

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
