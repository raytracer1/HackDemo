import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import PrivacyPage from '@/views/PrivacyPage';

const title = 'Privacy Policy';
const description =
  'How HackDemo collects, uses, and protects your data. Learn about cookies, analytics, and your privacy rights when using our demo recording platform.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://hackdemo.win/privacy' },
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

export default function Page() {
  return (
    <PageLayout
      breadcrumbs={[
        { name: 'Home', href: 'https://hackdemo.win/' },
        { name: 'Privacy Policy', href: 'https://hackdemo.win/privacy' },
      ]}
    >
      <PrivacyPage />
    </PageLayout>
  );
}
