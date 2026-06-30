'use client';
import Link from "next/link";
import { useAuth } from '../contexts/AuthContext';

const differentiators = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'Zero Scriptwriting',
    description: 'DeepSeek AI generates step-by-step narration from your recording. No script, no voiceover booth — just click record and let AI do the rest.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
      </svg>
    ),
    title: 'Judges See Every Detail',
    description: 'Every click, input, and scroll is automatically highlighted with visual markers. Judges instantly understand how your prototype works.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: 'Pitch in Any Language',
    description: '20+ languages via Google TTS. Global hackathon? International judges? Generate your demo narration in the language that wins.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125" />
      </svg>
    ),
    title: 'Devpost-Ready MP4',
    description: 'One-click MP4 export. Attach to your Devpost submission, embed in your pitch deck, or play during judge presentations.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
      </svg>
    ),
    title: 'Install in Seconds',
    description: <>One-click{' '}<a href="https://chromewebstore.google.com/detail/hackdemo-%E2%80%94-ai-demo-record/dlkbndgmhlmddbihhjilapjncpbenhkj" target="_blank" rel="noopener noreferrer" className="text-hack-primary hover:underline">Chrome extension</a>. No setup, no config — install during team formation and start recording your prototype immediately.</>,
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ),
    title: 'Safe to Share Publicly',
    description: 'API keys, passwords, and emails are auto-detected and blurred. Share your demo on Devpost or social media without leaking secrets.',
  },
];

const howSteps = [
  {
    num: 1,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Record While You Hack',
    description: <><a href="https://chromewebstore.google.com/detail/hackdemo-%E2%80%94-ai-demo-record/dlkbndgmhlmddbihhjilapjncpbenhkj" target="_blank" rel="noopener noreferrer" className="text-hack-primary hover:underline">Install the Chrome extension</a>, click record, and walk through your prototype. Zero setup, zero friction — keep building.</>,
  },
  {
    num: 2,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'AI Generates Your Pitch',
    description: 'AI writes narration, adds visual annotations, and produces voiceover — in your chosen language. Review and tweak in seconds.',
  },
  {
    num: 3,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: 'Submit Before the Deadline',
    description: 'Export as MP4. Upload to Devpost, share with judges, or embed in your pitch deck — all before the countdown hits zero.',
  },
];

const sharedFeatures = [
  'Browser recording',
  'Basic step detection',
  'AI narration + voiceover',
  'Multi-language TTS (20+ languages)',
  'Auto annotations',
  'MP4 video export',
  'Privacy auto-blur',
];

