// Reusable JSON-LD structured data component for SEO / GEO.
// Injects a <script type="application/ld+json"> with the given schema object.
// Safe to include multiple instances per page — search engines merge them.

export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
