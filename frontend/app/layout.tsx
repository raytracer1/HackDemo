import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';

const Providers = dynamic(() => import('@/components/Providers'), { ssr: false });

export const metadata: Metadata = {
  title: {
    default: 'HackDemo — Turn Clicks into Product Demos with AI',
    template: '%s — HackDemo',
  },
  description: 'Record your browser workflow and let AI generate narrated, annotated demo videos in 20+ languages. Export as MP4 to share.',
  keywords: ['product demo', 'browser recorder', 'AI narration', 'demo video', 'how-to tutorial', 'chrome extension'],
  metadataBase: new URL('https://hackdemo.win'),
  openGraph: {
    title: 'HackDemo — Turn Clicks into Product Demos with AI',
    description: 'Record your browser workflow and let AI generate narrated, annotated demo videos.',
    images: '/img/og.jpg',
    siteName: 'HackDemo',
  },
  twitter: {
    card: 'summary',
    title: 'HackDemo — Turn Clicks into Product Demos with AI',
    description: 'Record your browser workflow and let AI generate narrated, annotated demo videos.',
    images: '/img/og.jpg',
  },
  icons: { icon: '/img/normal.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