const faqs = [
  {
    q: 'Is HackDemo good for hackathons?',
    a: 'Absolutely — it\'s built for them. Record your prototype during the hack, and HackDemo auto-generates a narrated, annotated demo video in under 5 minutes. No editing, no scriptwriting, no wasted time. Used by hackathon teams to win judges over with polished presentations.',
  },
  {
    q: 'How fast can I create a demo?',
    a: 'Recording takes as long as your workflow (typically 1–3 minutes). AI processing takes 30–60 seconds. You can have a polished MP4 demo video in under 5 minutes from start to finish — perfect for last-minute submissions.',
  },
  {
    q: 'Can I use it for Devpost or other submission platforms?',
    a: 'Yes! HackDemo exports standard MP4 files that work perfectly on Devpost, YouTube, Google Drive, and most hackathon submission platforms. You can also embed the video directly in your project\'s README or pitch deck.',
  },
  {
    q: 'How much does AI narration cost?',
    a: 'New users get $0.50 free credits — enough to create your first fully-narrated demo for free. A typical 3-minute demo costs ~$0.03 in AI credits. The $9.90 Pro pack covers ~330 demos, enough for an entire hackathon season.',
  },
  {
    q: 'What languages are supported for narration?',
    a: '20+ languages including English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, and more. Perfect for global hackathons or international team members.',
  },
  {
    q: 'Can I edit the AI-generated narration before exporting?',
    a: 'Yes! Every step\'s narration text is fully editable. The AI gives you a strong first draft — you can refine it to match your pitch perfectly before generating the final video.',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  const extStoreUrl = 'https://chromewebstore.google.com/detail/hackdemo-%E2%80%94-ai-demo-record/dlkbndgmhlmddbihhjilapjncpbenhkj';
  const ctaHref = extStoreUrl;
  const ctaText = isAuthenticated ? 'Create a Demo' : 'Start Free';

  return (
    <>
      {/* ── Section 1: Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Ship a{' '}
            <span className="bg-gradient-to-r from-hack-primary to-blue-500 bg-clip-text text-transparent">pitch-ready demo</span>
            {' '}before the hackathon deadline
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
            Record your prototype, let AI handle the narration and annotations. In under 5 minutes, you get a polished MP4 — ready for Devpost, judges, and your pitch deck.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={ctaHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-hack-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hack-primary/25 no-underline transition-all hover:bg-indigo-600 active:scale-95">
              {ctaText}
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </a>
            <a href="#demo-video" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-medium text-gray-600 no-underline shadow-sm transition-all hover:border-gray-300 hover:text-gray-900">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Watch Demo
            </a>
          </div>

          {/* Demo video */}
          <div id="demo-video" className="mx-auto mt-12 max-w-3xl">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/ABiLmOraxXc?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&playlist=ABiLmOraxXc"
                title="HackDemo product demo video"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Why HackDemo? ── */}
      <section className="border-t border-gray-100 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Why HackDemo?</h2>
            <p className="mt-3 text-gray-500">Spend time building, not editing. HackDemo turns your prototype into a judge-ready demo automatically.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((d) => (
              <div key={d.title} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-hack-primary/30 hover:shadow-md">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-hack-primary/10 text-hack-primary">{d.icon}</div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">{d.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Before vs After ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">From Prototype to Pitch</h2>
            <p className="mt-3 text-gray-500">The difference between a raw screen recording and a winning hackathon submission.</p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Before */}
            <div className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100/80 p-8 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Before</span>
              <div className="mt-6 flex flex-col items-center gap-3">
                <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-sm font-medium text-gray-400">Raw screen recording</p>
                <ul className="mt-2 space-y-2 text-left text-sm text-gray-400">
                  <li className="flex items-center gap-2"><svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Silent click-through, no explanation</li>
                  <li className="flex items-center gap-2"><svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Judges can&apos;t follow the flow</li>
                  <li className="flex items-center gap-2"><svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Hours of manual editing needed</li>
                </ul>
              </div>
            </div>

            {/* After */}
            <div className="relative rounded-2xl border-2 border-hack-primary/20 bg-white p-8 text-center shadow-lg shadow-hack-primary/5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-hack-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-hack-primary">After</span>
              <div className="mt-6 flex flex-col items-center gap-3">
                <svg className="h-12 w-12 text-hack-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">AI-generated pitch video</p>
                <ul className="mt-2 space-y-2 text-left text-sm text-gray-600">
                  <li className="flex items-center gap-2"><svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> AI narrates every step clearly</li>
                  <li className="flex items-center gap-2"><svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Visual annotations guide judges</li>
                  <li className="flex items-center gap-2"><svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Devpost-ready MP4 in &lt;5 min</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: How it Works ── */}
      <section className="border-t border-gray-100 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">From Hacking to Pitching</h2>
            <p className="mt-3 text-gray-500">Three steps. Under 5 minutes. Zero editing skills needed.</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {howSteps.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {/* Step number + icon */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-hack-primary text-white shadow-lg shadow-hack-primary/25">
                  {step.icon}
                </div>
                <span className="mt-4 text-sm font-semibold uppercase tracking-wide text-hack-primary">Step {step.num}</span>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">{step.description}</p>
                {/* Connecting line for desktop */}
                {i < howSteps.length - 1 && (
                  <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-0.5 w-[calc(100%-4rem)] bg-gradient-to-r from-hack-primary/40 to-hack-primary/10 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Pricing ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Hackathon-Friendly Pricing</h2>
            <p className="mt-3 text-gray-500">Start free. No credit card. All features included — just top up when you need more credits.</p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <p className="mt-1 text-sm text-gray-500">Perfect for a hackathon weekend. Full features, free credits to start.</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-sm text-gray-500">to start</span>
              </p>
              <p className="mt-1 text-sm text-hack-primary font-medium">$0.50 free credits — your first demo is on us</p>
              <ul className="mt-6 space-y-3">
                {sharedFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              {isAuthenticated ? (
                <a href={extStoreUrl} target="_blank" rel="noopener noreferrer" className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 no-underline shadow-sm transition-all hover:border-gray-300 hover:text-gray-900">
                  Get Started Free
                </a>
              ) : (
                <Link href="/login" className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 no-underline shadow-sm transition-all hover:border-gray-300 hover:text-gray-900">
                  Get Started Free
                </Link>
              )}
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-hack-primary bg-white p-8 shadow-lg shadow-hack-primary/10">
              <span className="absolute -top-3 right-6 inline-flex items-center rounded-full bg-hack-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">Most Popular</span>
              <h3 className="text-xl font-bold text-gray-900">Pro</h3>
              <p className="mt-1 text-sm text-gray-500">One-time top-up. Enough credits for an entire hackathon season.</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">$9.90</span>
                <span className="text-sm text-gray-500">one-time</span>
              </p>
              <p className="mt-1 text-sm text-hack-primary font-medium">~330 AI-narrated demos — that&apos;s under 3¢ each</p>
              <ul className="mt-6 space-y-3">
                {sharedFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg className="h-4 w-4 flex-shrink-0 text-hack-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline shadow-lg shadow-hack-primary/25 transition-all hover:bg-indigo-600 active:scale-95">
                Get Pro
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: FAQ ── */}
      <section className="border-t border-gray-100 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Hackathon Teams Ask</h2>
            <p className="mt-3 text-gray-500">Everything you need to know before the clock runs out.</p>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  {faq.q}
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Final CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Ready to win your next hackathon?</h2>
          <p className="mt-4 text-gray-500">Start free with $0.50 credits. No credit card. Install in seconds. Record your prototype, generate a pitch-ready demo, and submit before the deadline — all in under 5 minutes.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={ctaHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-hack-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hack-primary/25 no-underline transition-all hover:bg-indigo-600 active:scale-95">
              {ctaText}
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </a>
            <Link href="/help" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-medium text-gray-600 no-underline shadow-sm transition-all hover:border-gray-300 hover:text-gray-900">
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
