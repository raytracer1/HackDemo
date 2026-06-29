import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/verify', '/history', '/demo/'],
    },
    sitemap: 'https://hackdemo.win/sitemap.xml',
  };
}
