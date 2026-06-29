import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import HistoryPage from '@/views/HistoryPage';

export const metadata: Metadata = { title: 'History' };

export default function Page() { return <PageLayout><HistoryPage /></PageLayout>; }
