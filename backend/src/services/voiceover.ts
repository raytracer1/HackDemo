const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const TTS_MODEL = 'tts-1';
const TTS_VOICE = 'alloy'; // alloy | nova | echo

interface NarrationItem {
  index: number;
  narration: string;
}

/**
 * Generate a single TTS audio file for a narration sentence.
 * Returns the audio as a Buffer.
 */
export async function generateAudioForStep(
  narration: string
): Promise<{ buffer: Buffer; durationMs: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: narration,
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI TTS error ${response.status}: ${text}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // Estimate duration: ~150 words per minute for natural speech,
  // plus a small pad for intro/outro
  const wordCount = narration.split(/\s+/).length;
  const durationMs = Math.ceil((wordCount / 150) * 60 * 1000) + 500;

  return { buffer, durationMs };
}

/**
 * Generate TTS audio for all steps that have narration.
 */
export async function generateAllVoiceovers(
  items: NarrationItem[]
): Promise<Map<number, { buffer: Buffer; durationMs: number }>> {
  const results = new Map<number, { buffer: Buffer; durationMs: number }>();

  for (const item of items) {
    if (!item.narration) continue;

    try {
      const audio = await generateAudioForStep(item.narration);
      results.set(item.index, audio);
    } catch (err) {
      console.error(`[TTS] Failed for step ${item.index}:`, err);
      throw err;
    }
  }

  return results;
}
