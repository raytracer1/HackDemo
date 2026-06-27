/**
 * Voiceover using Google Translate TTS (free, reliable, no API key).
 */
const GOOGLE_TTS_BASE = 'https://translate.google.com/translate_tts';

function getVoice(language: string): { tl: string } {
  const map: Record<string, string> = {
    'English (US)': 'en',
    'English (UK)': 'en',
    'Chinese (Mandarin)': 'zh-CN',
    'Chinese (Cantonese)': 'zh-CN',
    'Japanese': 'ja',
    'Korean': 'ko',
    'French': 'fr',
    'German': 'de',
    'Spanish': 'es',
    'Portuguese': 'pt',
    'Italian': 'it',
    'Russian': 'ru',
    'Arabic': 'ar',
    'Hindi': 'hi',
    'Dutch': 'nl',
    'Polish': 'pl',
    'Turkish': 'tr',
    'Swedish': 'sv',
    'Thai': 'th',
    'Vietnamese': 'vi',
    'Indonesian': 'id',
  };
  return { tl: map[language] || 'en' };
}

export async function generateAudioForStep(
  narration: string,
  language?: string
): Promise<{ buffer: Buffer; durationMs: number }> {
  const { tl } = getVoice(language || 'English (US)');

  // Google TTS: split long text into chunks
  const maxLen = 180;
  const texts = splitText(narration, maxLen);
  const buffers: Buffer[] = [];

  for (const text of texts) {
    const url = `${GOOGLE_TTS_BASE}?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!resp.ok) throw new Error(`Google TTS error ${resp.status}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    buffers.push(buf);
  }

  const full = Buffer.concat(buffers);
  const wordCount = narration.split(/\s+/).length;
  const durationMs = Math.ceil((wordCount / 150) * 60 * 1000) + 500;

  return { buffer: full, durationMs };
}

function splitText(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += s;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

export async function generateAllVoiceovers(
  items: Array<{ index: number; narration: string }>,
  language?: string
): Promise<Map<number, { buffer: Buffer; durationMs: number }>> {
  const results = new Map<number, { buffer: Buffer; durationMs: number }>();
  for (const item of items) {
    if (!item.narration) continue;
    const audio = await generateAudioForStep(item.narration, language);
    results.set(item.index, audio);
  }
  return results;
}
