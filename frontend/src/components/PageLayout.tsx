'use client';
import Header from './Header';
import Footer from './Footer';
import JsonLd from './JsonLd';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.href,
    })),
  };
}

export default function PageLayout({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {breadcrumbs && breadcrumbs.length > 0 && (
        <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />
      )}
    </div>
  );
}
