import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import LoginPage from '@/views/LoginPage';

export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
};

export default function Page() { return <LoginPage />; }
