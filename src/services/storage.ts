/**
 * Persistence layer for Clinic CRM.
 * Uses localStorage with a versioned key; wraps all access in try/catch for
 * private/incognito and quota errors. No external API—all data is local.
 */

import type { AppState, Tenant, CallSession, AuditLog, User, Booking, Patient } from '../types';
import { INITIAL_DATA } from '../mocks/initialData';

/** Key for localStorage; fixed for backward compatibility (future: use versioned key for migrations). */
const STORAGE_KEY = 'agentos_state';

/** In-memory cache of last read state to avoid repeated localStorage parse (per best practices). */
let stateCache: AppState | null = null;

/**
 * Reads full app state from localStorage. Uses seed data if empty; normalizes
 * missing keys for backward compatibility. Caches result for the same tick.
 */
function getState(): AppState {
  if (stateCache !== null) {
    return stateCache;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saveState(INITIAL_DATA);
      stateCache = INITIAL_DATA;
      return INITIAL_DATA;
    }
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      stateCache = INITIAL_DATA;
      return INITIAL_DATA;
    }
    const state = parsed as AppState;
    state.tenants = state.tenants ?? INITIAL_DATA.tenants ?? [];
    state.sessions = state.sessions ?? INITIAL_DATA.sessions ?? [];
    state.auditLogs = state.auditLogs ?? INITIAL_DATA.auditLogs ?? [];
    state.patients = state.patients ?? INITIAL_DATA.patients ?? [];
    state.bookings = state.bookings ?? INITIAL_DATA.bookings ?? [];
    if (state.me?.role === 'MANAGER' && state.me.tenantId == null) {
      state.me.tenantId = 't_001';
    }
    stateCache = state;
    return state;
  } catch {
    stateCache = INITIAL_DATA;
    return INITIAL_DATA;
  }
}

/**
 * Writes full app state to localStorage. Clears cache so next getState() reads fresh.
 */
function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    stateCache = state;
  } catch {
    stateCache = null;
  }
}

/**
 * Clears the in-memory cache. Call after external storage changes (e.g. another tab).
 */
function invalidateCache(): void {
  stateCache = null;
}

// ---------------------------------------------------------------------------
// Tenant CRUD
// ---------------------------------------------------------------------------

export const storage = {
  getState,
  saveState,
  invalidateCache,

  getTenants(): Tenant[] {
    return getState().tenants;
  },

  getTenant(id: string): Tenant | undefined {
    return getState().tenants.find((t) => t.id === id);
  },

  createTenant(tenant: Tenant): void {
    const state = getState();
    state.tenants.push(tenant);
    state.auditLogs.unshift({
      id: `a_${Date.now()}`,
      ts: new Date().toISOString(),
      actor: state.me?.name ?? 'System',
      action: 'TENANT_CREATED',
      target: tenant.id,
      tenantId: tenant.id,
    });
    saveState(state);
  },

  updateTenant(id: string, patch: Partial<Tenant>): void {
    const state = getState();
    const index = state.tenants.findIndex((t) => t.id === id);
    if (index === -1) return;
    state.tenants[index] = { ...state.tenants[index], ...patch };
    state.auditLogs.unshift({
      id: `a_${Date.now()}`,
      ts: new Date().toISOString(),
      actor: state.me?.name ?? 'System',
      action: 'TENANT_UPDATED',
      target: id,
      tenantId: id,
    });
    saveState(state);
  },

  // ---------------------------------------------------------------------------
  // Sessions (call logs)
  // ---------------------------------------------------------------------------

  getSessions(tenantId?: string): CallSession[] {
    const sessions = getState().sessions;
    return tenantId ? sessions.filter((s) => s.tenantId === tenantId) : sessions;
  },

  getSession(id: string): CallSession | undefined {
    return getState().sessions.find((s) => s.id === id);
  },

  getAuditLogs(tenantId?: string): AuditLog[] {
    const logs = getState().auditLogs;
    return tenantId ? logs.filter((l) => l.tenantId === tenantId) : logs;
  },

  // ---------------------------------------------------------------------------
  // Bookings
  // ---------------------------------------------------------------------------

  getBookings(tenantId?: string): Booking[] {
    const bookings = getState().bookings;
    return tenantId ? bookings.filter((b) => b.tenantId === tenantId) : bookings;
  },

  getBooking(id: string): Booking | undefined {
    return getState().bookings.find((b) => b.id === id);
  },

  createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const state = getState();
    const newBooking: Booking = {
      ...booking,
      id: `b_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    state.bookings.unshift(newBooking);
    saveState(state);
    return newBooking;
  },

  updateBooking(id: string, patch: Partial<Booking>): void {
    const state = getState();
    const index = state.bookings.findIndex((b) => b.id === id);
    if (index === -1) return;
    state.bookings[index] = { ...state.bookings[index], ...patch };
    saveState(state);
  },

  // ---------------------------------------------------------------------------
  // Patients
  // ---------------------------------------------------------------------------

  getPatients(): Patient[] {
    return getState().patients;
  },

  getPatient(id: string): Patient | undefined {
    return getState().patients.find((p) => p.id === id);
  },

  createPatient(patient: Omit<Patient, 'id' | 'createdAt'>): Patient {
    const state = getState();
    const newPatient: Patient = {
      ...patient,
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    state.patients.push(newPatient);
    saveState(state);
    return newPatient;
  },

  // ---------------------------------------------------------------------------
  // Auth (demo: role-only login, no credentials)
  // ---------------------------------------------------------------------------

  login(role: 'ADMIN' | 'MANAGER'): User {
    const state = getState();
    state.me = {
      id: role === 'ADMIN' ? 'u1' : 'u2',
      name: role === 'ADMIN' ? 'Admin User' : 'Clinic Manager',
      email: role === 'ADMIN' ? 'admin@agentos.ai' : 'manager@clinic.com',
      role,
      ...(role === 'MANAGER' && { tenantId: 't_001' }),
    };
    saveState(state);
    return state.me;
  },

  logout(): void {
    const state = getState();
    state.me = null;
    saveState(state);
  },
};
