import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import DemoPage from '@/components/DemoPage';

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Watch your HackDemo recording with AI-narrated annotations, step-by-step breakdowns, and MP4 export.',
  robots: { index: false }, // user-specific pages — not useful for search
};

export default function Page() {
  return (
    <PageLayout
      breadcrumbs={[
        { name: 'Home', href: 'https://hackdemo.win/' },
        { name: 'Demo', href: '#' },
      ]}
    >
      <DemoPage />
    </PageLayout>
  );
}
