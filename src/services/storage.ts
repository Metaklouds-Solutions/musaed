import { AppState, Tenant, CallSession, AuditLog, User, Booking, Patient } from '../types';
import { INITIAL_DATA } from '../mocks/initialData';

const STORAGE_KEY = 'agentos_state';

export const storage = {
  getState(): AppState {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      this.saveState(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const state = JSON.parse(saved);
    // Ensure all fields exist for backward compatibility
    if (!state.tenants) state.tenants = INITIAL_DATA.tenants || [];
    if (!state.sessions) state.sessions = INITIAL_DATA.sessions || [];
    if (!state.auditLogs) state.auditLogs = INITIAL_DATA.auditLogs || [];
    if (!state.patients) state.patients = INITIAL_DATA.patients || [];
    if (!state.bookings) state.bookings = INITIAL_DATA.bookings || [];
    return state;
  },

  saveState(state: AppState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  getTenants(): Tenant[] {
    return this.getState().tenants;
  },

  getTenant(id: string): Tenant | undefined {
    return this.getState().tenants.find(t => t.id === id);
  },

  createTenant(tenant: Tenant) {
    const state = this.getState();
    state.tenants.push(tenant);
    state.auditLogs.unshift({
      id: `a_${Date.now()}`,
      ts: new Date().toISOString(),
      actor: state.me?.name || 'System',
      action: 'TENANT_CREATED',
      target: tenant.id,
      tenantId: tenant.id
    });
    this.saveState(state);
  },

  updateTenant(id: string, patch: Partial<Tenant>) {
    const state = this.getState();
    const index = state.tenants.findIndex(t => t.id === id);
    if (index !== -1) {
      state.tenants[index] = { ...state.tenants[index], ...patch };
      state.auditLogs.unshift({
        id: `a_${Date.now()}`,
        ts: new Date().toISOString(),
        actor: state.me?.name || 'System',
        action: 'TENANT_UPDATED',
        target: id,
        tenantId: id
      });
      this.saveState(state);
    }
  },

  getSessions(tenantId?: string): CallSession[] {
    const sessions = this.getState().sessions;
    return tenantId ? sessions.filter(s => s.tenantId === tenantId) : sessions;
  },

  getSession(id: string): CallSession | undefined {
    return this.getState().sessions.find(s => s.id === id);
  },

  getAuditLogs(tenantId?: string): AuditLog[] {
    const logs = this.getState().auditLogs;
    return tenantId ? logs.filter(l => l.tenantId === tenantId) : logs;
  },

  // Booking Methods
  getBookings(tenantId?: string): Booking[] {
    const bookings = this.getState().bookings;
    return tenantId ? bookings.filter(b => b.tenantId === tenantId) : bookings;
  },

  getBooking(id: string): Booking | undefined {
    return this.getState().bookings.find(b => b.id === id);
  },

  createBooking(booking: Omit<Booking, 'id' | 'createdAt'>) {
    const state = this.getState();
    const newBooking: Booking = {
      ...booking,
      id: `b_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    state.bookings.unshift(newBooking);
    this.saveState(state);
    return newBooking;
  },

  updateBooking(id: string, patch: Partial<Booking>) {
    const state = this.getState();
    const index = state.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      state.bookings[index] = { ...state.bookings[index], ...patch };
      this.saveState(state);
    }
  },

  // Patient Methods
  getPatients(): Patient[] {
    return this.getState().patients;
  },

  getPatient(id: string): Patient | undefined {
    return this.getState().patients.find(p => p.id === id);
  },

  createPatient(patient: Omit<Patient, 'id' | 'createdAt'>) {
    const state = this.getState();
    const newPatient: Patient = {
      ...patient,
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    state.patients.push(newPatient);
    this.saveState(state);
    return newPatient;
  },

  login(role: 'ADMIN' | 'MANAGER') {
    const state = this.getState();
    state.me = {
      id: role === 'ADMIN' ? 'u1' : 'u2',
      name: role === 'ADMIN' ? 'Admin User' : 'Clinic Manager',
      email: role === 'ADMIN' ? 'admin@agentos.ai' : 'manager@clinic.com',
      role: role
    };
    this.saveState(state);
    return state.me;
  },

  logout() {
    const state = this.getState();
    state.me = null;
    this.saveState(state);
  }
};
