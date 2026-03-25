/**
 * Session context with JWT persistence. Restores session from stored tokens on reload.
 * Includes idle timeout and activity tracking for session management.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import type { Session, User } from '../../shared/types';
import { setTokens, clearTokens, getAccessToken, getRefreshToken, saveUser } from '../../lib/apiClient';
import { primeTenantSettingsCaches } from '../../adapters/api/tenantSettingsCache';
import { normalizeAuthUser } from '../../lib/authUser';
import { SESSION_IDLE_TIMEOUT_MS, SESSION_WARNING_BEFORE_MS } from './sessionConfig';

const ACTIVITY_THROTTLE_MS = 10_000;
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

interface SessionContextValue {
  session: Session | null;
  login: (user: User) => void;
  loginWithTokens: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  user: User | null;
  tenantId: string | null;
  sessionStartedAt: number | null;
  lastActivityAt: number | null;
  extendSession: () => void;
  restoring: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const lastActivityRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const [lastActivityAt, setLastActivityAt] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const warningShownRef = useRef(false);
  const restoredRef = useRef(false);

  const login = useCallback((user: User) => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastUpdateRef.current = now;
    warningShownRef.current = false;
    setSession({ user });
    setSessionStartedAt(now);
    setLastActivityAt(now);
    saveUser(user as unknown as Record<string, unknown>);
  }, []);

  const loginWithTokens = useCallback((accessToken: string, refreshToken: string, user: User) => {
    setTokens(accessToken, refreshToken);
    login(user);
  }, [login]);

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    if (rt) {
      fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => {
        /* best-effort server-side revocation */
      });
    }
    clearTokens();
    setSession(null);
    setSessionStartedAt(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev.user, ...updates };
      saveUser(updatedUser as unknown as Record<string, unknown>);
      return { ...prev, user: updatedUser };
    });
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const token = getAccessToken();
    if (!token) {
      setRestoring(false);
      return;
    }

    const restoreFromApi = async (): Promise<User | null> => {
      try {
        let res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const rt = getRefreshToken();
          if (!rt) return null;
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
          if (!refreshRes.ok) return null;
          const refreshData = await refreshRes.json();
          setTokens(refreshData.accessToken, rt);
          res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${refreshData.accessToken}` },
          });
          if (!res.ok) return null;
        }

        const userData = await res.json();
        return normalizeAuthUser(userData);
      } catch {
        return null;
      }
    };

    restoreFromApi()
      .then((user) => {
        if (user) {
          login(user);
          return;
        }
        // Token restore failed: clear stale auth state to avoid repeated 401 loops.
        clearTokens();
      })
      .finally(() => {
        setRestoring(false);
      });
  }, [login]);

  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastUpdateRef.current = now;
    warningShownRef.current = false;
    setLastActivityAt(now);
  }, []);

  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (now - lastUpdateRef.current > ACTIVITY_THROTTLE_MS) {
      lastUpdateRef.current = now;
      setLastActivityAt(now);
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.VITE_DATA_MODE !== 'api') return;
    const tid = session?.user?.tenantId;
    if (!tid) return;
    const token = getAccessToken();
    if (!token) return;
    void fetch(`${BASE_URL}/tenant/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (data) primeTenantSettingsCaches(tid, data);
      })
      .catch((error: unknown) => {
        console.warn('Failed to prime tenant settings cache', error);
      });
  }, [session?.user?.tenantId]);

  useEffect(() => {
    if (!session) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => updateActivity();
    events.forEach((e) => window.addEventListener(e, handler));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [session, updateActivity]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      const now = Date.now();
      const idle = now - lastActivityRef.current;
      const remaining = SESSION_IDLE_TIMEOUT_MS - idle;

      if (idle >= SESSION_IDLE_TIMEOUT_MS) {
        toast.info('Session expired due to inactivity');
        logout();
        return;
      }
      if (remaining <= SESSION_WARNING_BEFORE_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        toast.warning(`Session expiring in ${Math.ceil(remaining / 60_000)} min. Move mouse or click to stay logged in.`);
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [session, logout]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      login,
      loginWithTokens,
      logout,
      updateUser,
      isAuthenticated: session !== null,
      user: session?.user ?? null,
      tenantId: session?.user?.tenantId ?? null,
      sessionStartedAt,
      lastActivityAt: session ? lastActivityAt : null,
      extendSession,
      restoring,
    }),
    [session, login, loginWithTokens, logout, updateUser, sessionStartedAt, lastActivityAt, extendSession, restoring]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
