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

async function updateDemo(id: string, status: string, steps?: any[]) {
  const body: any = { status };
  if (steps) body.steps = steps;
  const resp = await fetch(`${BACKEND}/api/demos/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
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
  return narrations.slice(0, steps.length);
}

// ── MP3 duration ──

function getMp3Duration(buf: Buffer): number {
  if (buf.length < 4) return 0;

  let offset = 0;

  // Skip ID3v2 tag
  if (
    buf.length >= 10 &&
    buf.toString("ascii", 0, 3) === "ID3"
  ) {
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f);

    offset = 10 + size;
  }

  const bitrateTableV1L3 = [
    0, 32, 40, 48, 56, 64, 80, 96,
    112, 128, 160, 192, 224, 256, 320, 0,
  ];

  const bitrateTableV2L3 = [
    0, 8, 16, 24, 32, 40, 48, 56,
    64, 80, 96, 112, 128, 144, 160, 0,
  ];

  const sampleRateTable: Record<number, number[]> = {
    3: [44100, 48000, 32000], // MPEG1
    2: [22050, 24000, 16000], // MPEG2
    0: [11025, 12000, 8000],  // MPEG2.5
  };

  let totalSamples = 0;
  let sampleRate = 0;

  while (offset + 4 <= buf.length) {
    // Sync word
    if (
      buf[offset] !== 0xff ||
      (buf[offset + 1] & 0xe0) !== 0xe0
    ) {
      offset++;
      continue;
    }

    const b1 = buf[offset + 1];
    const b2 = buf[offset + 2];

    const version = (b1 >> 3) & 0x03;
    const layer = (b1 >> 1) & 0x03;

    // Reserved MPEG version
    if (version === 1) {
      offset++;
      continue;
    }

    // Layer III only
    if (layer !== 1) {
      offset++;
      continue;
    }

    const bitrateIndex = (b2 >> 4) & 0x0f;
    const sampleRateIndex = (b2 >> 2) & 0x03;
    const padding = (b2 >> 1) & 0x01;

    if (
      bitrateIndex === 0 ||
      bitrateIndex === 15 ||
      sampleRateIndex === 3
    ) {
      offset++;
      continue;
    }

    const currentSampleRate =
      sampleRateTable[version]?.[sampleRateIndex];

    if (!currentSampleRate) {
      offset++;
      continue;
    }

    if (sampleRate === 0) {
      sampleRate = currentSampleRate;
    }

    const isMpeg1 = version === 3;

    const bitrate = isMpeg1
      ? bitrateTableV1L3[bitrateIndex]
      : bitrateTableV2L3[bitrateIndex];

    const samplesPerFrame = isMpeg1 ? 1152 : 576;

    const frameLength = isMpeg1
      ? Math.floor((144000 * bitrate) / currentSampleRate) + padding
      : Math.floor((72000 * bitrate) / currentSampleRate) + padding;

    if (
      frameLength <= 0 ||
      offset + frameLength > buf.length
    ) {
      break;
    }

    totalSamples += samplesPerFrame;
    offset += frameLength;
  }

  if (sampleRate === 0 || totalSamples === 0) {
    return 0;
  }

  return Math.round((totalSamples * 1000) / sampleRate);
}

// ── Google TTS (free, no API key, reliable) ──
var LANG_MAP: Record<string, string> = {
  'English (US)': 'en', 'English (UK)': 'en',
  'Chinese (Mandarin)': 'zh-CN', 'Chinese (Cantonese)': 'zh-CN',
  'Japanese': 'ja', 'Korean': 'ko',
  'Spanish': 'es', 'French': 'fr', 'German': 'de',
  'Portuguese': 'pt', 'Italian': 'it', 'Russian': 'ru',
  'Arabic': 'ar', 'Hindi': 'hi', 'Dutch': 'nl',
  'Polish': 'pl', 'Turkish': 'tr', 'Swedish': 'sv',
  'Thai': 'th', 'Vietnamese': 'vi', 'Indonesian': 'id',
};

function getLang(language?: string): string { return LANG_MAP[language || 'English (US)'] || 'en'; }

async function generateAudioWithRetry(narration: string, language?: string, retries = 3): Promise<{ buffer: Buffer; durationMs: number }> {
  for (var attempt = 1; attempt <= retries; attempt++) {
    try {
      return await generateAudio(narration, language);
    } catch (err: any) {
      console.warn(`[Worker] TTS attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('TTS failed after retries');
}

async function generateAudio(narration: string, language?: string): Promise<{ buffer: Buffer; durationMs: number }> {
  var tl = getLang(language);
  var chunks = splitText(narration, 180);
  var buffers: Buffer[] = [];
  for (var ci = 0; ci < chunks.length; ci++) {
    var url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunks[ci])}&tl=${tl}&client=tw-ob`;
    var resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new Error(`Google TTS ${resp.status}`);
    var buf = Buffer.from(await resp.arrayBuffer());
    buffers.push(buf);
  }
  var full = Buffer.concat(buffers);
  var ms = getMp3Duration(full);
  return { buffer: full, durationMs: ms };
}

function splitText(text: string, maxLen: number): string[] {
  var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  var result: string[] = [];
  var cur = '';
  for (var si = 0; si < sentences.length; si++) {
    if (cur.length + sentences[si].length > maxLen && cur.length > 0) { result.push(cur.trim()); cur = ''; }
    cur += sentences[si];
  }
  if (cur.trim()) result.push(cur.trim());
  return result.length > 0 ? result : [text];
}

// ── Upload audio via backend ──
async function uploadAudio(demoId: string, index: number, buffer: Buffer, durationMs: number): Promise<string> {
  const resp = await fetch(`${BACKEND}/api/demos/${demoId}/audio`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ index, audio: buffer.toString('base64'), duration_ms: durationMs }),
  });
  if (!resp.ok) throw new Error(`Audio upload failed: ${resp.status}`);
  const data = await resp.json() as any;
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
    var ttsTasks = steps.filter((s: any) => s.narration).map(async (s: any, idx: number) => {
      try {
        const audio = await generateAudioWithRetry(s.narration, language);
        const key = await uploadAudio(demoId, s.index, audio.buffer, audio.durationMs);
        return { index: s.index, key, durationMs: audio.durationMs };
      } catch (err: any) {
        console.warn(`[Worker] TTS failed for step ${s.index}:`, err.message);
        return null;
      }
    });
    var results = await Promise.all(ttsTasks);
    for (const r of results) {
      if (r) { steps[r.index].audio_key = r.key; steps[r.index].duration_ms = r.durationMs; }
    }
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
