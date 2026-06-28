import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// $9.90 / $0.03 per avg 3-min demo ≈ 330 demos
const PACK_PRICE = 9.90;
const EST_DEMOS = 330;

export default function PricingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-start justify-center px-4 pt-12">
        <div className="w-full max-w-sm">
          {/* Free trial banner */}
          <div className="mb-6 rounded-xl border border-hack-primary/30 bg-hack-primary/5 px-4 py-3 text-center">
            <p className="text-sm text-gray-300">
              New users get <span className="font-semibold text-white">$0.50 free</span> to try AI narration
            </p>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-hack-primary no-underline hover:underline"
              >
                Get started
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center">
            <div className="mb-2 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">$9.90</span>
            </div>

            <p className="text-sm text-gray-400">
              ~{EST_DEMOS}+ AI-narrated 3-minute demos
            </p>

            <div className="mt-6 rounded-xl bg-gray-900 p-4">
              <div className="space-y-2 text-left text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  AI narration + voiceover
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Multi-language support
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  MP4 video export
                </div>
              </div>
            </div>

            <button
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-xl bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-500"
            >
              Purchase (coming soon)
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
