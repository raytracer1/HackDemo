// Import compiled JS to avoid Vercel tsc errors from edge-tts source
import { tts } from 'edge-tts/out/index.js';

const VOICE_MAP: Record<string, string> = {
  'English (US)': 'en-US-AriaNeural',
  'English (UK)': 'en-GB-SoniaNeural',
  'Chinese (Mandarin)': 'zh-CN-XiaoxiaoNeural',
  'Chinese (Cantonese)': 'zh-HK-HiuMaanNeural',
  'Japanese': 'ja-JP-NanamiNeural',
  'Korean': 'ko-KR-SunHiNeural',
  'French': 'fr-FR-DeniseNeural',
  'German': 'de-DE-KatjaNeural',
  'Spanish': 'es-ES-ElviraNeural',
  'Portuguese': 'pt-BR-FranciscaNeural',
  'Italian': 'it-IT-ElsaNeural',
  'Russian': 'ru-RU-SvetlanaNeural',
  'Arabic': 'ar-SA-ZariyahNeural',
  'Hindi': 'hi-IN-SwaraNeural',
  'Dutch': 'nl-NL-ColetteNeural',
  'Polish': 'pl-PL-ZofiaNeural',
  'Turkish': 'tr-TR-EmelNeural',
  'Swedish': 'sv-SE-SofieNeural',
  'Thai': 'th-TH-PremwadeeNeural',
  'Vietnamese': 'vi-VN-HoaiMyNeural',
  'Indonesian': 'id-ID-GadisNeural',
};

export function getVoice(language: string): string {
  return VOICE_MAP[language] || 'en-US-AriaNeural';
}

export async function generateAudioForStep(
  narration: string,
  language?: string
): Promise<{ buffer: Buffer; durationMs: number }> {
  const voice = getVoice(language || 'English (US)');
  const buffer = await tts(narration, { voice, rate: '+0%' });

  const wordCount = narration.split(/\s+/).length;
  const durationMs = Math.ceil((wordCount / 150) * 60 * 1000) + 500;

  return { buffer, durationMs };
}
