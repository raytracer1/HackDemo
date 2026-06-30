'use client';
import Link from "next/link";

const extUrl = 'https://chromewebstore.google.com/detail/hackdemo-%E2%80%94-ai-demo-record/dlkbndgmhlmddbihhjilapjncpbenhkj';

const steps = [
  {
    num: 1,
    title: 'Install the Extension',
    desc: <>Add the HackDemo{' '}<a href={extUrl} target="_blank" rel="noopener noreferrer" className="text-hack-primary hover:underline">Chrome extension</a>{' '}from the Chrome Web Store. It adds a recording panel to any page.</>,
  },
  {
    num: 2,
    title: 'Sign In',
    desc: 'Sign in with your Google account to activate recording and track your demos.',
  },
  {
    num: 3,
    title: 'Start Recording',
    desc: 'Click the HackDemo extension icon, choose a demo type, and hit Start Capture. The extension records your clicks, inputs, and navigation.',
  },
  {
    num: 4,
    title: 'Finish & Process',
    desc: 'Click Done when finished. Your recording is sent to our server where AI generates narration and voiceover.',
  },
  {
    num: 5,
    title: 'View & Share',
    desc: 'A new tab opens with your demo. You can watch the video, see step-by-step breakdowns, and generate an MP4 to share.',
  },
];

const faqs = [
  {
    q: 'How much does it cost?',
    a: 'Recording is free. AI narration costs $10 per 1M tokens. A typical 3-minute demo uses ~3,000 tokens (about $0.03). New users get $0.50 free.',
  },
  {
    q: 'What languages are supported?',
    a: '20+ languages including English, Chinese, Japanese, Korean, Spanish, French, German, and more.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Recordings and generated videos are stored on Cloudflare R2. Account data is stored in a secure database.',
  },
];

export default function HelpPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">How It Works</h1>
        <p className="mt-1 text-sm text-gray-500">Get started with HackDemo in a few simple steps.</p>

        {/* Steps */}
        <div className="mt-10 space-y-6">
          {steps.map((step) => (
            <div key={step.num} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-hack-primary text-sm font-bold text-white">{step.num}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="mt-14 text-xl font-bold text-gray-900">FAQ</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer font-medium text-gray-900">{faq.q}</summary>
              <p className="mt-2 text-sm text-gray-500">{faq.a}</p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">Ready to try it out?</p>
          <Link href="/login" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline shadow transition-all hover:bg-indigo-600">Get Started</Link>
        </div>
      </div>
    </div>
  );
}
