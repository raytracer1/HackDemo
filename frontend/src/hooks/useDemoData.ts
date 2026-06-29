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

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    let stopped = false;

    async function poll() {
      try {
        const resp = await fetch(`${API_BASE}/api/demos/${demoId}`);
        const data = await resp.json();
        if (!stopped) setDemo(data);
        if (data.status === 'completed' || data.status === 'failed') {
          if (!stopped) setLoading(false);
          return;
        }
      } catch {}
      setTimeout(() => { if (!stopped) poll(); }, 3000);
    }

    poll();
    return () => { stopped = true; };
  }, [demoId]);

  return { demo, loading, error };
}
