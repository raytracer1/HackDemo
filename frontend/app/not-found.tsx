import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-500">Page not found</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-hack-primary px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-indigo-600"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
