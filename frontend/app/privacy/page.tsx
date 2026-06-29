import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import PrivacyPage from '@/views/PrivacyPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function Page() { return <PageLayout><PrivacyPage /></PageLayout>; }
