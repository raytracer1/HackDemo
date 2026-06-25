import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { uploadScreenshot, uploadAudio, getR2Url } from '../services/storage.js';
import { generateNarration } from '../services/narration.js';
import { generateAllVoiceovers } from '../services/voiceover.js';
import type { CreateDemoInput, DemoResponse } from '../shared/types.js';

/**
 * Process a demo asynchronously:
 * 1. Generate narration with DeepSeek
 * 2. Generate voiceover with OpenAI TTS
 * 3. Update database
 */
async function processDemo(demoId: string, steps: CreateDemoInput['steps']): Promise<void> {
  try {
    // Step 1: Generate narration
    console.log(`[Demo ${demoId}] Starting narration generation...`);
    await db
      .update(schema.demos)
      .set({ status: 'processing_narration', updated_at: new Date() })
      .where(eq(schema.demos.id, demoId));

    const stepInputs = steps.map((s) => ({
      index: s.index,
      description: s.description,
      pageContext: s.pageContext,
    }));

    const narrations = await generateNarration(stepInputs);

    // Update each step with narration
    for (let i = 0; i < steps.length; i++) {
      await db
        .update(schema.steps)
        .set({ narration: narrations[i] })
        .where(eq(schema.steps.id, getStepId(demoId, i)));
    }

    console.log(`[Demo ${demoId}] Narration generated for ${narrations.length} steps`);

    // Step 2: Generate voiceover
    console.log(`[Demo ${demoId}] Starting voiceover generation...`);
    await db
      .update(schema.demos)
      .set({ status: 'processing_audio', updated_at: new Date() })
      .where(eq(schema.demos.id, demoId));

    const narrationItems = steps.map((s, i) => ({
      index: i,
      narration: narrations[i],
    }));

    const audioMap = await generateAllVoiceovers(narrationItems);

    // Upload each audio to R2 and update step
    for (const [index, audio] of audioMap) {
      const audioKey = await uploadAudio(demoId, index, audio.buffer);
      await db
        .update(schema.steps)
        .set({
          audio_key: audioKey,
          duration_ms: audio.durationMs,
        })
        .where(eq(schema.steps.id, getStepId(demoId, index)));
    }

    console.log(`[Demo ${demoId}] Voiceover generated for ${audioMap.size} steps`);

    // Mark as completed
    await db
      .update(schema.demos)
      .set({ status: 'completed', updated_at: new Date() })
      .where(eq(schema.demos.id, demoId));

    console.log(`[Demo ${demoId}] Processing complete!`);
  } catch (err: any) {
    console.error(`[Demo ${demoId}] Processing failed:`, err.message);
    await db
      .update(schema.demos)
      .set({ status: 'failed', updated_at: new Date() })
      .where(eq(schema.demos.id, demoId));
  }
}

// Simple deterministic step ID from demoId + index
function getStepId(demoId: string, index: number): string {
  return `${demoId}-step-${index}`;
}

// ── Routes ──

export default async function demoRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/demos
   * Upload a new demo with screenshots.
   * Returns immediately, processing happens asynchronously.
   */
  fastify.post('/api/demos', async (request, reply) => {
    const parts = request.parts();
    let title = '';
    const screenshotBuffers: Buffer[] = [];
    let stepsJson = '';

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'title') {
          title = part.value as string;
        } else if (part.fieldname === 'steps') {
          stepsJson = part.value as string;
        }
      } else if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        screenshotBuffers.push(Buffer.concat(chunks));
      }
    }

    if (!title || !stepsJson) {
      return reply.status(400).send({ error: 'Missing title or steps' });
    }

    let steps: CreateDemoInput['steps'];
    try {
      steps = JSON.parse(stepsJson);
    } catch {
      return reply.status(400).send({ error: 'Invalid steps JSON' });
    }

    if (steps.length === 0) {
      return reply.status(400).send({ error: 'No steps provided' });
    }

    // Create demo record
    const demoId = uuidv4();
    await db.insert(schema.demos).values({
      id: demoId,
      title,
      status: 'uploading',
    });

    // Upload screenshots to R2 and create step records
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let screenshotKey = '';

      if (screenshotBuffers[i]) {
        screenshotKey = await uploadScreenshot(demoId, i, screenshotBuffers[i]);
      }

      const stepId = getStepId(demoId, i);
      await db.insert(schema.steps).values({
        id: stepId,
        demo_id: demoId,
        index: step.index,
        description: step.description,
        screenshot_key: screenshotKey,
        start_time: step.startTime,
        end_time: step.endTime,
        page_url: step.pageContext?.url || '',
        page_title: step.pageContext?.title || '',
        highlights: step.highlights || [],
      });
    }

    // Update status
    await db
      .update(schema.demos)
      .set({ status: 'processing_narration', updated_at: new Date() })
      .where(eq(schema.demos.id, demoId));

    // Process asynchronously — don't block the response
    processDemo(demoId, steps).catch((err) => {
      console.error(`[Demo ${demoId}] Async processing error:`, err);
    });

    return reply.status(201).send({
      id: demoId,
      status: 'processing_narration',
    });
  });

  /**
   * GET /api/demos/:id
   * Get demo details with pre-signed URLs for all assets.
   */
  fastify.get('/api/demos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [demo] = await db
      .select()
      .from(schema.demos)
      .where(eq(schema.demos.id, id))
      .limit(1);

    if (!demo) {
      return reply.status(404).send({ error: 'Demo not found' });
    }

    const stepRows = await db
      .select()
      .from(schema.steps)
      .where(eq(schema.steps.demo_id, id))
      .orderBy(schema.steps.index);

    // Generate pre-signed URLs
    const steps = await Promise.all(
      stepRows.map(async (step) => ({
        index: step.index,
        description: step.description,
        narration: step.narration,
        screenshotUrl: step.screenshot_key
          ? await getR2Url(step.screenshot_key)
          : '',
        audioUrl: step.audio_key ? await getR2Url(step.audio_key) : null,
        durationMs: step.duration_ms,
        startTime: step.start_time,
        endTime: step.end_time,
        pageUrl: step.page_url,
        pageTitle: step.page_title,
        highlights: (step.highlights || []) as any,
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
