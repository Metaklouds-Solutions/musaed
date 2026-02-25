/**
 * Variant-driven sidebar: glass-expanded (full labels) | minimal-compact (icon-only).
 * Open/close only via click on the toggle icon. No hover-to-expand.
 * Same color tokens, nav data, and logic. Admin & Tenant.
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '../../session/SessionContext';
import type { Role } from '../../../shared/types';
import { SidebarItem } from './components/SidebarItem';
import { cn } from '@/lib/utils';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

type SidebarVariant = 'glass-expanded' | 'minimal-compact';

const SIDEBAR_VARIANT_KEY = 'clinic-crm-sidebar-variant';
const WIDTH_EXPANDED = 240;
const WIDTH_COMPACT = 72;

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

function getStoredVariant(): SidebarVariant {
  if (typeof window === 'undefined') return 'glass-expanded';
  const stored = localStorage.getItem(SIDEBAR_VARIANT_KEY) as SidebarVariant | null;
  return stored === 'minimal-compact' ? 'minimal-compact' : 'glass-expanded';
}

export function Sidebar() {
  const { user, logout } = useSession();
  const isDesktop = useIsDesktop();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [variant, setVariant] = useState<SidebarVariant>(getStoredVariant);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_VARIANT_KEY, variant);
  }, [variant]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleVariant = useCallback(() => {
    setVariant((v) => (v === 'glass-expanded' ? 'minimal-compact' : 'glass-expanded'));
  }, []);

  const role = user?.role ?? 'STAFF';
  const items = getNavItems(role);
  const isCompact = variant === 'minimal-compact';
  const isExpanded = !isCompact;

  const sidebarContent = (
    <>
      <div
        className={cn(
          'shrink-0 border-b border-(var(--separator)) flex items-center',
          !isExpanded ? 'justify-center p-3' : 'gap-3 p-5'
        )}
      >
        <div
          className="w-8 h-8 rounded-(var(--radius-button)) flex items-center justify-center bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white shrink-0"
          aria-hidden
        >
          <Zap className="w-5 h-5" />
        </div>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-xl tracking-tight text-(--text-primary) overflow-hidden whitespace-nowrap"
            >
              AgentOs
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav
        className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto min-h-0"
        aria-label="Main navigation"
      >
        {items.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            variant={variant}
            onClick={closeMobile}
          />
        ))}
      </nav>

      <div
        className={cn(
          'shrink-0 border-t border-(var(--separator)) flex flex-col gap-1',
          !isExpanded ? 'items-center p-2' : 'p-4'
        )}
      >
        <button
          type="button"
          onClick={toggleVariant}
          className={cn(
            'flex items-center rounded-(var(--radius-nav)) transition-colors touch-manipulation text-(var(--text-muted)) hover:bg-(var(--sidebar-item-hover)) hover:text-(var(--text-primary)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
            !isExpanded ? 'justify-center p-2.5 min-w-[44px]' : 'gap-3 w-full px-4 py-2.5'
          )}
          aria-label={!isExpanded ? 'Expand sidebar' : 'Collapse sidebar'}
          title={!isExpanded ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!isExpanded ? (
            <ChevronRight size={20} aria-hidden className="shrink-0" />
          ) : (
            <>
              <ChevronLeft size={20} aria-hidden className="shrink-0" />
              <span className="font-medium text-sm">Collapse</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={logout}
          className={cn(
            'flex items-center transition-colors touch-manipulation text-(var(--text-muted)) hover:bg-(var(--sidebar-item-hover)) hover:text-(var(--error)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] rounded-(var(--radius-nav))',
            !isExpanded ? 'justify-center p-2.5 min-w-[44px]' : 'gap-3 w-full px-4 py-3'
          )}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={20} aria-hidden className="shrink-0" />
          {isExpanded && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-(var(--radius-nav)) bg-(var(--bg-card)) border border-(var(--border-subtle)) text-(var(--text-primary)) transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        {...(mobileOpen ? { 'aria-expanded': 'true' as const } : { 'aria-expanded': 'false' as const })}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={cn(
          'md:hidden fixed inset-0 z-30 transition-opacity bg-(var(--overlay-bg))',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden
        onClick={closeMobile}
      />

      <motion.aside
        className={cn(
          'h-screen flex flex-col shrink-0 fixed md:static inset-y-0 left-0 z-40',
          'backdrop-blur-md bg-(var(--bg-sidebar)) border-r border-(var(--separator))',
          'overflow-hidden rounded-r-0 md:rounded-r-(var(--radius-card))'
        )}
        initial={false}
        animate={{
          width: isDesktop
            ? isExpanded
              ? WIDTH_EXPANDED
              : WIDTH_COMPACT
            : WIDTH_EXPANDED,
          x: isDesktop ? 0 : mobileOpen ? 0 : '-100%',
        }}
        transition={{
          width: { type: 'spring', stiffness: 300, damping: 30 },
          x: { type: 'spring', stiffness: 400, damping: 35 },
        }}
      >
        <div className="h-full flex flex-col min-w-0 w-full">{sidebarContent}</div>
      </motion.aside>
    </>
  );
}
