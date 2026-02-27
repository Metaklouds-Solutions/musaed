/**
 * Variant-driven sidebar: glass-expanded (full labels) | minimal-compact (icon-only).
 * Open/close only via click on the toggle icon. No hover-to-expand.
 * Same color tokens, nav data, and logic. Admin & Tenant.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '../../session/SessionContext';
import type { Role } from '../../../shared/types';
import { SidebarItem, SidebarGroup } from './components';
import { ADMIN_NAV, TENANT_NAV } from './navConfig';
import { cn } from '@/lib/utils';
import { FiSidebar } from 'react-icons/fi';

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

function getNavItems(role: Role) {
  return role === 'ADMIN' ? ADMIN_NAV : TENANT_NAV;
}

function getStoredVariant(): SidebarVariant {
  if (typeof window === 'undefined') return 'glass-expanded';
  const stored = localStorage.getItem(SIDEBAR_VARIANT_KEY) as SidebarVariant | null;
  return stored === 'minimal-compact' ? 'minimal-compact' : 'glass-expanded';
}

export function Sidebar() {
  const { user } = useSession();
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
      {/* Logo area: when open — logo always visible, toggle on left at top on hover; when closed — hover hides logo and shows only expand icon */}
      <div
        className={cn(
          'group/logo shrink-0 border-b border-(var(--separator)) flex items-center relative',
          !isExpanded ? 'justify-center p-3' : 'gap-3 p-5'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 min-w-0 flex-1 opacity-100 transition-opacity duration-150 pointer-events-none',
            !isExpanded && 'group-hover/logo:opacity-0'
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
        {/* Sidebar toggle: desktop only (hidden on mobile) */}
        <div className="hidden md:block">
          {isExpanded ? (
            <button
              type="button"
              onClick={toggleVariant}
              className="absolute right-3 top-3 p-1.5 rounded-xl bg-(var(--bg-elevated)) border border-(var(--border-subtle)) text-(var(--text-muted)) hover:bg-(var(--sidebar-item-hover)) hover:text-(var(--text-primary)) transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-(--ds-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-sidebar) cursor-pointer"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <FiSidebar size={18} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleVariant}
              className="opacity-0 group-hover/logo:opacity-100 pointer-events-none group-hover/logo:pointer-events-auto p-1.5 rounded-xl bg-(var(--bg-elevated)) border border-(var(--border-subtle)) text-(var(--text-muted)) hover:bg-(var(--sidebar-item-hover)) hover:text-(var(--text-primary)) transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-(--ds-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-sidebar) focus-visible:opacity-100 shrink-0 cursor-pointer"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <FiSidebar size={18} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <nav
        className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto min-h-0"
        aria-label="Main navigation"
      >
        {items.map((item) =>
          item.children?.length ? (
            <SidebarGroup
              key={item.to}
              item={item}
              variant={variant}
              onChildClick={closeMobile}
            />
          ) : (
            <SidebarItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              variant={variant}
              onClick={closeMobile}
            />
          )
        )}
      </nav>

    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-(var(--radius-nav)) bg-(var(--bg-card)) border border-(var(--border-subtle)) text-(var(--text-primary)) transition-colors focus-visible:ring-2 focus-visible:ring-(--ds-primary) focus-visible:ring-offset-2"
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
          'flex flex-col shrink-0 fixed md:static z-40',
          'top-3 left-3 bottom-3 md:top-auto md:left-auto md:bottom-auto md:inset-auto',
          'h-[calc(100vh-24px)] md:h-full',
          'bg-(var(--bg-sidebar)) md:backdrop-blur-md border-r border-(var(--separator))',
          'overflow-hidden rounded-2xl'
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
