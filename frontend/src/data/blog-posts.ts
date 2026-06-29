// Blog post metadata — used by both the list page and for SEO generateMetadata.

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string; // datePublished (ISO 8601)
  dateModified?: string; // ISO 8601 — signals content freshness to search engines
  readTime: string;
  description: string;
  keywords?: string[];
}

export const blogPosts: BlogPostMeta[] = [
  {
    slug: 'hackdemo-vs-guidde',
    title: 'HackDemo vs Guidde: The Better Way to Create Product Demos',
    date: '2026-01-15',
    dateModified: '2026-06-29',
    readTime: '12 min read',
    description:
      'HackDemo vs Guidde — a head-to-head comparison of features, pricing, and developer experience for browser demo recording tools.',
    keywords: ['hackdemo', 'guidde', 'product demo', 'browser recorder', 'comparison'],
  },
];
