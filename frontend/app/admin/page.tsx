import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const AdminPanel = nextDynamic(() => import('./AdminPanel'), { ssr: false });

export default function AdminPage() {
  return <AdminPanel />;
}
