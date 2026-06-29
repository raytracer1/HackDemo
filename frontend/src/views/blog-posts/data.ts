// Blog post metadata — used by both the list page and for SEO generateMetadata.

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string; // datePublished (ISO 8601)
  dateModified?: string; // ISO 8601 — signals content freshness to search engines
  readTime: string;
  description: string;
  keywords?: string[];
  section?: string; // article:section — broad category (e.g. "Comparisons", "Guides")
  tags?: string[]; // article:tag — specific topic tags for OpenGraph and schema
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
    section: 'Comparisons',
    tags: ['product demo', 'browser recorder', 'AI narration', 'guidde', 'saas tools'],
  },
  {
    slug: 'how-to-create-product-demo-best-practices',
    title: 'How to Create a Product Demo That Converts: 7 Best Practices for 2026',
    date: '2026-02-20',
    dateModified: '2026-06-29',
    readTime: '10 min read',
    description:
      'Learn how to create product demos that drive conversions — from planning your narrative to choosing the right recording tool, annotation strategy, and export format.',
    keywords: ['how to create product demo', 'demo best practices', 'product walkthrough', 'demo recording guide'],
    section: 'Guides',
    tags: ['product demo', 'demo best practices', 'conversion optimization', 'sales demos', 'saas marketing'],
  },
  {
    slug: 'ai-narration-vs-manual-voiceover',
    title: 'AI Narration vs Manual Voiceover: Why AI Wins for Product Demo Videos',
    date: '2026-03-15',
    dateModified: '2026-06-29',
    readTime: '8 min read',
    description:
      'AI text-to-speech narration delivers faster turnaround, lower cost, and multi-language support than manual voiceovers. A data-driven comparison for demo creators.',
    keywords: ['AI narration', 'text-to-speech demo', 'AI voiceover', 'TTS comparison', 'product demo voiceover'],
    section: 'Comparisons',
    tags: ['AI narration', 'text-to-speech', 'voiceover', 'demo production', 'saas tools'],
  },
  {
    slug: 'browser-extensions-demo-recording-2026',
    title: 'Top 5 Browser Extensions for Product Demo Recording in 2026',
    date: '2026-04-28',
    dateModified: '2026-06-29',
    readTime: '12 min read',
    description:
      'Compare the best browser-based demo recorders of 2026 — HackDemo, Guidde, Loom, Scribe, and Screenity — across features, pricing, AI capabilities, and export quality.',
    keywords: ['browser demo recorder', 'chrome extension recorder', 'screen capture extension', 'product demo tools'],
    section: 'Comparisons',
    tags: ['browser recorder', 'chrome extension', 'screen recorder', 'loom', 'guidde', 'tool comparison'],
  },
  {
    slug: 'export-high-quality-mp4-demo-videos',
    title: 'How to Export High-Quality MP4 Demo Videos: Resolution, Bitrate, and Best Settings',
    date: '2026-05-22',
    dateModified: '2026-06-29',
    readTime: '9 min read',
    description:
      'A practical guide to MP4 export settings for product demo videos — resolution, bitrate, frame rate, H.264 vs H.265, and how to balance quality with file size.',
    keywords: ['mp4 export settings', 'video bitrate guide', 'demo video quality', 'ffmpeg export', 'video encoding'],
    section: 'Guides',
    tags: ['mp4', 'video encoding', 'ffmpeg', 'resolution', 'bitrate', 'demo production'],
  },
  {
    slug: 'ai-generated-product-demos-2026-trends',
    title: 'The Rise of AI-Generated Product Demos: 5 Trends Shaping 2026',
    date: '2026-06-15',
    dateModified: '2026-06-29',
    readTime: '7 min read',
    description:
      'AI-generated product demos are transforming SaaS marketing. From automated narration to personalized demo videos and AI avatars — the trends you need to watch in 2026.',
    keywords: ['AI-generated demos', 'product demo trends 2026', 'automated video demos', 'AI video generation'],
    section: 'Trends',
    tags: ['AI trends', 'video automation', 'product marketing', 'generative AI', 'demo innovation'],
  },
];
