/**
 * Voiceover — Volcengine TTS v3 SSE (Header-based auth, no HMAC signing needed).
 */
const TTS_URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse';

// seed-tts-1.0 voice IDs
// seed-tts-1.0 supported languages (only those with dedicated voices)
const VOICES: Record<string, string> = {
  'English (US)': 'en_female_lauren_moon_bigtts',
  'English (UK)': 'en_female_emily_mars_bigtts',
  'Chinese (Mandarin)': 'zh_female_vv_mars_bigtts',
  'Chinese (Cantonese)': 'zh_female_vv_mars_bigtts',
  'Japanese': 'multi_female_sophie_conversation_wvae_bigtts',
  'Spanish': 'multi_female_maomao_conversation_wvae_bigtts',
  default: 'en_female_lauren_moon_bigtts',
};
function voice(lang: string): string { return VOICES[lang] || VOICES.default; }

export async function generateAudioForStep(narration: string, language?: string): Promise<{ buffer: Buffer; durationMs: number }> {
  const appId = process.env.VOLC_APP_ID || '';
  const token = process.env.VOLC_ACCESS_TOKEN || '';

  const langCode: Record<string, string> = { 'English (US)': 'en', 'English (UK)': 'en', 'Chinese (Mandarin)': 'zh-cn', 'Japanese': 'ja' };
  const el = langCode[language || 'English (US)'] || 'en';
  const body = JSON.stringify({
    user: { uid: 'hackdemo' },
    req_params: {
      speaker: voice(language || 'English (US)'),
      audio_params: { format: 'mp3', sample_rate: 24000 },
      text: narration,
      additions: JSON.stringify({ explicit_language: el }),
    },
  });

  const resp = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-App-Id': appId,
      'X-Api-Access-Key': token,
      'X-Api-Resource-Id': 'seed-tts-1.0',
      'X-Api-Connect-Id': crypto.randomUUID(),
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Volc TTS ${resp.status}: ${text.slice(0, 300)}`);
  }

  // SSE response: collect audio chunks
  const text = await resp.text();
  const buffers: Buffer[] = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('data:')) {
      try {
        const data = JSON.parse(line.slice(5));
        if (data.data) buffers.push(Buffer.from(data.data, 'base64'));
        else if (data.audio) buffers.push(Buffer.from(data.audio, 'base64'));
      } catch (_) {}
    }
  }
  if (buffers.length === 0) throw new Error(`Volc TTS: no audio in SSE response. Body: ${text.slice(0, 500)}`);

  const full = Buffer.concat(buffers);
  const ms = Math.ceil((narration.split(/\s+/).length / 150) * 60000) + 500;
  return { buffer: full, durationMs: ms };
}

export async function generateAllVoiceovers(items: Array<{ index: number; narration: string }>, lang?: string) {
  const m = new Map<number, { buffer: Buffer; durationMs: number }>();
  await Promise.all(items.filter(i => i.narration).map(async i => m.set(i.index, await generateAudioForStep(i.narration, lang))));
  return m;
}
