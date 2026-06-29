import 'dotenv/config';
import * as Ably from 'ably';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';
const WORKER_SECRET = process.env.WORKER_SECRET || '';

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WORKER_SECRET}`,
  };
}

// ── Backend API helpers ──
async function getDemo(id: string): Promise<any> {
  const resp = await fetch(`${BACKEND}/api/demos/${id}`, { headers: authHeaders() });
  if (!resp.ok) throw new Error(`GET demo failed: ${resp.status}`);
  return resp.json();
}

async function getCredits(id: string): Promise<{ credits: number; minCredits: number }> {
  const resp = await fetch(`${BACKEND}/api/demos/${id}/credits`, { headers: authHeaders() });
  if (!resp.ok) throw new Error(`Credits check failed: ${resp.status}`);
  const data = await resp.json() as any;
  return {
    credits: data.credits || 0,
    minCredits: data.minCredits || 0.10,
  };
}

async function updateDemo(id: string, status: string, steps?: any[]) {
  await updateDemoWithTokens(id, status, steps, 0);
}

async function updateDemoWithTokens(id: string, status: string, steps: any[] | undefined, tokenCount: number, failReason?: string) {
  const body: any = { status };
  if (steps) body.steps = steps;
  if (tokenCount > 0) body.token_count = tokenCount;
  if (failReason) body.fail_reason = failReason;
  const resp = await fetch(`${BACKEND}/api/demos/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`PUT demo failed: ${resp.status}`);
}

// ── DeepSeek ──
async function generateNarration(steps: any[], language?: string, demoType?: string): Promise<{ narrations: string[]; totalTokens: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY!;
  const lang = language || 'English (US)';
  const type = (demoType || 'product-demo').replace(/-/g, ' ');

  const userPrompt = `Here are ${steps.length} demo steps. Generate exactly ${steps.length} narration sentences.\n\n` +
    JSON.stringify(steps.map((s: any) => ({ index: s.index, description: s.description, page: s.pageTitle })), null, 2) +
    `\n\nReturn a JSON array of exactly ${steps.length} strings.`;

  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat', temperature: 0.7, max_tokens: 8192,
      messages: [
        { role: 'system', content: `You are a HackDemo narration writer. Write in ${lang}. One sentence per step. Return ONLY a JSON array.` },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`DeepSeek API ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json() as any;
  const usage = data.usage;
  const totalTokens: number = usage?.total_tokens || 0;
  console.log('[Worker] DeepSeek tokens:', JSON.stringify(usage));
  console.log('[Worker] DeepSeek full response:', JSON.stringify(data).slice(0, 800));
  const content = data.choices?.[0]?.message?.content || '';
  if (!content) throw new Error('DeepSeek returned empty content');
  var match = content.match(/\[[\s\S]*\]/);
  // If truncated, try to fix the JSON by completing it
  if (!match) {
    var lastComma = content.lastIndexOf(',');
    if (lastComma > 0) {
      var fixed = content.slice(0, lastComma) + '\n]';
      match = fixed.match(/\[[\s\S]*\]/);
    }
  }
  if (!match) throw new Error(`Narration parse failed. Content: ${content.slice(0, 300)}`);
  var narrations = JSON.parse(match[0]);
  if (narrations.length < steps.length) {
    while (narrations.length < steps.length) narrations.push('Demo step ' + (narrations.length + 1));
  }
  return { narrations: narrations.slice(0, steps.length), totalTokens };
}

// ── Processing ──
async function processDemo(demoId: string): Promise<void> {
  console.log(`[Worker] Processing ${demoId}`);
  const demo = await getDemo(demoId);
  if (demo.status === 'completed' || demo.status === 'failed') return;

  const steps = demo.steps || [];
  const language = demo.language || 'English (US)';
  const demoType = demo.demo_type || 'product-demo';

  try {
    // Check credits before spending AI tokens
    const { credits, minCredits } = await getCredits(demoId);
    if (credits < minCredits) {
      console.log(`[Worker] Insufficient credits: $${credits} < $${minCredits}`);
      await updateDemoWithTokens(demoId, 'failed', null, 0, 'insufficient_credits');
      return;
    }

    // Step 1: Narration
    console.log(`[Worker] Narration...`);
    await updateDemo(demoId, 'processing_narration');
    const { narrations, totalTokens } = await generateNarration(steps, language, demoType);
    for (let i = 0; i < steps.length; i++) steps[i].narration = narrations[i];
    await updateDemoWithTokens(demoId, 'narration_done', steps, totalTokens);
    console.log(`[Worker] Narration done (${totalTokens} tokens)`);

    // Step 2: Voiceover → delegate to backend (parallel TTS with max 5 concurrent)
    console.log(`[Worker] Voiceover (delegating to backend)...`);
    await updateDemo(demoId, 'processing_audio');
    const ttsResp = await fetch(`${BACKEND}/api/demos/${demoId}/tts`, {
      method: 'POST',
      headers: authHeaders(),
      body: '{}',
    });
    if (!ttsResp.ok) {
      const errText = await ttsResp.text().catch(() => '');
      throw new Error(`Backend TTS failed ${ttsResp.status}: ${errText.slice(0, 200)}`);
    }
    const ttsData = await ttsResp.json() as any;
    for (const audio of (ttsData.audios || [])) {
      steps[audio.index].audio_key = audio.key;
      steps[audio.index].duration_ms = audio.durationMs;
    }
    await updateDemo(demoId, 'completed', steps);
    console.log(`[Worker] Complete (${ttsData.audios?.length || 0} steps)`);
  } catch (err: any) {
    console.error(`[Worker] Failed:`, err.message);
    await updateDemoWithTokens(demoId, 'failed', null, 0, 'ai_processing_error');
  }
}

// ── Ably + Adaptive Polling ──
const MIN_POLL = 30000;   // 30s
const MAX_POLL = 1200000; // 1200s (20 min)
let pollInterval = MIN_POLL;

function schedulePoll() {
  setTimeout(async () => {
    const found = await pollPending();
    pollInterval = found ? MIN_POLL : Math.min(pollInterval * 2, MAX_POLL);
    schedulePoll();
  }, pollInterval);
}

async function pollPending() {
  try {
    const resp = await fetch(`${BACKEND}/api/demos?status=pending`, { headers: authHeaders() });
    if (!resp.ok) return false;
    const demos = await resp.json() as any[];
    for (const demo of demos) {
      if (demo.status === 'processing' || demo.status === 'narration_done') {
        console.log(`[Worker] Poll found: ${demo.id}`);
        await processDemo(demo.id);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Worker] Poll failed:', (err as Error).message);
  }
  return false;
}

async function main() {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) { console.error('ABLY_API_KEY required'); process.exit(1); }

  const ably = new Ably.Realtime({ key: apiKey });
  const channel = ably.channels.get('hackdemo-jobs');
  console.log('[Worker] Ably + adaptive polling on', BACKEND);

  await channel.subscribe('new-demo', async (msg: any) => {
    console.log(`[Worker] Ably job: ${msg.data.demoId}`);
    await processDemo(msg.data.demoId);
  });

  schedulePoll();
  pollPending();
}

main().catch(console.error);
