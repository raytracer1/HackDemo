import { useState, useEffect } from 'react';
import type { DemoData } from '../shared/types';

interface UseDemoDataResult {
  demo: DemoData | null;
  loading: boolean;
  error: string | null;
}

export function useDemoData(demoId: string): UseDemoDataResult {
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!demoId || demoId === 'loading') { setLoading(false); return; }

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    let stopped = false;

    async function api(path: string, method = 'GET') {
      const resp = await fetch(`${BACKEND_URL}${path}`, { method });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      return resp.json();
    }

    async function init() {
      try {
        // Step 1: Fetch demo
        let data = await api(`/api/demos/${demoId}`);
        setDemo(data);

        // Step 2: If uploaded, trigger narration
        if (data.status === 'uploaded' || data.status === 'awaiting_upload') {
          data = await api(`/api/demos/${demoId}/process-narration`, 'POST');
          setDemo(data);
        }

        // Step 3: If narration done, trigger audio
        if (data.status === 'narration_done' || data.status === 'processing_narration') {
          // Re-fetch to get latest steps with narration
          data = await api(`/api/demos/${demoId}`);
          if (data.status === 'narration_done') {
            data = await api(`/api/demos/${demoId}/process-audio`, 'POST');
            setDemo(data);
          }
        }

        // Step 4: Poll until completed
        if (data.status !== 'completed' && data.status !== 'failed') {
          const interval = setInterval(async () => {
            if (stopped) { clearInterval(interval); return; }
            try {
              const d = await api(`/api/demos/${demoId}`);
              setDemo(d);
              if (d.status === 'completed' || d.status === 'failed') {
                clearInterval(interval);
                setLoading(false);
              }
            } catch { /* keep polling */ }
          }, 3000);
          return; // Don't setLoading(false) yet
        }

        setLoading(false);
      } catch (err: any) {
        if (!stopped) setError(err.message);
        setLoading(false);
      }
    }

    init();
    return () => { stopped = true; };
  }, [demoId]);

  return { demo, loading, error };
}
