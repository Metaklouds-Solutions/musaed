/**
 * Main navigation. Renders tenant or admin menu by role. All nav is URL-driven (NavLink via SidebarItem).
 */

import { useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  LogOut,
  Zap,
  Phone,
  Calendar,
  Menu,
  X,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { useSession } from '../../session/SessionContext';
import type { Role } from '../../../shared/types';
import { SidebarItem } from './components/SidebarItem';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin/overview', label: 'Platform Overview', icon: LayoutDashboard },
  { to: '/admin/tenants', label: 'Tenants', icon: Users },
  { to: '/admin/system', label: 'System Health', icon: Activity },
];

const TENANT_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calls', label: 'Calls', icon: Phone },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/bookings', label: 'Bookings', icon: Calendar },
  { to: '/alerts', label: 'Alerts', icon: AlertCircle },
  { to: '/billing', label: 'Billing', icon: CreditCard },
];

function getNavItems(role: Role): NavItem[] {
  return role === 'ADMIN' ? ADMIN_ITEMS : TENANT_ITEMS;
}

export function Sidebar() {
  const { user, logout } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const role = user?.role ?? 'STAFF';
  const items = getNavItems(role);

  const sidebarContent = (
    <>
      <div className="p-5 flex items-center gap-3 shrink-0 border-b border-[var(--separator)]">
        <div className="w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white" aria-hidden>
          <Zap className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">
          AgentOs
        </span>
      </div>

      <nav
        className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto"
        aria-label="Main navigation"
      >
        {items.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            onClick={closeMobile}
          />
        ))}
      </nav>

      <div className="p-4 shrink-0 border-t border-[var(--separator)]">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-nav)] transition-colors touch-manipulation text-[var(--text-muted)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--error)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          aria-label="Log out"
        >
          <LogOut size={20} aria-hidden className="shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-[var(--radius-nav)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`md:hidden fixed inset-0 z-30 transition-opacity bg-[var(--overlay-bg)] ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden
        onClick={closeMobile}
      />

      <aside
        className={`
          w-[var(--sidebar-width)] h-screen flex flex-col shrink-0
          fixed md:static inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-out
          bg-[var(--bg-sidebar)] border-r border-[var(--separator)]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
