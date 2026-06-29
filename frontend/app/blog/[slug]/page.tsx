import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import BlogPostPage from '@/views/BlogPostPage';

export const metadata: Metadata = { title: 'Blog' };

export default function Page() { return <PageLayout><BlogPostPage /></PageLayout>; }
