'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ── Types ──

export interface User {
  email: string;
  name: string;
  /** Google profile picture or generated avatar fallback */
  image?: string;
  /** Account credit balance in USD */
  credits: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Redirect to Google OAuth sign-in */
  login: () => void;
  /** Sign out via Auth.js endpoint, then redirect home */
  logout: () => void;
  /** Re-fetch session to get latest credits */
  refresh: () => Promise<void>;
}

// Session shape returned by Auth.js v5 GET /api/auth/session
interface SessionResponse {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    /** Credits balance from our database (injected by session callback) */
    credits?: number;
  };
}

// ── Helpers ──

// In dev, VITE_BACKEND_URL is empty → relative paths work via Vite proxy.
// In production, it's the backend domain (e.g. https://hack-demo-du4z.vercel.app).
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

function api(path: string): string {
  return `${API_BASE}${path}`;
}

function generateAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
}

// ── Extension bridge ──

/** Pending auth data, sent when content script signals it's ready. */
let pendingAuthPayload: any = null;

/** Send auth to extension via DOM + postMessage. */
async function sendTokenToExtension(user: { name: string; email: string; image?: string }) {
  try {
    const res = await fetch(api('/api/auth/token'), { credentials: 'include' });
    if (!res.ok) return;

    const data = await res.json();
    if (data.token) {
      pendingAuthPayload = {
        source: 'hackdemo-web',
        type: 'AUTH_TOKEN',
        token: data.token,
        user: { name: user.name, email: user.email, image: user.image },
      };

      deliverAuth();
    }
  } catch {
    // Extension not available — that's fine
  }
}

function deliverAuth() {
  if (!pendingAuthPayload) return;

  // 1. DOM data attribute (shared world, survives race conditions)
  typeof document !== "undefined" && document.documentElement.setAttribute(
    'data-hackdemo-auth',
    JSON.stringify(pendingAuthPayload),
  );

  // 2. postMessage (immediate delivery when CS is already listening)
  if (typeof window !== 'undefined') {
    window.postMessage(pendingAuthPayload, window.location.origin);
  }
}

/** Clear auth data from the extension. */
function clearExtensionAuth() {
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-hackdemo-auth');
  }
  if (typeof window !== 'undefined') {
    window.postMessage({ source: 'hackdemo-web', type: 'LOGOUT' }, window.location.origin);
  }
}

// Listen for content script's ready signal
window.addEventListener('message', function (event) {
  if (event.data?.source === 'hackdemo-cs' && event.data?.type === 'CS_READY') {
    // Content script is now listening — deliver pending auth
    if (pendingAuthPayload) deliverAuth();
  }
});

// ── Context ──

const AuthContext = createContext<AuthState | undefined>(undefined);

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSession() {
    try {
      const res = await fetch(api('/api/auth/session'), {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Session fetch failed: ${res.status}`);

      const session: SessionResponse | null = await res.json();

      if (session?.user) {
        const u = session.user;
        setUser({
          name: u.name || 'User',
          email: u.email || '',
          image: u.image || generateAvatarUrl(u.name || 'User'),
          credits: u.credits ?? 0,
        });
        // Send API token to extension (if installed)
        sendTokenToExtension({
          name: u.name || 'User',
          email: u.email || '',
          image: u.image || undefined,
        });
      } else {
        setUser(null);
        // Clear extension auth when session is gone
        clearExtensionAuth();
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch current session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const login = useCallback(() => {
    if (typeof document === 'undefined') return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = api('/api/auth/signin/google');
    const callbackInput = document.createElement('input');
    callbackInput.type = 'hidden';
    callbackInput.name = 'callbackUrl';
    callbackInput.value = window.location.origin + '/';
    form.appendChild(callbackInput);
    document.body.appendChild(form);
    form.submit();
  }, []);

  const logout = useCallback(() => {
    clearExtensionAuth();
    if (typeof document === 'undefined') return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = api('/api/auth/signout');
    const callbackInput = document.createElement('input');
    callbackInput.type = 'hidden';
    callbackInput.name = 'callbackUrl';
    callbackInput.value = window.location.origin + '/';
    form.appendChild(callbackInput);
    document.body.appendChild(form);
    form.submit();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refresh: loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
