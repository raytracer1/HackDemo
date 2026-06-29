import type { Metadata } from 'next';
import PageLayout from '@/components/PageLayout';
import BlogPostPage from '@/views/BlogPostPage';
import { blogPosts } from '@/data/blog-posts';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);
  if (!post) return { title: 'Blog' };

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      title: post.title,
      description: post.description,
    },
  };
}

export default function Page() {
  return <PageLayout><BlogPostPage /></PageLayout>;
}
