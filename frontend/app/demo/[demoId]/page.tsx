import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import DemoPage from '@/components/DemoPage';

export const metadata: Metadata = { title: 'Demo' };

export default function Page() { return <PageLayout><DemoPage /></PageLayout>; }
