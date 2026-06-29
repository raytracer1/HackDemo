/**
 * Extract frames from video using native browser Video + Canvas (no FFmpeg).
 * Much lighter and more reliable than FFmpeg WASM for frame extraction.
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
      canvas.height = 720;
      canvas.width = Math.round(720 * ratio);
      const ctx = canvas.getContext('2d')!;
      const maxTime = video.duration * 1000 - 100; // safety margin — don't seek exactly to the end

      for (let i = 0; i < timestamps.length; i++) {
        const timeMs = Math.min(timestamps[i], maxTime);

        console.log(`[HackDemo] Extracting frame at ${(timeMs / 1000).toFixed(1)}s (${i + 1}/${timestamps.length})`);

        video.currentTime = timeMs / 1000;

        // Wait for seeked event
        let seeked = false;
        const onSeeked = () => { seeked = true; };
        video.addEventListener('seeked', onSeeked, { once: true });

        const start = Date.now();
        while (!seeked && Date.now() - start < 5000) {
          await new Promise(r => setTimeout(r, 50));
        }

        // After seeked, also wait for video data to be ready (especially near the end)
        const readyStart = Date.now();
        while (video.readyState < 2 && Date.now() - readyStart < 3000) {
          await new Promise(r => setTimeout(r, 100));
        }

        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push({ time: timeMs, dataUrl: canvas.toDataURL('image/jpeg', 0.85), stepIndex: i });
        } else {
          console.warn(`[HackDemo] Skipped frame ${i} — video not ready after seek (readyState=${video.readyState})`);
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
