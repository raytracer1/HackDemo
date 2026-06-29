'use client';
import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDemoData } from '../hooks/useDemoData';
import { synthesizeVideo, SynthesisProgress, preloadFfmpeg } from '../services/ffmpeg';
import { extractFrames } from '../services/video-frames';
import { generateMarkdown } from '../services/markdown';
import VideoPlayer from './VideoPlayer';
import StepTimeline from './StepTimeline';
import DownloadBar from './DownloadBar';
import type { SynthesisStatus, StepData } from '../shared/types';

export default function DemoPage() {
  const params = useParams();
  const demoId = (params as Record<string, string> | null)?.demoId || '';
  const { demo, loading, error } = useDemoData(demoId);

  const [synthesisStatus, setSynthesisStatus] = useState<SynthesisStatus>('idle');
  const [synthesisProgress, setSynthesisProgress] = useState<SynthesisProgress | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [frameUrls, setFrameUrls] = useState<Record<number, string>>({});
  const [extractingFrames, setExtractingFrames] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Preload FFmpeg as soon as page loads
  useEffect(() => {
    if (!demoId || demoId === 'loading') return;
    preloadFfmpeg().catch(() => {});
  }, [demoId]);

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
        frames.forEach((f) => {
          const step = stepsWithFrames[f.stepIndex];
          if (step) map[step.index] = f.dataUrl;
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
      console.error('[HackDemo] Synthesis failed:', err);
      setSynthesisError(err.message || String(err));
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
                    className="inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-hack-primary/25 transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
                  >
                    {retrying ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    )}
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
                    className="inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-hack-primary/25 transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
                  >
                    {retrying ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    )}
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
                    className="inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-hack-primary/25 transition-all hover:bg-indigo-600 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
                    Generate Video
                  </button>
                </>
              )
            ) : synthesisStatus === 'error' ? (
              <>
                <p className="text-red-400 text-sm">{synthesisError || 'Video generation failed, please try again'}</p>
                <button
                  onClick={handleGenerateVideo}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors text-gray-700"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <div className="w-full max-w-md px-8">
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
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
