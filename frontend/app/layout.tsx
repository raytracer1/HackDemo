import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import JsonLd from '@/components/JsonLd';

const Providers = dynamic(() => import('@/components/Providers'), { ssr: false });

export const metadata: Metadata = {
  title: {
    default: 'HackDemo — Turn Clicks into Product Demos with AI',
    template: '%s — HackDemo',
  },
  description:
    'Record your browser workflow and let AI generate narrated, annotated demo videos in 20+ languages. Export as MP4 to share.',
  keywords: [
    'product demo',
    'browser recorder',
    'AI narration',
    'demo video',
    'how-to tutorial',
    'chrome extension',
  ],
  metadataBase: new URL('https://hackdemo.win'),
  robots: { index: true, follow: true },
  openGraph: {
    title: 'HackDemo — Turn Clicks into Product Demos with AI',
    description:
      'Record your browser workflow and let AI generate narrated, annotated demo videos.',
    images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: 'HackDemo — Turn Clicks into Product Demos with AI' }],
    siteName: 'HackDemo',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackDemo — Turn Clicks into Product Demos with AI',
    description:
      'Record your browser workflow and let AI generate narrated, annotated demo videos.',
    images: [{ url: '/img/og.jpg', alt: 'HackDemo — Turn Clicks into Product Demos with AI' }],
  },
  icons: { icon: '/img/normal.png' },
};

// ---- site-wide JSON-LD structured data ----

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HackDemo',
  url: 'https://hackdemo.win',
  logo: 'https://hackdemo.win/img/normal.png',
  description:
    'AI-powered product demo platform — record browser workflows and generate narrated video demos in 20+ languages.',
  sameAs: [
    'https://github.com/raytracer1/HackDemo',
    'https://x.com/BJ_Zheng',
    // Add more profiles as they become available:
    // 'https://linkedin.com/company/hackdemo',
    // 'https://chromewebstore.google.com/detail/hackdemo/...',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'HackDemo',
  url: 'https://hackdemo.win',
  description:
    'Turn browser clicks into narrated, annotated product demo videos with AI.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://hackdemo.win/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to critical external origins for faster initial connections */}
        <link rel="preconnect" href="https://api.hackdemo.win" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://www.paypal.com" />
        <link rel="dns-prefetch" href="https://www.paypalobjects.com" />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="bg-white text-gray-900 min-h-screen">
        <Providers>{children}</Providers>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}
