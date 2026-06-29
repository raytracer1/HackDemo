import { Metadata } from 'next';
// ISR — pricing may change occasionally, revalidate hourly
export const revalidate = 3600;
import PageLayout from '@/components/PageLayout';
import JsonLd from '@/components/JsonLd';
import PricingPage from '@/views/PricingPage';

const title = 'Pricing';
const description =
  '$9.90 per pack (~330 AI-narrated 3-minute demos). New users get $0.50 free to try AI narration. One-time purchase, no subscription.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://hackdemo.win/pricing' },
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

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HackDemo',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered browser demo recorder — capture workflows, generate narrated voiceovers, and export as MP4 video.',
  offers: {
    '@type': 'Offer',
    price: '9.90',
    priceCurrency: 'USD',
    description: 'AI narration credit pack — ~330 three-minute narrated demos',
  },
  aggregateRating: {
    // Placeholder — replace with real rating data when available
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '0',
  },
};

export default function Page() {
  return (
    <PageLayout
      breadcrumbs={[
        { name: 'Home', href: 'https://hackdemo.win/' },
        { name: 'Pricing', href: 'https://hackdemo.win/pricing' },
      ]}
    >
      <JsonLd data={softwareAppSchema} />
      <PricingPage />
    </PageLayout>
  );
}
