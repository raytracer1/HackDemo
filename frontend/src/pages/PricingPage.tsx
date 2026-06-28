import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PricingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Simple, usage-based pricing
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Pay only for the AI narration you use. No subscriptions, no hidden fees.
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* AI Narration */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
              <h2 className="text-xl font-semibold text-white">AI Narration</h2>
              <p className="mt-2 text-sm text-gray-400">
                Powered by DeepSeek. Charged per token (input + output combined).
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$10</span>
                <span className="text-gray-400">/ 1M tokens</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">$0.00001 per token</p>
              <div className="mt-6 space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Typical demo: ~3,000 tokens ≈ $0.03
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Multi-language narration supported
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Voiceover included (Google TTS)
                </div>
              </div>
            </div>

            {/* Recording & export */}
            <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
              <h2 className="text-xl font-semibold text-white">Recording & Export</h2>
              <p className="mt-2 text-sm text-gray-400">
                Record your browser workflow and export as MP4 video.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">Free</span>
              </div>
              <div className="mt-6 space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited recording
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Step-by-step annotation
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  MP4 video export
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-hack-primary px-8 py-3.5 text-base font-semibold text-white no-underline shadow-lg shadow-hack-primary/25 transition-all hover:bg-indigo-500 active:scale-95"
                >
                  Get started for free
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
              <p className="mt-4 text-xs text-gray-500">
                New users get $0.50 in free credits to try AI narration.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
