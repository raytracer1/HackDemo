import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CORE_URL = '/ffmpeg/ffmpeg-core.js';
const WASM_URL = '/ffmpeg/ffmpeg-core.wasm';

/**
 * Extract JPEG frames from a video at given timestamps (in ms).
 * Returns an array of { time: number, dataUrl: string }.
 */
export async function extractFrames(
  videoUrl: string,
  timestamps: number[]
): Promise<Array<{ time: number; dataUrl: string }>> {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(CORE_URL, 'text/javascript') as any,
    wasmURL: await toBlobURL(WASM_URL, 'application/wasm') as any,
  });

  // Download video
  console.log('[HackDemo] Downloading video for frame extraction...');
  await ffmpeg.writeFile('input.webm', await fetchFile(videoUrl));

  const frames: Array<{ time: number; dataUrl: string }> = [];

  for (let i = 0; i < timestamps.length; i++) {
    const timeMs = timestamps[i];
    const timeSec = (timeMs / 1000).toFixed(3);

    console.log(`[HackDemo] Extracting frame at ${timeSec}s (${i + 1}/${timestamps.length})`);

    // Extract a single frame at the given timestamp
    await ffmpeg.exec([
      '-ss', timeSec,
      '-i', 'input.webm',
      '-vframes', '1',
      '-q:v', '5',
      `frame_${i}.jpg`,
    ]);

    const data = await ffmpeg.readFile(`frame_${i}.jpg`);
    const blob = new Blob([data as BlobPart], { type: 'image/jpeg' });
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    frames.push({ time: timeMs, dataUrl });
  }

  return frames;
}
