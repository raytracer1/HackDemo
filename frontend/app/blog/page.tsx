import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import PageLayout from '@/components/PageLayout';
import BlogPage from '@/views/BlogPage';

const title = 'Blog';
const description =
  'Thoughts on product demos, browser recording, and AI narration. Tips, comparisons, and best practices for creating effective demo videos.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['product demo blog', 'browser recording tips', 'AI narration', 'demo video guide'],
  openGraph: {
    title: `HackDemo Blog — ${title}`,
    description,
    images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: 'HackDemo Blog' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `HackDemo Blog — ${title}`,
    description,
    images: [{ url: '/img/og.jpg', alt: 'HackDemo Blog' }],
  },
};

export default function Page() {
  return (
    <PageLayout
      breadcrumbs={[
        { name: 'Home', href: 'https://hackdemo.win/' },
        { name: 'Blog', href: 'https://hackdemo.win/blog' },
      ]}
    >
      <BlogPage />
    </PageLayout>
  );
}
