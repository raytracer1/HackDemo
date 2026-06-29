import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import PricingPage from '@/views/PricingPage';

export const metadata: Metadata = { title: 'Pricing' };

export default function Page() { return <PageLayout><PricingPage /></PageLayout>; }
