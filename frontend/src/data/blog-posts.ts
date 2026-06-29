// Blog post metadata — used by both the list page and for SEO generateMetadata.

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  description: string;
  keywords?: string[];
}

export const blogPosts: BlogPostMeta[] = [
  {
    slug: 'hackdemo-vs-guidde',
    title: 'HackDemo vs Guidde: The Better Way to Create Product Demos',
    date: '2026-01-15',
    readTime: '12 min read',
    description:
      'HackDemo vs Guidde — a head-to-head comparison of features, pricing, and developer experience for browser demo recording tools.',
    keywords: ['hackdemo', 'guidde', 'product demo', 'browser recorder', 'comparison'],
  },
];
