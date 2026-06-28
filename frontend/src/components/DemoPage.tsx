import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDemoData } from '../hooks/useDemoData';
import { synthesizeVideo, SynthesisProgress } from '../services/ffmpeg';
import { extractFrames } from '../services/video-frames';
import { generateMarkdown } from '../services/markdown';
import VideoPlayer from './VideoPlayer';
import StepTimeline from './StepTimeline';
import DownloadBar from './DownloadBar';
import type { SynthesisStatus, StepData } from '../shared/types';

export default function DemoPage() {
  const { demoId } = useParams<{ demoId: string }>();
  const { demo, loading, error } = useDemoData(demoId || '');

  const [synthesisStatus, setSynthesisStatus] = useState<SynthesisStatus>('idle');
  const [synthesisProgress, setSynthesisProgress] = useState<SynthesisProgress | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [frameUrls, setFrameUrls] = useState<Record<number, string>>({});
  const [extractingFrames, setExtractingFrames] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Extract frames from video when demo loads
  useEffect(() => {
    if (!demo || !demo.videoUrl || demo.status !== 'completed') return;
    if (Object.keys(frameUrls).length > 0) return; // already extracted

    setExtractingFrames(true);
    // Screenshot = previous step's stableTime (Guidde-style: show result of last action)
    const timestamps = stepsWithFrames.map((s, i) => {
      if (i === 0) return s.startTime;
      if (i === stepsWithFrames.length - 1) return s.startTime;
      return Math.max(0, s.startTime - 200);
    });
    extractFrames(demo.videoUrl, timestamps)
      .then((frames) => {
        const map: Record<number, string> = {};
        frames.forEach((f, i) => {
          if (stepsWithFrames[i]) map[stepsWithFrames[i].index] = f.dataUrl;
        });
        setFrameUrls(map);
      })
      .catch((err) => console.error('Frame extraction failed:', err))
      .finally(() => setExtractingFrames(false));
  }, [demo?.id, demo?.status, demo?.videoUrl]);

  // Merge frame URLs into steps
  const stepsWithFrames: StepData[] = demo?.steps
    ? demo.steps.map((s) => ({ ...s, screenshotUrl: frameUrls[s.index] || s.screenshotUrl || '' }))
    : [];

  const handleGenerateVideo = useCallback(async () => {
    if (!stepsWithFrames || stepsWithFrames.length === 0 || !demo?.videoUrl) return;

    setSynthesisStatus('loading_assets');
    setSynthesisError(null);

    try {
      const blob = await synthesizeVideo(stepsWithFrames, (progress) => {
        setSynthesisProgress(progress);
        setSynthesisStatus(progress.status as SynthesisStatus);
      });

      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setSynthesisStatus('completed');
    } catch (err: any) {
      setSynthesisError(err.message);
      setSynthesisStatus('error');
    }
  }, [demo, stepsWithFrames]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-hack-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading demo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <p className="text-red-400 mb-2">Failed to load demo</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No demo data
  if (!demo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No demo data found.</p>
      </div>
    );
  }

  const isProcessing = demo.status !== 'completed' && demo.status !== 'failed';
  const isFailed = demo.status === 'failed';

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Get a fresh API token
      const tokenRes = await fetch('/api/auth/token', { credentials: 'include' });
      if (!tokenRes.ok) throw new Error('Not authenticated');
      const tokenData = await tokenRes.json();

      const resp = await fetch(`/api/demos/${demoId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.token}`,
        },
      });
      if (!resp.ok) throw new Error('Retry failed');
      // Reload to see updated status
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded bg-hack-primary flex items-center justify-center text-xs font-bold">
            H
          </div>
          <h1 className="text-2xl font-bold">{demo.title || 'HackDemo'}</h1>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Processing on server... ({demo.status.replace(/_/g, ' ')})
          </div>
        )}
        {isFailed && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {demo.failReason === 'insufficient_credits'
              ? `Processing failed — balance below $${(demo.minCredits ?? 0.10).toFixed(2)}. Please top up and retry.`
              : `Processing failed — ${demo.failReason || 'unknown error'}. Please retry.`}
          </div>
        )}
      </header>

      {/* Video area */}
      <div className="mb-8">
        {videoUrl ? (
          <VideoPlayer src={videoUrl} poster={stepsWithFrames[0]?.screenshotUrl} />
        ) : (
          <div className="aspect-video bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-4">
            {isFailed ? (
              demo.failReason === 'insufficient_credits' ? (
                <>
                  <div className="text-4xl">💰</div>
                  <p className="text-gray-600 text-sm font-medium">Insufficient credits to generate narration</p>
                  <p className="text-gray-500 text-xs">
                    Your balance is below ${(demo.minCredits ?? 0.10).toFixed(2)}. Top up your credits to continue.
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="px-6 py-3 bg-hack-primary hover:bg-indigo-600 disabled:opacity-50 rounded-lg font-medium transition-colors text-sm"
                  >
                    {retrying ? 'Retrying...' : 'Retry Processing'}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl">⚠️</div>
                  <p className="text-gray-600 text-sm font-medium">Processing failed</p>
                  <p className="text-gray-500 text-xs">
                    {demo.failReason || 'An unknown error occurred.'}
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="px-6 py-3 bg-hack-primary hover:bg-indigo-600 disabled:opacity-50 rounded-lg font-medium transition-colors text-sm"
                  >
                    {retrying ? 'Retrying...' : 'Retry'}
                  </button>
                </>
              )
            ) : isProcessing ? (
              <>
                <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">
                  AI is generating narration and voiceover...
                </p>
              </>
            ) : synthesisStatus === 'idle' ? (
              extractingFrames ? (
                <>
                  <div className="w-10 h-10 border-2 border-hack-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-sm">Extracting frames from video...</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-sm mb-2">Ready to generate demo video</p>
                  <button
                    onClick={handleGenerateVideo}
                    className="px-6 py-3 bg-hack-primary hover:bg-indigo-600 rounded-lg font-medium transition-colors"
                  >
                    Generate Video
                  </button>
                </>
              )
            ) : synthesisStatus === 'error' ? (
              <>
                <p className="text-red-400 text-sm">{synthesisError}</p>
                <button
                  onClick={handleGenerateVideo}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <div className="w-full max-w-md px-8">
                  {/* Progress bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                    <div
                      className="bg-hack-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${synthesisProgress?.percent || 0}%` }}
                    />
                  </div>
                  <p className="text-gray-500 text-sm text-center">
                    {synthesisProgress?.message || 'Synthesizing...'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Download bar */}
      {videoBlob && videoUrl && (
        <div className="mb-8">
          <DownloadBar
            videoBlob={videoBlob}
            videoUrl={videoUrl}
            demo={demo}
          />
        </div>
      )}

      {/* Step timeline */}
      {stepsWithFrames && stepsWithFrames.length > 0 && (
        <StepTimeline steps={stepsWithFrames} />
      )}
    </div>
  );
}
