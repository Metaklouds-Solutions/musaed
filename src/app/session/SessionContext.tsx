/**
 * In-memory session for prototype. Replace with API auth (JWT) when backend exists.
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
import { SESSION_IDLE_TIMEOUT_MS, SESSION_WARNING_BEFORE_MS } from './sessionConfig';
/** Throttle activity updates to avoid excessive state updates. */
const ACTIVITY_THROTTLE_MS = 10_000;

interface SessionContextValue {
  session: Session | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  user: User | null;
  tenantId: string | null;
  /** When the session started (login time). */
  sessionStartedAt: number | null;
  /** Last user activity timestamp. */
  lastActivityAt: number | null;
  /** Reset idle timer (extends session). */
  extendSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const lastActivityRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const [lastActivityAt, setLastActivityAt] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const warningShownRef = useRef(false);

  const login = useCallback((user: User) => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastUpdateRef.current = now;
    warningShownRef.current = false;
    setSession({ user });
    setSessionStartedAt(now);
    setLastActivityAt(now);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setSessionStartedAt(null);
  }, []);

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
      logout,
      isAuthenticated: session !== null,
      user: session?.user ?? null,
      tenantId: session?.user?.tenantId ?? null,
      sessionStartedAt,
      lastActivityAt: session ? lastActivityAt : null,
      extendSession,
    }),
    [session, login, logout, sessionStartedAt, lastActivityAt, extendSession]
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
