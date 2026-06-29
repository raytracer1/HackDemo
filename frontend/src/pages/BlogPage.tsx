import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const posts = [
  {
    slug: 'hackdemo-vs-guidde',
    title: 'HackDemo vs Guidde: The Better Way to Create Product Demos',
    date: 'June 29, 2026',
    excerpt: 'HackDemo delivers 80% of Guidde\'s core functionality at less than 1% of the cost. A head-to-head comparison of features, pricing, and developer experience.',
    readTime: '4 min read',
  },
];

export default function BlogPage() {
  useEffect(() => { document.title = 'Blog — HackDemo'; }, []);

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
        <p className="mt-2 text-sm text-gray-500">Thoughts on product demos, browser recording, and AI narration.</p>

        <div className="mt-10 space-y-8">
          {posts.map(post => (
            <article key={post.slug} className="border-b border-gray-100 pb-8">
              <p className="text-xs text-gray-400">{post.date} · {post.readTime}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">
                <Link to={`/blog/${post.slug}`} className="no-underline hover:text-hack-primary transition-colors">{post.title}</Link>
              </h2>
              <p className="mt-2 text-sm text-gray-500">{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-hack-primary no-underline hover:underline">
                Read more
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
