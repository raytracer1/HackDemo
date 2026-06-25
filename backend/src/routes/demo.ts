import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../db/index.js';
import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { uploadScreenshot, uploadAudio, getR2Url } from '../services/storage.js';
import { generateNarration } from '../services/narration.js';
import { generateAllVoiceovers } from '../services/voiceover.js';
import type { CreateDemoInput, DemoItem, DemoResponse, StepItem } from '../shared/types.js';

// ── Process demo async ──

async function processDemo(demoId: string, steps: StepItem[]): Promise<void> {
  try {
    console.log(`[Demo ${demoId}] Starting narration...`);
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: demoId },
      UpdateExpression: 'SET #status = :s, updated_at = :t',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':s': 'processing_narration', ':t': new Date().toISOString() },
    }));

    const stepInputs = steps.map((s) => ({
      index: s.index,
      description: s.description,
      pageContext: { title: s.page_title, url: s.page_url },
    }));

    const narrations = await generateNarration(stepInputs);

    // Update step narrations
    for (let i = 0; i < steps.length; i++) {
      steps[i].narration = narrations[i];
    }

    console.log(`[Demo ${demoId}] Narration done, starting voiceover...`);
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: demoId },
      UpdateExpression: 'SET #status = :s, #steps = :steps, updated_at = :t',
      ExpressionAttributeNames: { '#status': 'status', '#steps': 'steps' },
      ExpressionAttributeValues: {
        ':s': 'processing_audio',
        ':steps': steps,
        ':t': new Date().toISOString(),
      },
    }));

    const narrationItems = steps.map((s, i) => ({ index: i, narration: s.narration || '' }));
    const audioMap = await generateAllVoiceovers(narrationItems);

    for (const [index, audio] of audioMap) {
      const audioKey = await uploadAudio(demoId, index, audio.buffer);
      steps[index].audio_key = audioKey;
      steps[index].duration_ms = audio.durationMs;
    }

    // Mark complete
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: demoId },
      UpdateExpression: 'SET #status = :s, #steps = :steps, updated_at = :t',
      ExpressionAttributeNames: { '#status': 'status', '#steps': 'steps' },
      ExpressionAttributeValues: {
        ':s': 'completed',
        ':steps': steps,
        ':t': new Date().toISOString(),
      },
    }));

    console.log(`[Demo ${demoId}] Complete!`);
  } catch (err: any) {
    console.error(`[Demo ${demoId}] Failed:`, err.message);
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: demoId },
      UpdateExpression: 'SET #status = :s, updated_at = :t',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':s': 'failed', ':t': new Date().toISOString() },
    }));
  }
}

// ── Routes ──

export default async function demoRoutes(fastify: FastifyInstance) {

  // POST /api/demos
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

    let uploadSteps: CreateDemoInput['steps'];
    try { uploadSteps = JSON.parse(stepsJson); } catch {
      return reply.status(400).send({ error: 'Invalid steps JSON' });
    }
    if (uploadSteps.length === 0) {
      return reply.status(400).send({ error: 'No steps provided' });
    }

    const demoId = uuidv4();
    const now = new Date().toISOString();

    // Upload screenshots to R2 and build step items
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

    // Insert into DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        id: demoId,
        title,
        status: 'processing_narration',
        steps: stepItems,
        created_at: now,
        updated_at: now,
      },
    }));

    // Async processing
    processDemo(demoId, stepItems).catch((err) => {
      console.error(`[Demo ${demoId}] Async error:`, err);
    });

    return reply.status(201).send({ id: demoId, status: 'processing_narration' });
  });

  // GET /api/demos/:id
  fastify.get('/api/demos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }));

    if (!result.Item) {
      return reply.status(404).send({ error: 'Demo not found' });
    }

    const demo = result.Item as DemoItem;

    const steps = await Promise.all(
      demo.steps.map(async (step) => ({
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
