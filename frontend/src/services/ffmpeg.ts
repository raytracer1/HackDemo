import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { StepData } from '../shared/types';
import { annotateScreenshot } from './canvas-annotate';

const CORE_URL = '/ffmpeg/ffmpeg-core.js';
const WASM_URL = '/ffmpeg/ffmpeg-core.wasm';

export interface SynthesisProgress {
  status: 'loading_assets' | 'synthesizing' | 'completed' | 'error';
  percent: number;
  message: string;
}

type ProgressCallback = (progress: SynthesisProgress) => void;

/**
 * Synthesize a demo video from screenshots + audio using FFmpeg WASM.
 *
 * Strategy:
 * 1. Load each screenshot image, scale to 720p
 * 2. Create a video segment for each step (image shown for step.durationMs)
 * 3. Download each audio file
 * 4. Concatenate video segments + concatenate audio
 * 5. Mux into MP4
 */
export async function synthesizeVideo(
  steps: StepData[],
  onProgress: ProgressCallback
): Promise<Blob> {
  const ffmpeg = new FFmpeg();

  // Load FFmpeg core
  onProgress({ status: 'loading_assets', percent: 0, message: 'Loading FFmpeg...' });

  await ffmpeg.load({
    coreURL: await toBlobURL(CORE_URL, 'text/javascript'),
    wasmURL: await toBlobURL(WASM_URL, 'application/wasm'),
  });

  const validSteps = steps.filter((s) => s.audioUrl && s.durationMs && s.screenshotUrl);
  if (validSteps.length === 0) {
    throw new Error('No steps with audio and screenshots');
  }

  onProgress({
    status: 'loading_assets',
    percent: 10,
    message: `Downloading ${validSteps.length} screenshots...`,
  });

  // Download all screenshots, annotate with highlights, and load audio
  for (let i = 0; i < validSteps.length; i++) {
    const step = validSteps[i];
    const percent = 10 + Math.round((i / validSteps.length) * 40);

    onProgress({
      status: 'loading_assets',
      percent,
      message: `Annotating step ${i + 1}/${validSteps.length}...`,
    });

    // Fetch original screenshot
    const originalData = await fetchFile(step.screenshotUrl);
    const originalDataUrl = URL.createObjectURL(
      new Blob([originalData as BlobPart], { type: 'image/png' })
    );

    // Annotate with highlights (if any)
    let finalDataUrl = originalDataUrl;
    if (step.highlights && step.highlights.length > 0) {
      try {
        finalDataUrl = await annotateScreenshot(originalDataUrl, step.highlights, step.narration);
      } catch (e) {
        // Fall back to original if annotation fails
        console.warn('Annotation failed for step', i, e);
      }
    }

    // Write annotated (or original) screenshot to FFmpeg
    await ffmpeg.writeFile(`step_${i}.png`, await fetchFile(finalDataUrl));

    // Clean up blob URLs
    URL.revokeObjectURL(originalDataUrl);
    if (finalDataUrl !== originalDataUrl) URL.revokeObjectURL(finalDataUrl);

    // Write audio
    if (step.audioUrl) {
      await ffmpeg.writeFile(`audio_${i}.mp3`, await fetchFile(step.audioUrl));
    }
  }

  onProgress({
    status: 'synthesizing',
    percent: 50,
    message: 'Creating video from screenshots...',
  });

  // Build filter complex for concatenating images with audio
  // For each step: create a segment from the image + audio
  const filterParts: string[] = [];
  const concatInputs: string[] = [];

  for (let i = 0; i < validSteps.length; i++) {
    const step = validSteps[i];
    const durationSec = (step.durationMs! / 1000).toFixed(2);

    // Loop the image for the duration, then fade out
    filterParts.push(
      `[${i}:v]loop=loop=-1:size=1:start=0,trim=duration=${durationSec},fade=t=out:st=${Math.max(0, parseFloat(durationSec) - 0.5)}:d=0.5,setpts=PTS-STARTPTS[v${i}]`
    );

    // Audio: trim to match duration
    if (step.audioUrl) {
      filterParts.push(
        `[${validSteps.length + i}:a]atrim=duration=${durationSec},afade=t=out:st=${Math.max(0, parseFloat(durationSec) - 0.5)}:d=0.5,asetpts=PTS-STARTPTS[a${i}]`
      );
    }
  }

  // Concatenate all video segments
  const vInputs = Array.from({ length: validSteps.length }, (_, i) => `[v${i}]`).join('');
  filterParts.push(`${vInputs}concat=n=${validSteps.length}:v=1:a=0[v]`);

  // Concatenate all audio segments
  const aInputs = Array.from({ length: validSteps.length }, (_, i) => `[a${i}]`).join('');
  filterParts.push(`${aInputs}concat=n=${validSteps.length}:v=0:a=1[a]`);

  // Build input args
  const args: string[] = [];
  for (let i = 0; i < validSteps.length; i++) {
    args.push('-loop', '1', '-t', '1', '-i', `step_${i}.png`);
  }
  for (let i = 0; i < validSteps.length; i++) {
    if (validSteps[i].audioUrl) {
      args.push('-i', `audio_${i}.mp3`);
    }
  }

  // Filter complex
  args.push('-filter_complex', filterParts.join(';'));

  // Map outputs
  args.push('-map', '[v]', '-map', '[a]');

  // Output settings
  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    '-movflags', '+faststart',
    'output.mp4'
  );

  onProgress({
    status: 'synthesizing',
    percent: 70,
    message: 'Encoding video...',
  });

  // Execute FFmpeg
  await ffmpeg.exec(args);

  onProgress({
    status: 'synthesizing',
    percent: 95,
    message: 'Finalizing...',
  });

  // Read output
  const data = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([data as BlobPart], { type: 'video/mp4' });

  onProgress({
    status: 'completed',
    percent: 100,
    message: 'Video ready!',
  });

  return blob;
}
