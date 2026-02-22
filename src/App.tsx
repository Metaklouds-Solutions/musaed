/**
 * Root application component for Clinic CRM.
 * Handles auth gate, tab-based navigation, and lazy-loaded page content.
 * Data is loaded once on mount and refreshed after mutations (no API yet).
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { storage } from './services/storage';
import type { User, Tenant, CallSession, AuditLog, Patient, Booking } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AnimatePresence, motion } from 'motion/react';

const THEME_KEY = 'clinic-crm-theme';
export type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ---------------------------------------------------------------------------
// Lazy-loaded pages (reduces initial bundle; loaded on first tab/detail view)
// ---------------------------------------------------------------------------

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const TenantList = lazy(() => import('./pages/TenantList').then((m) => ({ default: m.TenantList })));
const TenantDetail = lazy(() => import('./pages/TenantDetail').then((m) => ({ default: m.TenantDetail })));
const TenantWizard = lazy(() => import('./pages/TenantWizard').then((m) => ({ default: m.TenantWizard })));
const TenantDashboard = lazy(() => import('./pages/TenantDashboard').then((m) => ({ default: m.TenantDashboard })));
const CallLogs = lazy(() => import('./pages/CallLogs').then((m) => ({ default: m.CallLogs })));
const CallDetail = lazy(() => import('./pages/CallDetail').then((m) => ({ default: m.CallDetail })));
const Patients = lazy(() => import('./pages/Patients').then((m) => ({ default: m.Patients })));
const PatientDetail = lazy(() => import('./pages/PatientDetail').then((m) => ({ default: m.PatientDetail })));
const Bookings = lazy(() => import('./pages/Bookings').then((m) => ({ default: m.Bookings })));
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then((m) => ({ default: m.AuditLogs })));

/** Shown while a lazy route is loading. */
function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8" aria-live="polite">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [activeTab, setActiveTab] = useState('tenants');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  /** Reload all list data from storage. For MANAGER, scopes to user.tenantId. */
  const refreshData = useCallback(() => {
    const me = storage.getState().me;
    const tenantId = me?.role === 'MANAGER' ? me.tenantId : undefined;

    setTenants(storage.getTenants());
    setSessions(tenantId ? storage.getSessions(tenantId) : storage.getSessions());
    setAuditLogs(tenantId ? storage.getAuditLogs(tenantId) : storage.getAuditLogs());
    setBookings(tenantId ? storage.getBookings(tenantId) : storage.getBookings());

    const allPatients = storage.getPatients();
    if (tenantId) {
      const tenantSessions = storage.getSessions(tenantId);
      const tenantBookings = storage.getBookings(tenantId);
      const patientIds = new Set<string>([
        ...tenantBookings.map((b) => b.patientId),
        ...tenantSessions.map((s) => s.patientId).filter((id): id is string => id != null),
      ]);
      setPatients(allPatients.filter((p) => patientIds.has(p.id)));
    } else {
      setPatients(allPatients);
    }
  }, []);

  useEffect(() => {
    const state = storage.getState();
    if (state.me) {
      setUser(state.me);
      setActiveTab(state.me.role === 'MANAGER' ? 'dashboard' : 'tenants');
    }
    refreshData();
  }, [refreshData]);

  const handleLogin = useCallback(
    (loggedInUser: User) => {
      setUser(loggedInUser);
      setActiveTab(loggedInUser.role === 'MANAGER' ? 'dashboard' : 'tenants');
      refreshData();
    },
    [refreshData]
  );

  const handleLogout = useCallback(() => {
    storage.logout();
    setUser(null);
    setSelectedTenantId(null);
    setSelectedCallId(null);
    setSelectedPatientId(null);
    setActiveTab('tenants');
  }, []);

  const handleUpdateTenant = useCallback(
    (id: string, patch: Partial<Tenant>) => {
      storage.updateTenant(id, patch);
      refreshData();
    },
    [refreshData]
  );

  const setActiveTabAndClearTenant = useCallback((tab: string) => {
    setActiveTab(tab);
    setSelectedTenantId(null);
  }, []);

  const clearSelectedCall = useCallback(() => setSelectedCallId(null), []);
  const clearSelectedPatient = useCallback(() => setSelectedPatientId(null), []);
  const clearSelectedTenant = useCallback(() => setSelectedTenantId(null), []);

  if (!user) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Login
          onLogin={handleLogin}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        />
      </Suspense>
    );
  }

  const contentKey = selectedTenantId ?? selectedCallId ?? selectedPatientId ?? activeTab;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTabAndClearTenant}
        onLogout={handleLogout}
        role={user.role}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 pl-14 md:pl-0">
        <Header
          title={
            selectedTenantId ? 'Tenant Detail' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
          }
          user={user}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        />

        <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth">
          <Suspense fallback={<PageFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="min-h-full"
              >
                <AppContent
                  activeTab={activeTab}
                  selectedTenantId={selectedTenantId}
                  selectedCallId={selectedCallId}
                  selectedPatientId={selectedPatientId}
                  tenants={tenants}
                  sessions={sessions}
                  patients={patients}
                  bookings={bookings}
                  auditLogs={auditLogs}
                  onViewTenant={setSelectedTenantId}
                  onViewCall={setSelectedCallId}
                  onViewPatient={setSelectedPatientId}
                  onBackCall={clearSelectedCall}
                  onBackPatient={clearSelectedPatient}
                  onBackTenant={clearSelectedTenant}
                  onUpdateTenant={handleUpdateTenant}
                  onCreateTenant={() => setShowWizard(true)}
                  onNavigateToTab={setActiveTabAndClearTenant}
                />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>

        {showWizard ? (
          <Suspense fallback={null}>
            <TenantWizard
              onClose={() => setShowWizard(false)}
              onCreated={() => {
                setShowWizard(false);
                refreshData();
              }}
            />
          </Suspense>
        ) : null}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content router (detail views take precedence over tab)
// ---------------------------------------------------------------------------

interface AppContentProps {
  activeTab: string;
  selectedTenantId: string | null;
  selectedCallId: string | null;
  selectedPatientId: string | null;
  tenants: Tenant[];
  sessions: CallSession[];
  patients: Patient[];
  bookings: Booking[];
  auditLogs: AuditLog[];
  onViewTenant: (id: string) => void;
  onViewCall: (id: string) => void;
  onViewPatient: (id: string) => void;
  onBackCall: () => void;
  onBackPatient: () => void;
  onBackTenant: () => void;
  onUpdateTenant: (id: string, patch: Partial<Tenant>) => void;
  onCreateTenant: () => void;
  onNavigateToTab: (tab: string) => void;
}

function AppContent({
  activeTab,
  selectedTenantId,
  selectedCallId,
  selectedPatientId,
  tenants,
  sessions,
  patients,
  bookings,
  auditLogs,
  onViewTenant,
  onViewCall,
  onViewPatient,
  onBackCall,
  onBackPatient,
  onBackTenant,
  onUpdateTenant,
  onCreateTenant,
  onNavigateToTab,
}: AppContentProps) {
  if (selectedCallId) {
    const session = sessions.find((s) => s.id === selectedCallId);
    if (session) {
      const patient = patients.find((p) => p.id === session.patientId);
      return (
        <CallDetail session={session} patient={patient} onBack={onBackCall} />
      );
    }
  }

  if (selectedPatientId) {
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (patient) {
      const patientSessions = sessions.filter((s) => s.patientId === patient.id);
      const patientBookings = bookings.filter((b) => b.patientId === patient.id);
      return (
        <PatientDetail
          patient={patient}
          sessions={patientSessions}
          bookings={patientBookings}
          onBack={onBackPatient}
          onViewCall={onViewCall}
        />
      );
    }
  }

  if (selectedTenantId) {
    const tenant = tenants.find((t) => t.id === selectedTenantId);
    if (tenant) {
      return (
        <TenantDetail
          tenant={tenant}
          onBack={onBackTenant}
          onUpdate={onUpdateTenant}
        />
      );
    }
  }

  switch (activeTab) {
    case 'tenants':
      return (
        <TenantList
          tenants={tenants}
          onViewTenant={onViewTenant}
          onCreateTenant={onCreateTenant}
        />
      );
    case 'sessions':
      return <CallLogs sessions={sessions} onViewCall={onViewCall} />;
    case 'audit':
      return <AuditLogs logs={auditLogs} />;
    case 'dashboard':
      return (
        <TenantDashboard
          sessions={sessions}
          bookings={bookings}
          onViewCall={onViewCall}
          onNavigateToTab={onNavigateToTab}
        />
      );
    case 'calls':
      return <CallLogs sessions={sessions} onViewCall={onViewCall} />;
    case 'patients':
      return <Patients patients={patients} onViewPatient={onViewPatient} />;
    case 'bookings':
      return <Bookings bookings={bookings} patients={patients} />;
    case 'analytics':
      return <Analytics />;
    case 'settings':
      return <SettingsPage />;
    default:
      return null;
  }
}
