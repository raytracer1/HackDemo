/**
 * Extract frames from video using native browser Video + Canvas (no FFmpeg).
 * Uses play/pause to force frame decode on CORS sources (R2).
 */
export async function extractFrames(
  videoUrl: string,
  timestamps: number[]
): Promise<Array<{ time: number; dataUrl: string; stepIndex: number }>> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;

    const frames: Array<{ time: number; dataUrl: string; stepIndex: number }> = [];

    video.onloadedmetadata = async () => {
      var ratio = (video.videoHeight > 0) ? (video.videoWidth / video.videoHeight) : (16/9);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(720 * ratio);
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      const maxTime = video.duration * 1000 - 100;

      for (let i = 0; i < timestamps.length; i++) {
        const timeMs = Math.min(timestamps[i], maxTime);

        console.log(`[HackDemo] Extracting frame at ${(timeMs / 1000).toFixed(1)}s (${i + 1}/${timestamps.length})`);

        video.currentTime = timeMs / 1000;

        // Wait for seeked
        await new Promise<void>((r) => {
          const done = () => { video.removeEventListener('seeked', done); r(); };
          video.addEventListener('seeked', done);
          setTimeout(() => { video.removeEventListener('seeked', done); r(); }, 5000);
        });

        // Force decode: briefly play then pause. This is essential for CORS
        // video from R2 where the browser won't decode frames otherwise.
        await video.play().catch(() => {});
        video.pause();

        // Wait one animation frame for the decoded frame to settle
        await new Promise(r => requestAnimationFrame(r));

        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push({ time: timeMs, dataUrl: canvas.toDataURL('image/jpeg', 0.85), stepIndex: i });
        } else {
          console.warn(`[HackDemo] Skipped frame ${i} — video not ready (readyState=${video.readyState})`);
        }
      }

      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = videoUrl;
    video.load();
  });
}
