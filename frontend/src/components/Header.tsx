'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import logo from '/public/img/normal.png';

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image src={logo} alt="HackDemo" width={36} height={36} className="rounded-lg" priority />
          <span className="text-lg font-semibold tracking-tight text-gray-900">HackDemo</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 no-underline transition-colors hover:bg-gray-100 hover:text-gray-900">Home</Link>
          <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 no-underline transition-colors hover:bg-gray-100 hover:text-gray-900">Pricing</Link>
          <Link href="/blog" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 no-underline transition-colors hover:bg-gray-100 hover:text-gray-900">Blog</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(o => !o)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100">
                {user.image ? (
                  <Image src={user.image} alt={user.name || 'User'} width={28} height={28} className="rounded-full ring-2 ring-hack-primary/30" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gray-300 ring-2 ring-hack-primary/30" />
                )}
                <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg shadow-gray-200/50">
                  <div className="border-b border-gray-100 px-4 py-2.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs">
                      <span className="text-gray-400">Balance</span>
                      <span className="font-medium text-hack-success">${user.credits.toFixed(4)}</span>
                    </p>
                  </div>
                  <Link href="/history" onClick={() => setDropdownOpen(false)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 no-underline transition-colors hover:bg-gray-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    History
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-hack-danger">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-hack-primary px-4 py-2 text-sm font-medium text-white no-underline transition-all hover:bg-indigo-600 active:scale-95">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
