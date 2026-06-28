import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
const PAGE_SIZE = 10;

interface DemoItem {
  id: string;
  title: string;
  status: string;
  language: string;
  created_at: string;
  updated_at: string;
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return { bg: 'bg-hack-success/10', text: 'text-hack-success', label: 'Completed' };
    case 'failed':
      return { bg: 'bg-hack-danger/10', text: 'text-hack-danger', label: 'Failed' };
    default:
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: status.replace(/_/g, ' ') };
  }
};

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchPage = useCallback(async (p: number) => {
    if (!isAuthenticated || isLoading) return;
    setLoading(true);
    try {
      const tokenRes = await fetch(`${API_BASE}/api/auth/token`, { credentials: 'include' });
      const tokenData = await tokenRes.json();
      if (!tokenData.token) throw new Error('No token');

      const res = await fetch(
        `${API_BASE}/api/users/me/demos?page=${p}&limit=${PAGE_SIZE}`,
        { headers: { 'Authorization': `Bearer ${tokenData.token}` } },
      );
      const data = await res.json();
      setDemos(data.demos || []);
      setTotal(data.total || 0);
    } catch {
      setDemos([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="mt-1 text-sm text-gray-500">Your recent demos</p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-hack-primary" />
          </div>
        ) : demos.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-gray-500">No demos yet.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-2">
              {demos.map(demo => {
                const badge = statusBadge(demo.status);
                return (
                  <Link key={demo.id} to={`/demo/${demo.id}`} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 no-underline shadow-sm transition-colors hover:border-gray-300 hover:shadow-md">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{demo.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{demo.language} &middot; {new Date(demo.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`ml-3 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                    <svg className="ml-3 h-4 w-4 flex-shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`rounded-lg border px-3 py-2 text-sm ${p === page ? 'border-hack-primary bg-hack-primary/10 text-hack-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
