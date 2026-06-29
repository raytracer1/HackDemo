import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PACK_PRICE = 9.90;
const EST_DEMOS = 330;
const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

async function fetchApiToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/token`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch { return null; }
}

export default function PricingPage() {
  const { isAuthenticated, refresh } = useAuth();
  useEffect(() => { document.title = 'Pricing — HackDemo'; }, []);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 rounded-xl border border-hack-primary/20 bg-hack-primary/5 px-4 py-3 text-center">
          <p className="text-sm text-gray-600">
            New users get <span className="font-semibold text-hack-primary">$0.50 free</span> to try AI narration
          </p>
          {!isAuthenticated && (
            <Link to="/login" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-hack-primary no-underline hover:underline">Get started<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></Link>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-2 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-gray-900">$9.90</span>
          </div>
          <p className="text-sm text-gray-500">~{EST_DEMOS}+ AI-narrated 3-minute demos</p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <div className="space-y-2 text-left text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                AI narration + voiceover
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Multi-language support
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                MP4 video export
              </div>
            </div>
          </div>

          <div className="mt-6">
            {purchased ? (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">Purchase successful! Credits added to your account.</div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">{error}</div>
            ) : isAuthenticated && PAYPAL_CLIENT_ID ? (
              <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
                <PayPalButtons
                  style={{ layout: 'vertical', shape: 'pill', color: 'gold' }}
                  createOrder={async () => {
                    const token = await fetchApiToken();
                    if (!token) throw new Error('Not authenticated');
                    const res = await fetch(`${API_BASE}/api/paypal/create-order`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: '{}',
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed');
                    return data.id;
                  }}
                  onApprove={async (data) => {
                    const token = await fetchApiToken();
                    if (!token) throw new Error('Not authenticated');
                    const res = await fetch(`${API_BASE}/api/paypal/capture-order`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ orderId: data.orderID }),
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'Capture failed');
                    if (result.status === 'COMPLETED') { setPurchased(true); await refresh(); }
                  }}
                  onError={() => setError('Payment failed. Please try again.')}
                />
              </PayPalScriptProvider>
            ) : isAuthenticated ? (
              <p className="text-xs text-gray-400">PayPal not configured</p>
            ) : (
              <Link to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline transition-all hover:bg-indigo-500 active:scale-95">
                Sign in to purchase
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
