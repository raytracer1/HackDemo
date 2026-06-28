import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    logout(); // triggers a full-page form POST, browser navigates away
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2.5 text-white no-underline hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-hack-primary text-sm font-bold">
            HD
          </div>
          <span className="text-lg font-semibold tracking-tight">HackDemo</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 no-underline transition-colors hover:bg-gray-800 hover:text-white"
          >
            Home
          </Link>
          <Link
            to="/pricing"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 no-underline transition-colors hover:bg-gray-800 hover:text-white"
          >
            Pricing
          </Link>
        </nav>

        {/* Right side: auth */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
          ) : isAuthenticated && user ? (
            /* ── Logged in ── */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-7 w-7 rounded-full ring-2 ring-hack-primary/40"
                />
                <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-700 bg-gray-900 py-1.5 shadow-xl shadow-black/40">
                  <div className="border-b border-gray-800 px-4 py-2.5">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs">
                      <span className="text-gray-500">Balance</span>
                      <span className="font-medium text-hack-success">${user.credits.toFixed(2)}</span>
                    </p>
                  </div>
                  <Link
                    to="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 no-underline transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-hack-danger"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Logged out ── */
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-hack-primary px-4 py-2 text-sm font-medium text-white no-underline transition-all hover:bg-indigo-500 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
