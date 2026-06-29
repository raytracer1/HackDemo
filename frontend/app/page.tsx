import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import HomePage from '@/views/HomePage';

export const metadata: Metadata = {
  title: 'Turn Clicks into Product Demos with AI',
};

export default function Page() {
  return <PageLayout><HomePage /></PageLayout>;
}
