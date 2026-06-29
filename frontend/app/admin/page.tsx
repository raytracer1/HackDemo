'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  email: string;
  name: string;
  type: string;
  email_verified: boolean;
  credits: number;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  user_email: string;
  type: string;
  amount: number;
  description: string;
  paypal_order_id: string;
  created_at: string;
}

interface Demo {
  id: string;
  title: string;
  status: string;
  user_email: string;
  language: string;
  created_at: string;
  fail_reason: string;
}

async function getToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/token`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

async function fetchAdmin<T>(path: string, params?: Record<string, string>): Promise<{ data: T[]; total: number }> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403) throw new Error('Admin access required');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

type Tab = 'users' | 'orders' | 'demos';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  // Check admin status on mount
  useEffect(() => {
    fetchAdmin<{ admin: boolean }>('/api/admin/check')
      .then(res => {
        setIsAdmin((res.data as any)?.admin === true);
        setCheckingAuth(false);
      })
      .catch(() => { setIsAdmin(false); setCheckingAuth(false); });
  }, []);

  // Load data when tab or page changes
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'users') {
        const res = await fetchAdmin<User>('/api/admin/users', { page: String(page), limit: String(limit) });
        setUsers(res.data); setTotal(res.total);
      } else if (tab === 'orders') {
        const res = await fetchAdmin<Transaction>('/api/admin/transactions', { page: String(page), limit: String(limit) });
        setTransactions(res.data); setTotal(res.total);
      } else {
        const res = await fetchAdmin<Demo>('/api/admin/demos', { page: String(page), limit: String(limit) });
        setDemos(res.data); setTotal(res.total);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Loading
  if (checkingAuth || isAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-hack-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please sign in to access admin.</p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline">Sign in</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">Please sign in with an admin account.</p>
          <Link href="/login" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline mr-4">Sign in</Link>
          <Link href="/" className="mt-2 inline-flex text-hack-primary hover:underline text-sm">← Back to home</Link>
        </div>
      </div>
    );
  }

  // ── Admin Panel ──
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <Link href="/" className="text-sm text-hack-primary hover:underline">← Back to home</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {([
            ['users', 'Users'],
            ['orders', 'Orders'],
            ['demos', 'Demos'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-hack-primary text-hack-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-hack-primary" />
          </div>
        ) : (
          <>
            {/* Users Table */}
            {tab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase">
                      <th className="py-3 pr-4 font-medium">Email</th>
                      <th className="py-3 pr-4 font-medium">Name</th>
                      <th className="py-3 pr-4 font-medium">Type</th>
                      <th className="py-3 pr-4 font-medium">Verified</th>
                      <th className="py-3 pr-4 font-medium">Credits</th>
                      <th className="py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 text-gray-900">{u.email}</td>
                        <td className="py-3 pr-4 text-gray-600">{u.name || '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.type === 'google' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{u.type}</span>
                        </td>
                        <td className="py-3 pr-4">{u.email_verified ? '✅' : '❌'}</td>
                        <td className="py-3 pr-4 font-mono text-gray-700">${Number(u.credits).toFixed(4)}</td>
                        <td className="py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* Orders Table */}
            {tab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase">
                      <th className="py-3 pr-4 font-medium">ID</th>
                      <th className="py-3 pr-4 font-medium">User</th>
                      <th className="py-3 pr-4 font-medium">Type</th>
                      <th className="py-3 pr-4 font-medium">Amount</th>
                      <th className="py-3 pr-4 font-medium">Description</th>
                      <th className="py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono text-xs text-gray-500 max-w-[120px] truncate" title={t.id}>{t.id.slice(0, 12)}…</td>
                        <td className="py-3 pr-4 text-gray-900">{t.user_email || t.user_id}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            t.type === 'paypal_purchase' ? 'bg-green-50 text-green-600' :
                            t.type === 'ai_usage' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>{t.type}</span>
                        </td>
                        <td className="py-3 pr-4 font-mono text-gray-700">${Number(t.amount).toFixed(6)}</td>
                        <td className="py-3 pr-4 text-gray-600 max-w-[200px] truncate">{t.description || '—'}</td>
                        <td className="py-3 text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No orders found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* Demos Table */}
            {tab === 'demos' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase">
                      <th className="py-3 pr-4 font-medium">ID</th>
                      <th className="py-3 pr-4 font-medium">Title</th>
                      <th className="py-3 pr-4 font-medium">User</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 pr-4 font-medium">Language</th>
                      <th className="py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {demos.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono text-xs text-gray-500 max-w-[100px] truncate" title={d.id}>{d.id.slice(0, 10)}…</td>
                        <td className="py-3 pr-4 text-gray-900 max-w-[200px] truncate">{d.title}</td>
                        <td className="py-3 pr-4 text-gray-600">{d.user_email || '—'}</td>
                        <td className="py-3 pr-4">
                          {d.status === 'completed' ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">completed</span> :
                           d.status === 'failed' ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600" title={d.fail_reason}>failed</span> :
                           d.status === 'processing_narration' || d.status === 'processing_audio' ? <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">{d.status}</span> :
                           <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.status}</span>}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{d.language}</td>
                        <td className="py-3 text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {demos.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No demos found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {total > limit && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <span>{total} total</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-30">Prev</button>
                  <span className="px-2">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
