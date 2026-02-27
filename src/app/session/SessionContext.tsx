/**
 * In-memory session for prototype. Replace with API auth (JWT) when backend exists.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '../../shared/types';

interface SessionContextValue {
  session: Session | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  user: User | null;
  /** Tenant ID for tenant users (TENANT_OWNER, STAFF). Set on login from user.tenantId. */
  tenantId: string | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const login = useCallback((user: User) => {
    setSession({ user });
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      login,
      logout,
      isAuthenticated: session !== null,
      user: session?.user ?? null,
      tenantId: session?.user?.tenantId ?? null,
    }),
    [session, login, logout]
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
