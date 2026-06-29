import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import HelpPage from '@/views/HelpPage';

const title = 'Help';
const description =
  'Learn how to use HackDemo — install the browser extension, record workflows, generate AI-narrated demos, and export MP4 videos. Includes FAQ.';

export const metadata: Metadata = {
  title,
  description,
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

export default function Page() { return <PageLayout><HelpPage /></PageLayout>; }
