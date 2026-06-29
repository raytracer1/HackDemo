'use client';
import { useState, useEffect } from 'react';
import Link from "next/link";
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const features = [
  { icon: '🎥', title: 'Record your workflow', desc: 'Capture clicks, inputs, and navigation in your browser automatically.' },
  { icon: '🤖', title: 'AI narration & voiceover', desc: 'DeepSeek generates step-by-step narration in 20+ languages.' },
  { icon: '📤', title: 'Export as MP4 video', desc: 'Share polished demo videos with your team or customers.' },
];

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [clicked, setClicked] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = () => { setClicked(true); login(); };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'register' && password !== confirm) {
        setError('Passwords do not match.');
        setSubmitting(false);
        return;
      }
      if (mode === 'register') {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        // Don't sign in — user must verify email first
        setError('');
        setSubmitting(false);
        setMode('login');
        setPassword('');
        setConfirm('');
        alert('Account created! Please check your email to verify before signing in.');
        return;
      }

      // Auth.js always redirects after sign-in. Point callbackUrl at the backend's
      // session endpoint so the redirect stays on api.hackdemo.win (no CORS issue).
      const callbackUrl = `${API_BASE}/api/auth/session`;
      let session: any = null;

      try {
        // On success: Auth.js 302 → session endpoint (same origin, no CORS)
        const res = await fetch(`${API_BASE}/api/auth/callback/credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ email, password, callbackUrl, csrfToken: 'dummy' }).toString(),
          credentials: 'include',
        });
        session = await res.json();
      } catch {
        // On failure: Auth.js 302 → frontend /login (cross-origin, fetch throws).
        // Cookie may still have been set — check session manually.
        const sr = await fetch(`${API_BASE}/api/auth/session`, { credentials: 'include' });
        if (sr.ok) session = await sr.json();
      }

      if (session?.user) {
        window.location.href = window.location.origin + '/';
        return;
      }
      throw new Error('Sign in failed. Check your credentials or verify your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">You're signed in</h1>
          <p className="mt-2 text-gray-500"><Link href="/" className="text-hack-primary hover:underline">Go to home</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left */}
      <div className="flex w-full items-center justify-center px-4 lg:w-5/12">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2 no-underline">
            <img src="/img/normal.png" alt="HackDemo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-semibold text-gray-900">HackDemo</span>
          </Link>

          <h1 className="mt-10 text-2xl font-bold text-gray-900">
            {mode === 'register' ? 'Create an account' : 'Sign in'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-hack-primary hover:underline font-medium bg-transparent border-none cursor-pointer p-0">
              {mode === 'register' ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {searchParams?.get('verified') === '1' && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Email verified! You can now sign in.</div>
          )}
          {searchParams?.get('error') === 'CredentialsSignin' && mode === 'login' && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">Sign in failed. Check your email and password, or verify your email if you just registered.</div>
          )}

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-hack-primary focus:ring-1 focus:ring-hack-primary outline-none" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-hack-primary focus:ring-1 focus:ring-hack-primary outline-none" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-hack-primary focus:ring-1 focus:ring-hack-primary outline-none" placeholder="Re-enter your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { ok: password.length >= 8, text: 'At least 8 characters' },
                    { ok: /[A-Z]/.test(password), text: 'One uppercase letter' },
                    { ok: /[0-9]/.test(password), text: 'One number' },
                    { ok: confirm.length > 0 && password === confirm, text: 'Passwords match' },
                  ].map(r => (
                    <div key={r.text} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                      {r.ok ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" /></svg>
                      )}
                      {r.text}
                    </div>
                  ))}
                </div>
              </>
            )}
            {error && <p className="text-xs text-hack-danger">{error}</p>}
            <button type="submit" disabled={submitting || !agreed}
              className="w-full rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
              {submitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">or</span></div>
          </div>

          {/* Google */}
          <label className="mb-4 flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-hack-primary focus:ring-hack-primary" />
            <span className="text-xs text-gray-500">
              I agree to the{' '}
              <Link href="/terms" className="text-hack-primary hover:underline" target="_blank">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-hack-primary hover:underline" target="_blank">Privacy Policy</Link>
            </span>
          </label>
          <button onClick={handleGoogleSignIn} disabled={clicked || isLoading || !agreed}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
            {clicked ? (
              <>
                <svg className="h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Redirecting...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="hidden lg:flex lg:w-7/12 bg-gray-50 items-center justify-center px-12 border-l border-gray-200">
        <div className="max-w-md">
          <div className="mb-8 text-center">
            <img src="/img/normal.png" alt="HackDemo" className="mx-auto h-16 w-16 rounded-xl" />
            <p className="mt-4 text-lg text-gray-600">Turn clicks into <span className="font-semibold text-hack-primary">product demos</span></p>
          </div>
          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm border border-gray-100">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
