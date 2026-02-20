/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { User, Tenant, CallSession, AuditLog, Patient, Booking } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { TenantList } from './pages/TenantList';
import { TenantDetail } from './pages/TenantDetail';
import { TenantWizard } from './pages/TenantWizard';
import { CallLogs } from './pages/CallLogs';
import { CallDetail } from './pages/CallDetail';
import { TenantDashboard } from './pages/TenantDashboard';
import { Patients } from './pages/Patients';
import { PatientDetail } from './pages/PatientDetail';
import { Bookings } from './pages/Bookings';
import { Analytics } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('tenants');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load data
  useEffect(() => {
    const state = storage.getState();
    if (state.me) {
      setUser(state.me);
      if (state.me.role === 'MANAGER') {
        setActiveTab('dashboard');
      }
    }
    refreshData();
  }, []);

  const refreshData = () => {
    setTenants(storage.getTenants());
    setSessions(storage.getSessions());
    setAuditLogs(storage.getAuditLogs());
    setPatients(storage.getPatients());
    setBookings(storage.getBookings());
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'MANAGER') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('tenants');
    }
    refreshData();
  };

  const handleLogout = () => {
    storage.logout();
    setUser(null);
    setSelectedTenantId(null);
    setSelectedCallId(null);
    setSelectedPatientId(null);
    setActiveTab('tenants');
  };

  const handleUpdateTenant = (id: string, patch: Partial<Tenant>) => {
    storage.updateTenant(id, patch);
    refreshData();
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Detail Views
    if (selectedCallId) {
      const session = sessions.find(s => s.id === selectedCallId);
      if (session) {
        const patient = patients.find(p => p.id === session.patientId);
        return <CallDetail session={session} patient={patient} onBack={() => setSelectedCallId(null)} />;
      }
    }

    if (selectedPatientId) {
      const patient = patients.find(p => p.id === selectedPatientId);
      if (patient) {
        const patientSessions = sessions.filter(s => s.patientId === patient.id);
        const patientBookings = bookings.filter(b => b.patientId === patient.id);
        return (
          <PatientDetail 
            patient={patient} 
            sessions={patientSessions} 
            bookings={patientBookings} 
            onBack={() => setSelectedPatientId(null)}
            onViewCall={(id) => setSelectedCallId(id)}
          />
        );
      }
    }

    if (selectedTenantId) {
      const tenant = tenants.find(t => t.id === selectedTenantId);
      if (tenant) {
        return (
          <TenantDetail 
            tenant={tenant} 
            onBack={() => setSelectedTenantId(null)} 
            onUpdate={handleUpdateTenant}
          />
        );
      }
    }

    // Main Tabs
    switch (activeTab) {
      // Admin Tabs
      case 'tenants':
        return (
          <TenantList 
            tenants={tenants} 
            onViewTenant={(id) => setSelectedTenantId(id)}
            onCreateTenant={() => setShowWizard(true)}
          />
        );
      case 'sessions':
        return <CallLogs sessions={sessions} onViewCall={(id) => setSelectedCallId(id)} />;
      case 'audit':
        return <AuditLogs logs={auditLogs} />;

      // Manager Tabs (Tenant Portal)
      case 'dashboard':
        return <TenantDashboard sessions={sessions} bookings={bookings} onViewCall={(id) => setSelectedCallId(id)} />;
      case 'calls':
        return <CallLogs sessions={sessions} onViewCall={(id) => setSelectedCallId(id)} />;
      case 'patients':
        return <Patients patients={patients} onViewPatient={(id) => setSelectedPatientId(id)} />;
      case 'bookings':
        return <Bookings bookings={bookings} patients={patients} />;
      case 'analytics':
        return <Analytics />;
      
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-bg-dark overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedTenantId(null);
        }} 
        onLogout={handleLogout}
        role={user.role} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          title={selectedTenantId ? 'Tenant Detail' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
          user={user} 
        />
        
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTenantId || activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {showWizard && (
          <TenantWizard 
            onClose={() => setShowWizard(false)} 
            onCreated={() => {
              setShowWizard(false);
              refreshData();
            }}
          />
        )}
      </main>
    </div>
  );
}
