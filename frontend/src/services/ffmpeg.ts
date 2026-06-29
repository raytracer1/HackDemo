import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { StepData } from '../shared/types';
import { annotateScreenshot } from './canvas-annotate';

function getBase() { return typeof window !== 'undefined' ? window.location.origin : ''; }
function getCoreUrl() { return getBase() + '/ffmpeg/ffmpeg-core.js'; }
function getWasmUrl() { return getBase() + '/ffmpeg/ffmpeg-core.wasm'; }
function getWorkerUrl() { return getBase() + '/ffmpeg/ffmpeg-core.worker.js'; }

export interface SynthesisProgress {
  status: 'loading_assets' | 'synthesizing' | 'completed' | 'error';
  percent: number;
  message: string;
}

type ProgressCallback = (progress: SynthesisProgress) => void;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegReady = false;

export async function preloadFfmpeg(): Promise<void> {
  if (ffmpegReady) return;
  if (!ffmpegInstance) ffmpegInstance = new FFmpeg();
  await ffmpegInstance.load({ coreURL: getCoreUrl(), wasmURL: getWasmUrl(), workerURL: getWorkerUrl() });
  ffmpegReady = true;
}

export async function synthesizeVideo(
  steps: StepData[],
  onProgress: ProgressCallback
): Promise<Blob> {
  if (!ffmpegInstance) ffmpegInstance = new FFmpeg();
  if (!ffmpegReady) {
    onProgress({ status: 'loading_assets', percent: 0, message: 'Loading FFmpeg...' });
    await ffmpegInstance.load({ coreURL: getCoreUrl(), wasmURL: getWasmUrl(), workerURL: getWorkerUrl() });
    ffmpegReady = true;
  }
  const ffmpeg = ffmpegInstance;

  const validSteps = steps.filter((s) => s.audioUrl && s.durationMs && s.screenshotUrl);
  if (validSteps.length === 0) {
    throw new Error('No steps with audio and screenshots');
  }

  onProgress({
    status: 'loading_assets',
    percent: 10,
    message: `Downloading ${validSteps.length} screenshots...`,
  });

  for (let i = 0; i < validSteps.length; i++) {
    const step = validSteps[i];
    const percent = 10 + Math.round((i / validSteps.length) * 40);

    onProgress({
      status: 'loading_assets',
      percent,
      message: `Annotating step ${i + 1}/${validSteps.length}...`,
    });

    const originalData = await fetchFile(step.screenshotUrl);
    const originalDataUrl = URL.createObjectURL(
      new Blob([originalData as BlobPart], { type: 'image/png' })
    );

    let finalDataUrl = originalDataUrl;
    if (step.narration) {
      try {
        finalDataUrl = await annotateScreenshot(originalDataUrl, [], step.narration);
      } catch (e) {
        console.warn('Subtitle failed for step', i, e);
      }
    }

    await ffmpeg.writeFile(`step_${i}.png`, await fetchFile(finalDataUrl));
    URL.revokeObjectURL(originalDataUrl);
    if (finalDataUrl !== originalDataUrl) URL.revokeObjectURL(finalDataUrl);

    if (step.audioUrl) {
      await ffmpeg.writeFile(`audio_${i}.mp3`, await fetchFile(step.audioUrl));
    }
  }

  onProgress({
    status: 'synthesizing',
    percent: 50,
    message: 'Creating video from screenshots...',
  });

  const filterParts: string[] = [];
  const concatInputs: string[] = [];

  for (let i = 0; i < validSteps.length; i++) {
    const step = validSteps[i];
    const durationSec = (step.durationMs! / 1000).toFixed(2);

    filterParts.push(
      `[${i}:v]loop=loop=-1:size=1:start=0,trim=duration=${durationSec},setpts=PTS-STARTPTS[v${i}]`
    );

    if (step.audioUrl) {
      filterParts.push(
        `[${validSteps.length + i}:a]atrim=duration=${durationSec},asetpts=PTS-STARTPTS[a${i}]`
      );
    }
  }

  const vInputs = Array.from({ length: validSteps.length }, (_, i) => `[v${i}]`).join('');
  filterParts.push(`${vInputs}concat=n=${validSteps.length}:v=1:a=0[v]`);

  const aInputs = Array.from({ length: validSteps.length }, (_, i) => `[a${i}]`).join('');
  filterParts.push(`${aInputs}concat=n=${validSteps.length}:v=0:a=1[a]`);

  const args: string[] = [];
  for (let i = 0; i < validSteps.length; i++) {
    args.push('-loop', '1', '-t', '1', '-i', `step_${i}.png`);
  }
  for (let i = 0; i < validSteps.length; i++) {
    if (validSteps[i].audioUrl) {
      args.push('-i', `audio_${i}.mp3`);
    }
  }

  args.push('-filter_complex', filterParts.join(';'));
  args.push('-map', '[v]', '-map', '[a]');

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

  onProgress({ status: 'synthesizing', percent: 70, message: 'Encoding video...' });
  await ffmpeg.exec(args);

  onProgress({ status: 'synthesizing', percent: 95, message: 'Finalizing...' });

  const data = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([data as BlobPart], { type: 'video/mp4' });

  onProgress({ status: 'completed', percent: 100, message: 'Video ready!' });
  return blob;
}
