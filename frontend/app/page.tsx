import { Metadata } from 'next';
// ISR — revalidate landing page every hour for freshness without sacrificing performance
export const revalidate = 3600;
import PageLayout from '@/components/PageLayout';
import HomePage from '@/views/HomePage';

const title = 'Turn Clicks into Product Demos with AI';
const description =
  'Record your browser workflow and let HackDemo generate narrated, annotated demo videos in 20+ languages. Export as MP4 to share.';

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'product demo',
    'browser recorder',
    'AI narration',
    'demo video',
    'how-to tutorial',
    'chrome extension',
  ],
  openGraph: {
    title: `HackDemo — ${title}`,
    description,
    images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: 'HackDemo — Turn Clicks into Product Demos with AI' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `HackDemo — ${title}`,
    description,
    images: [{ url: '/img/og.jpg', alt: 'HackDemo — Turn Clicks into Product Demos with AI' }],
  },
};

export default function Page() {
  return (
    <PageLayout breadcrumbs={[{ name: 'Home', href: 'https://hackdemo.win/' }]}>
      <HomePage />
    </PageLayout>
  );
}
