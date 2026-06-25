// Import compiled JS to avoid Vercel tsc errors from edge-tts source
import { tts } from 'edge-tts/out/index.js';

const VOICE = 'en-US-AriaNeural';

export async function generateAudioForStep(
  narration: string
): Promise<{ buffer: Buffer; durationMs: number }> {
  const buffer = await tts(narration, { voice: VOICE, rate: '+0%' });

  const wordCount = narration.split(/\s+/).length;
  const durationMs = Math.ceil((wordCount / 150) * 60 * 1000) + 500;

  return { buffer, durationMs };
}
