/**
 * Command palette. Cmd/Ctrl+K to open. Fuzzy search nav items, tenants, agents, tickets.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../app/session/SessionContext';
import { ADMIN_NAV, TENANT_NAV } from '../../app/layout/Sidebar/navConfig';
import { tenantsAdapter, agentsAdapter, supportAdapter, searchAdapter } from '../../adapters';
import { useAsyncData } from '../../shared/hooks/useAsyncData';
import { cn } from '@/lib/utils';

function isIconComponent(x: unknown): x is React.ComponentType<{ className?: string }> {
  return typeof x === 'function';
}

export interface CommandItem {
  id: string;
  label: string;
  path?: string;
  meta?: string;
  icon?: React.ReactNode;
}

function flattenNav(
  items: typeof ADMIN_NAV | typeof TENANT_NAV,
  t: (key: string) => string
): CommandItem[] {
  const result: CommandItem[] = [];
  for (const item of items) {
    result.push({ id: item.to, label: t(item.label), path: item.to, icon: item.icon });
    for (const child of item.children ?? []) {
      result.push({ id: child.to, label: t(child.label), path: child.to, icon: child.icon });
    }
  }
  return result;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return true;
  let j = 0;
  for (let i = 0; i < t.length && j < q.length; i++) {
    if (t[i] === q[j]) j++;
  }
  return j === q.length;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSession();
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'ADMIN';
  const navItems = React.useMemo(
    () => flattenNav(isAdmin ? ADMIN_NAV : TENANT_NAV, t),
    [isAdmin, t]
  );

  const tenantId = user?.tenantId;
  const { data: tenants } = useAsyncData(
    () => (open ? tenantsAdapter.getAllTenants() : []),
    [open],
    []
  );
  const { data: agents } = useAsyncData(
    () => (open ? agentsAdapter.list() : []),
    [open],
    []
  );
  const { data: tickets } = useAsyncData(
    () => (open ? supportAdapter.listTickets() : []),
    [open],
    []
  );

  const { data: searchResults, loading: searchLoading } = useAsyncData(
    () =>
      open && query.trim()
        ? searchAdapter.search(query, tenantId, isAdmin, ['tenants', 'staff', 'tickets'])
        : Promise.resolve([]),
    [open, query, tenantId, isAdmin],
    [] as { id: string; label: string; meta?: string; path: string }[]
  );

  const tenantsItems: CommandItem[] = React.useMemo(
    () => tenants.slice(0, 5).map((t) => ({ id: `tenant-${t.id}`, label: t.name, meta: 'Tenant', path: `/admin/tenants/${t.id}` })),
    [tenants]
  );

  const agentsItems: CommandItem[] = React.useMemo(
    () => agents.slice(0, 5).map((a) => ({ id: `agent-${a.id}`, label: a.name, meta: a.tenantId ? 'Assigned' : 'Unassigned', path: `/admin/agents/${a.id}` })),
    [agents]
  );

  const ticketsItems: CommandItem[] = React.useMemo(
    () => tickets.slice(0, 5).map((t) => ({ id: `ticket-${t.id}`, label: t.title, meta: t.status, path: isAdmin ? `/admin/support/${t.id}` : `/help/tickets/${t.id}` })),
    [tickets, isAdmin]
  );

  const allItems = React.useMemo(() => {
    const items = [...navItems];
    if (isAdmin) {
      items.push(...tenantsItems, ...agentsItems, ...ticketsItems);
    } else {
      items.push(...ticketsItems);
    }
    return items;
  }, [navItems, isAdmin, tenantsItems, agentsItems, ticketsItems]);

  const searchItems: CommandItem[] = React.useMemo(
    () =>
      searchResults.map((r) => ({
        id: r.id,
        label: r.label,
        meta: r.meta,
        path: r.path,
      })),
    [searchResults]
  );

  const filtered = React.useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12);
    if (searchLoading) {
      return allItems.filter((item) => fuzzyMatch(query, item.label) || fuzzyMatch(query, item.meta ?? '')).slice(0, 12);
    }
    return searchItems.slice(0, 12);
  }, [allItems, query, searchItems, searchLoading]);

  React.useEffect(() => {
    setSelected(0);
  }, [query, filtered]);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      inputRef.current?.focus();
    }
  }, [open]);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const child = el.children[selected];
    if (child instanceof Element) child.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
      return;
    }
    if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      const item = filtered[selected];
      if (item.path) {
        navigate(item.path);
        onClose();
      }
    }
  };

  const handleSelect = (item: CommandItem) => {
    if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-[var(--overlay-bg)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl rounded-[var(--radius-card)] card-glass border border-[var(--border-subtle)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="text-[var(--text-muted)]" aria-hidden>
            ⌘K
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tenants, agents, tickets…"
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none text-sm"
            autoComplete="off"
          />
        </div>
        <div
          ref={listRef}
          className="max-h-[320px] overflow-y-auto py-2"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              No results found
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                  i === selected
                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                {item.icon && isIconComponent(item.icon) && (
                  <span className="text-[var(--text-muted)] shrink-0">
                    {React.createElement(item.icon, { className: 'w-4 h-4' })}
                  </span>
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.meta && (
                  <span className="text-xs text-[var(--text-muted)] truncate">{item.meta}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
