import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import BlogPage from '@/views/BlogPage';

export const metadata: Metadata = { title: 'Blog' };

export default function Page() { return <PageLayout><BlogPage /></PageLayout>; }
