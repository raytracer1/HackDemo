import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import TermsPage from '@/views/TermsPage';

const title = 'Terms of Service';
const description =
  'The terms and conditions for using the HackDemo platform — browser extension, AI narration, demo video generation, and payment terms.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://hackdemo.win/terms' },
  openGraph: {
    title: `${title} — HackDemo`,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${title} — HackDemo`,
    description,
  },
};

export default function Page() { return <PageLayout><TermsPage /></PageLayout>; }
