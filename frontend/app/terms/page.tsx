import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import TermsPage from '@/views/TermsPage';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function Page() { return <PageLayout><TermsPage /></PageLayout>; }
