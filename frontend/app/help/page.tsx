import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import HelpPage from '@/views/HelpPage';

export const metadata: Metadata = { title: 'Help' };

export default function Page() { return <PageLayout><HelpPage /></PageLayout>; }
