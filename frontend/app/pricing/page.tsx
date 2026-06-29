import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import PricingPage from '@/views/PricingPage';

const title = 'Pricing';
const description =
  '$9.90 per pack (~330 AI-narrated 3-minute demos). New users get $0.50 free to try AI narration. One-time purchase, no subscription.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['product demo pricing', 'AI narration cost', 'demo video pricing', 'pay as you go'],
  openGraph: {
    title: `HackDemo ${title}`,
    description,
    images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: 'HackDemo Pricing' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `HackDemo ${title}`,
    description,
    images: [{ url: '/img/og.jpg', alt: 'HackDemo Pricing' }],
  },
};

export default function Page() { return <PageLayout><PricingPage /></PageLayout>; }
