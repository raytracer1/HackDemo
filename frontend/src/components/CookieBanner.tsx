'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'cookie-consent';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setShow(true);
    }
  }, []);

  const handle = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined');
    setShow(false);
    window.dispatchEvent(new Event('consent-changed'));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          We use cookies to improve your experience and analyze site usage.{' '}
          <a href="/privacy" className="underline text-blue-600 hover:text-blue-800">
            Learn more
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handle(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => handle(true)}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
