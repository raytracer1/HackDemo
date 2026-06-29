import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import HistoryPage from '@/views/HistoryPage';

const title = 'History';

export const metadata: Metadata = {
  title,
  description: 'View your recent HackDemo recordings — check demo status, replay videos, and export MP4 files.',
  robots: { index: false }, // auth-gated page — not useful for search
};

export default function Page() {
  return (
    <PageLayout
      breadcrumbs={[
        { name: 'Home', href: 'https://hackdemo.win/' },
        { name: 'History', href: 'https://hackdemo.win/history' },
      ]}
    >
      <HistoryPage />
    </PageLayout>
  );
}
