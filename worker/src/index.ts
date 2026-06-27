import 'dotenv/config';
import * as Ably from 'ably';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';

// ── Backend API helpers ──
async function getDemo(id: string) {
  const resp = await fetch(`${BACKEND}/api/demos/${id}`);
  if (!resp.ok) throw new Error(`GET demo failed: ${resp.status}`);
  return resp.json();
}

async function updateDemo(id: string, status: string, steps?: any[]) {
  const body: any = { status };
  if (steps) body.steps = steps;
  const resp = await fetch(`${BACKEND}/api/demos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`PUT demo failed: ${resp.status}`);
}

// ── DeepSeek ──
async function generateNarration(steps: any[], language?: string, demoType?: string): Promise<string[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY!;
  const lang = language || 'English (US)';
  const type = (demoType || 'product-demo').replace(/-/g, ' ');

  const userPrompt = `Here are ${steps.length} demo steps. Generate exactly ${steps.length} narration sentences.\n\n` +
    JSON.stringify(steps.map((s: any) => ({ index: s.index, description: s.description, page: s.pageTitle })), null, 2) +
    `\n\nReturn a JSON array of exactly ${steps.length} strings.`;

  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat', temperature: 0.7, max_tokens: Math.max(2000, steps.length * 100),
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
  console.log('[Worker] DeepSeek full response:', JSON.stringify(data).slice(0, 800));
  const content = data.choices?.[0]?.message?.content || '';
  if (!content) throw new Error('DeepSeek returned empty content');
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`Narration parse failed. Content: ${content.slice(0, 300)}`);
  return JSON.parse(match[0]);
}

// ── Volcengine TTS ──
const VOICES: Record<string, string> = {
  'English (US)': 'en_female_lauren_moon_bigtts', 'English (UK)': 'en_female_emily_mars_bigtts',
  'Chinese (Mandarin)': 'zh_female_vv_mars_bigtts', 'Chinese (Cantonese)': 'zh_female_vv_mars_bigtts',
  'Japanese': 'multi_female_sophie_conversation_wvae_bigtts', 'Spanish': 'multi_female_maomao_conversation_wvae_bigtts',
};
const LANG_CODES: Record<string, string> = { 'English (US)': 'en', 'English (UK)': 'en', 'Chinese (Mandarin)': 'zh-cn', 'Japanese': 'ja' };

async function generateAudio(narration: string, language?: string): Promise<{ buffer: Buffer; durationMs: number }> {
  const speaker = VOICES[language || 'English (US)'] || VOICES['English (US)'];
  const el = LANG_CODES[language || 'English (US)'] || 'en';
  const resp = await fetch('https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-App-Id': process.env.VOLC_APP_ID || '', 'X-Api-Access-Key': process.env.VOLC_ACCESS_TOKEN || '',
      'X-Api-Resource-Id': 'seed-tts-1.0', 'X-Api-Connect-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({
      user: { uid: 'hackdemo-worker' },
      req_params: { speaker, audio_params: { format: 'mp3', sample_rate: 24000 }, text: narration, additions: JSON.stringify({ explicit_language: el }) },
    }),
  });
  const text = await resp.text();
  const buffers: Buffer[] = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('data:')) try { const d = JSON.parse(line.slice(5)); if (d.data) buffers.push(Buffer.from(d.data, 'base64')); } catch (_) {}
  }
  if (buffers.length === 0) throw new Error('No audio');
  const ms = Math.ceil((narration.split(/\s+/).length / 150) * 60000) + 500;
  return { buffer: Buffer.concat(buffers), durationMs: ms };
}

// ── Upload audio via backend ──
async function uploadAudio(demoId: string, index: number, buffer: Buffer, durationMs: number): Promise<string> {
  const resp = await fetch(`${BACKEND}/api/demos/${demoId}/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index, audio: buffer.toString('base64'), duration_ms: durationMs }),
  });
  if (!resp.ok) throw new Error(`Audio upload failed: ${resp.status}`);
  const data = await resp.json();
  return data.key;
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
    // Step 1: Narration
    console.log(`[Worker] Narration...`);
    await updateDemo(demoId, 'processing_narration');
    const narrations = await generateNarration(steps, language, demoType);
    for (let i = 0; i < steps.length; i++) steps[i].narration = narrations[i];
    await updateDemo(demoId, 'narration_done', steps);
    console.log(`[Worker] Narration done`);

    // Step 2: Voiceover
    console.log(`[Worker] Voiceover...`);
    await updateDemo(demoId, 'processing_audio');
    const results = await Promise.all(
      steps.filter((s: any) => s.narration).map(async (s: any) => {
        const audio = await generateAudio(s.narration, language);
        const key = await uploadAudio(demoId, s.index, audio.buffer, audio.durationMs);
        return { index: s.index, key, durationMs: audio.durationMs };
      })
    );
    for (const r of results) { steps[r.index].audio_key = r.key; steps[r.index].duration_ms = r.durationMs; }
    await updateDemo(demoId, 'completed', steps);
    console.log(`[Worker] Complete`);
  } catch (err: any) {
    console.error(`[Worker] Failed:`, err.message);
    await updateDemo(demoId, 'failed');
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
    const resp = await fetch(`${BACKEND}/api/demos?status=pending`);
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
