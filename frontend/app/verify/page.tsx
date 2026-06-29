import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import VerifyPage from '@/views/VerifyPage';

export const metadata: Metadata = {
  title: 'Verify Email',
  robots: { index: false, follow: false },
};

export default function Page() { return <VerifyPage />; }
