import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return; }
    fetch(`${API_BASE}/api/auth/verify?token=${encodeURIComponent(token)}`, { redirect: 'follow' })
      .then(res => {
        if (res.ok || res.redirected) { setStatus('success'); setMessage('Email verified successfully!'); }
        else { setStatus('error'); setMessage('Invalid or expired verification link.'); }
      })
      .catch(() => { setStatus('error'); setMessage('Verification failed. Please try again.'); });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-hack-primary border-t-transparent mx-auto" />
        ) : status === 'success' ? (
          <>
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{message}</h1>
            <Link to="/login" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-indigo-600">Sign in</Link>
          </>
        ) : (
          <>
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Verification failed</h1>
            <p className="mt-2 text-gray-500">{message}</p>
            <Link to="/login" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-indigo-600">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
