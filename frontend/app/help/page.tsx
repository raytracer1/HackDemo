import { Metadata } from 'next';
// ISR — help content changes rarely, revalidate daily
export const revalidate = 86400;
import PageLayout from '@/components/PageLayout';
import JsonLd from '@/components/JsonLd';
import HelpPage from '@/views/HelpPage';

const title = 'Help';
const description =
  'Learn how to use HackDemo — install the browser extension, record workflows, generate AI-narrated demos, and export MP4 videos. Includes FAQ.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://hackdemo.win/help' },
  keywords: ['how to create product demo', 'browser demo tutorial', 'AI narration guide', 'HackDemo help'],
  openGraph: {
    title: `${title} — HackDemo`,
    description,
    images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: 'HackDemo Help' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — HackDemo`,
    description,
    images: [{ url: '/img/og.jpg', alt: 'HackDemo Help' }],
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does it cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Recording is free. AI narration costs $10 per 1M tokens. A typical 3-minute demo uses ~3,000 tokens (about $0.03). New users get $0.50 free.',
      },
    },
    {
      '@type': 'Question',
      name: 'What languages are supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '20+ languages including English, Chinese, Japanese, Korean, Spanish, French, German, and more.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where is my data stored?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Recordings and generated videos are stored on Cloudflare R2. Account data is stored in a secure database.',
      },
    },
  ],
};

const tutorialVideo = {
  '@type': 'VideoObject',
  name: 'How to Use HackDemo — Tutorial Walkthrough',
  description:
    'Step-by-step walkthrough of HackDemo: record browser workflows, generate AI narration, and export MP4 demo videos.',
  thumbnailUrl: ['https://img.youtube.com/vi/ABiLmOraxXc/maxresdefault.jpg'],
  contentUrl: 'https://www.youtube.com/watch?v=ABiLmOraxXc',
  embedUrl: 'https://www.youtube.com/embed/ABiLmOraxXc',
  uploadDate: '2026-06-29',
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Create a Product Demo with HackDemo',
  description:
    'Record your browser workflow and let AI generate a narrated, annotated demo video in 5 steps.',
  video: tutorialVideo,
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Install the Extension',
      text: 'Add the HackDemo Chrome extension from the Chrome Web Store. It adds a recording panel to any page.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Sign In',
      text: 'Sign in with your Google account to activate recording and track your demos.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Start Recording',
      text: 'Click the HackDemo extension icon, choose a demo type, and hit Start Capture. The extension records your clicks, inputs, and navigation.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Finish & Process',
      text: 'Click Done when finished. Your recording is sent to our server where AI generates narration and voiceover.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'View & Share',
      text: 'A new tab opens with your demo. You can watch the video, see step-by-step breakdowns, and generate an MP4 to share.',
    },
  ],
};

const videoObjectSchema = {
  '@context': 'https://schema.org',
  ...tutorialVideo,
};

const speakableSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: 'https://hackdemo.win/help',
  speakable: {
    '@type': 'SpeakableSpecification',
    xpath: [
      '/html/head/title',
      '/html/head/meta[@name="description"]/@content',
    ],
  },
};

export default function Page() {
  return (
    <PageLayout
      breadcrumbs={[
        { name: 'Home', href: 'https://hackdemo.win/' },
        { name: 'Help', href: 'https://hackdemo.win/help' },
      ]}
    >
      <JsonLd data={faqSchema} />
      <JsonLd data={howToSchema} />
      <JsonLd data={videoObjectSchema} />
      <JsonLd data={speakableSchema} />
      <HelpPage />
    </PageLayout>
  );
}
