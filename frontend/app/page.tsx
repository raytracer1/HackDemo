import { Metadata } from 'next';
// ISR — revalidate landing page every hour for freshness without sacrificing performance
export const revalidate = 3600;
import PageLayout from '@/components/PageLayout';
import JsonLd from '@/components/JsonLd';
import HomePage from '@/views/HomePage';

const title = 'Ship a Pitch-Ready Demo Before the Hackathon Deadline';
const description =
  'Built for hackathon teams. Record your prototype, and HackDemo auto-generates AI narration, annotations, and voiceover. Export a polished MP4 ready for Devpost, judges, and pitch decks — in under 5 minutes. Start free.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://hackdemo.win/' },
  keywords: [
    'hackathon demo',
    'product demo maker',
    'AI demo generator',
    'pitch video',
    'Devpost submission',
    'hackathon presentation',
    'browser recorder',
    'AI narration',
    'demo video',
    'chrome extension',
  ],
  openGraph: {
    title: `HackDemo — ${title}`,
    description,
    images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: 'HackDemo — Ship a pitch-ready demo before the hackathon deadline' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `HackDemo — ${title}`,
    description,
    images: [{ url: '/img/og.jpg', alt: 'HackDemo — Ship a pitch-ready demo before the hackathon deadline' }],
  },
};

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HackDemo',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description,
  url: 'https://hackdemo.win',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description:
      'Built for hackathon teams. Start free with $0.50 credits — no credit card. Auto-generate AI-narrated, annotated demo videos ready for Devpost and judge presentations.',
  },
  aggregateRating: {
    // Placeholder — replace with real rating data when available
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '0',
  },
  featureList: [
    'One-click browser recording for hackathon prototypes',
    'AI-powered narration generation — no scriptwriting needed',
    'Text-to-speech voiceover in 20+ languages',
    'MP4 video export ready for Devpost and pitch decks',
    'Automatic click and input annotations',
    'Sensitive information auto-blur for safe sharing',
    'From prototype to pitch-ready demo in under 5 minutes',
  ],
};

const speakableSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: 'https://hackdemo.win/',
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
    <PageLayout breadcrumbs={[{ name: 'Home', href: 'https://hackdemo.win/' }]}>
      <JsonLd data={softwareAppSchema} />
      <JsonLd data={speakableSchema} />
      <HomePage />
    </PageLayout>
  );
}
