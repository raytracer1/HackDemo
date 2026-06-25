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
    if (!demoId || demoId === 'loading') {
      setLoading(false);
      return;
    }

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    async function fetchDemo() {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/demos/${demoId}`);
        if (!resp.ok) {
          throw new Error(`Demo not found: ${resp.status}`);
        }
        const data = await resp.json();
        setDemo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDemo();

    // Poll if still processing
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/demos/${demoId}`);
        const data = await resp.json();
        setDemo(data);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch {
        // keep polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [demoId]);

  return { demo, loading, error };
}
