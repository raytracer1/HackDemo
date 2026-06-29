import type { Metadata } from 'next';
import PageLayout from '@/components/PageLayout';
import BlogPostPage from '@/views/BlogPostPage';
import JsonLd from '@/components/JsonLd';
import { blogPosts } from '@/data/blog-posts';

// ISR — blog content changes only on deployment; pre-render known posts at build time
export const revalidate = 3600;

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

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
      ...(post.dateModified ? { modifiedTime: post.dateModified } : {}),
      ...(post.section ? { section: post.section } : {}),
      ...(post.tags ? { tags: post.tags } : {}),
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

function buildArticleSchema(post: (typeof blogPosts)[number]) {
  const url = `https://hackdemo.win/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    ...(post.section ? { articleSection: post.section } : {}),
    ...(post.keywords ? { keywords: post.keywords.join(', ') } : {}),
    ...(post.tags ? { about: post.tags.map((t) => ({ '@type': 'Thing', name: t })) } : {}),
    datePublished: post.date,
    ...(post.dateModified ? { dateModified: post.dateModified } : {}),
    url,
    image: 'https://hackdemo.win/img/og.jpg',
    author: {
      '@type': 'Organization',
      name: 'HackDemo',
      url: 'https://hackdemo.win',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HackDemo',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hackdemo.win/img/normal.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  return (
    <PageLayout
      breadcrumbs={[
        { name: 'Home', href: 'https://hackdemo.win/' },
        { name: 'Blog', href: 'https://hackdemo.win/blog' },
        { name: post?.title || 'Post', href: `https://hackdemo.win/blog/${slug}` },
      ]}
    >
      {post && <JsonLd data={buildArticleSchema(post)} />}
      <BlogPostPage />
    </PageLayout>
  );
}
