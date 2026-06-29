'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { blogPosts } from '@/views/blog-posts/data';

/* ------------------------------------------------------------------ */
/*  Lazy-load each post — only the viewed article is sent to the client */
/* ------------------------------------------------------------------ */

const postComponents: Record<string, React.ComponentType> = {
  'hackdemo-vs-guidde': dynamic(() => import('./blog-posts/hackdemo-vs-guidde')),
  'how-to-create-product-demo-best-practices': dynamic(() => import('./blog-posts/how-to-create-product-demo-best-practices')),
  'ai-narration-vs-manual-voiceover': dynamic(() => import('./blog-posts/ai-narration-vs-manual-voiceover')),
  'browser-extensions-demo-recording-2026': dynamic(() => import('./blog-posts/browser-extensions-demo-recording-2026')),
  'export-high-quality-mp4-demo-videos': dynamic(() => import('./blog-posts/export-high-quality-mp4-demo-videos')),
  'ai-generated-product-demos-2026-trends': dynamic(() => import('./blog-posts/ai-generated-product-demos-2026-trends')),
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function BlogPostPage() {
  const slug = (useParams() as any)?.slug as string | undefined;
  const PostContent = slug ? postComponents[slug] : null;
  const meta = slug ? blogPosts.find((p) => p.slug === slug) : null;

  if (!PostContent || !meta) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-gray-500">Post not found.</p>
        <Link href="/blog" className="mt-2 text-hack-primary hover:underline text-sm">← Back to Blog</Link>
      </div>
    );
  }

  const displayDate = new Date(meta.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/blog" className="text-xs font-medium text-hack-primary no-underline hover:underline">← Back to Blog</Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">{meta.title}</h1>
        <p className="mt-3 text-sm text-gray-400">{displayDate} · {meta.readTime}</p>
        <div className="mt-10">
          <PostContent />
        </div>
      </div>
    </div>
  );
}
