import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: '🎥', title: 'Record your workflow', desc: 'Capture clicks, inputs, and navigation in your browser automatically.' },
  { icon: '🤖', title: 'AI narration & voiceover', desc: 'DeepSeek generates step-by-step narration in 20+ languages.' },
  { icon: '📤', title: 'Export as MP4 video', desc: 'Share polished demo videos with your team or customers.' },
];

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [clicked, setClicked] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSignIn = () => { setClicked(true); login(); };

  return (
    <div className="flex min-h-screen">
      {/* Left — Login */}
      <div className="flex w-full items-center justify-center px-4 lg:w-5/12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 no-underline">
            <img src="/img/normal.png" alt="HackDemo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-semibold text-gray-900">HackDemo</span>
          </Link>

          <h1 className="mt-10 text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-2 text-sm text-gray-500">Use your Google account to continue.</p>

          {isAuthenticated && !isLoading ? (
            <div className="mt-8 rounded-xl bg-green-50 px-4 py-3 text-center text-sm text-green-700">
              You're signed in.{' '}
              <Link to="/" className="font-medium text-hack-primary hover:underline">Go to home</Link>
            </div>
          ) : (
            <>
              <label className="mt-6 flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-hack-primary focus:ring-hack-primary" />
                <span className="text-xs text-gray-500">
                  I agree to the{' '}
                  <Link to="/terms" className="text-hack-primary hover:underline" target="_blank">Terms</Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-hack-primary hover:underline" target="_blank">Privacy Policy</Link>
                </span>
              </label>

              <button onClick={handleSignIn} disabled={clicked || isLoading || !agreed}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
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
            </>
          )}
        </div>
      </div>

      {/* Right — Product intro */}
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
