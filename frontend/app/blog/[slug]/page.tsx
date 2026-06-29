import type { Metadata } from 'next';
import PageLayout from '@/components/PageLayout';
import BlogPostPage from '@/views/BlogPostPage';
import { blogPosts } from '@/data/blog-posts';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: 'Blog' };

  const url = `https://hackdemo.win/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url,
      images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [{ url: '/img/og.jpg', alt: post.title }],
    },
  };
}

export default function Page() {
  return <PageLayout><BlogPostPage /></PageLayout>;
}
