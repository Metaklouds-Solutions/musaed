/**
 * Main navigation sidebar. Renders different menu items for Admin vs Manager.
 * Collapses to a drawer on small screens; always visible on md+.
 */

import React, { useState, useCallback } from 'react';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Users from 'lucide-react/dist/esm/icons/users';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Activity from 'lucide-react/dist/esm/icons/activity';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  role: string;
}

const ADMIN_ITEMS: { id: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'sessions', label: 'All Sessions', icon: Activity },
  { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  { id: 'settings', label: 'Platform Settings', icon: Settings },
];

const MANAGER_ITEMS: { id: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calls', label: 'Call Logs', icon: Phone },
  { id: 'patients', label: 'CRM Patients', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Clinic Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, role }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = role === 'ADMIN' ? ADMIN_ITEMS : MANAGER_ITEMS;

  const handleNav = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      setMobileOpen(false);
    },
    [setActiveTab]
  );

  const sidebarContent = (
    <>
      <div className="p-4 sm:p-6 flex items-center gap-3 shrink-0 h">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden>
          <Zap className="text-primary-foreground w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">AgentOs</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto" aria-label="Main navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-manipulation text-left ${
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border shrink-0">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-red-400 transition-colors touch-manipulation rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Log out"
        >
          <LogOut size={20} aria-hidden />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu trigger: visible only on small screens */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay when drawer is open on mobile */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar: drawer on mobile, fixed on md+ */}
      <aside
        className={`
          w-64 h-screen bg-card-dark border-r border-border-dark flex flex-col shrink-0
          fixed md:static inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
