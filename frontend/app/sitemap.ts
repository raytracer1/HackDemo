import { MetadataRoute } from 'next';
import { blogPosts } from '@/data/blog-posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hackdemo.win';
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: today, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/pricing`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/help`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Blog posts — generated dynamically from the data layer
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date, // uses the published date from blog-posts.ts
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
