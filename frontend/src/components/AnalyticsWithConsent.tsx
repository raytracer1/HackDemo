'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';

const CONSENT_KEY = 'cookie-consent';

export default function AnalyticsWithConsent({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = () => setConsent(localStorage.getItem(CONSENT_KEY) === 'accepted');
    check();
    setChecked(true);
    window.addEventListener('consent-changed', check);
    return () => window.removeEventListener('consent-changed', check);
  }, []);

  if (!checked || !consent) return null;

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      <Analytics />
    </>
  );
}
