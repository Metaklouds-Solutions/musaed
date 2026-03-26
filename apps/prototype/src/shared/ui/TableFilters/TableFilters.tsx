/**
 * Horizontal filter bar for tables. Tenant, Role, Status, Search.
 * Responsive: stacks vertically on mobile.
 */

import { Search } from 'lucide-react';
import { PopoverSelect } from '../PopoverSelect';
import { cn } from '@/lib/utils';

export interface TableFilterOption {
  value: string;
  label: string;
}

interface TableFiltersProps {
  /** Tenant filter (admin): list of tenants */
  tenants?: TableFilterOption[];
  selectedTenantId?: string | null;
  onTenantChange?: (id: string | null) => void;
  showTenantFilter?: boolean;
  /** Role filter */
  roles?: TableFilterOption[];
  selectedRole?: string | null;
  onRoleChange?: (role: string | null) => void;
  /** Status filter */
  statuses?: TableFilterOption[];
  selectedStatus?: string | null;
  onStatusChange?: (status: string | null) => void;
  /** Plan filter (e.g. PRO, ENTERPRISE) */
  plans?: TableFilterOption[];
  selectedPlan?: string | null;
  onPlanChange?: (plan: string | null) => void;
  /** Outcome filter (booked, escalated, failed) */
  outcomes?: TableFilterOption[];
  selectedOutcome?: string | null;
  onOutcomeChange?: (outcome: string | null) => void;
  /** Search */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Priority filter (tickets) */
  priorities?: TableFilterOption[];
  selectedPriority?: string | null;
  onPriorityChange?: (priority: string | null) => void;
  className?: string;
  children?: React.ReactNode;
}

export function TableFilters({
  tenants = [],
  selectedTenantId,
  onTenantChange,
  showTenantFilter = false,
  roles = [],
  selectedRole,
  onRoleChange,
  statuses = [],
  selectedStatus,
  onStatusChange,
  plans = [],
  selectedPlan,
  onPlanChange,
  outcomes = [],
  selectedOutcome,
  onOutcomeChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  priorities = [],
  selectedPriority,
  onPriorityChange,
  className,
  children,
}: TableFiltersProps) {
  const tenantOptions = [
    { value: '', label: 'All tenants' },
    ...tenants.map((t) => ({ value: t.value, label: t.label })),
  ];
  const roleOptions = [
    { value: '', label: 'All roles' },
    ...roles.map((r) => ({ value: r.value, label: r.label })),
  ];
  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...statuses.map((s) => ({ value: s.value, label: s.label })),
  ];
  const planOptions = [
    { value: '', label: 'All plans' },
    ...plans.map((p) => ({ value: p.value, label: p.label })),
  ];
  const outcomeOptions = [
    { value: '', label: 'All outcomes' },
    ...outcomes.map((o) => ({ value: o.value, label: o.label })),
  ];
  const priorityOptions = [
    { value: '', label: 'All priorities' },
    ...priorities.map((p) => ({ value: p.value, label: p.label })),
  ];

  const hasFilters =
    (showTenantFilter && tenants.length > 0) ||
    roles.length > 0 ||
    statuses.length > 0 ||
    plans.length > 0 ||
    outcomes.length > 0 ||
    priorities.length > 0 ||
    onSearchChange;

  if (!hasFilters && !children) return null;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3',
        className
      )}
    >
      {showTenantFilter && tenants.length > 0 && onTenantChange && (
        <PopoverSelect
          value={selectedTenantId ?? ''}
          onChange={(v) => onTenantChange(v || null)}
          options={tenantOptions}
          title="Tenant"
          aria-label="Filter by tenant"
          triggerClassName="min-w-[140px] sm:min-w-[160px]"
        />
      )}
      {roles.length > 0 && onRoleChange && (
        <PopoverSelect
          value={selectedRole ?? ''}
          onChange={(v) => onRoleChange(v || null)}
          options={roleOptions}
          title="Role"
          aria-label="Filter by role"
          triggerClassName="min-w-[140px] sm:min-w-[160px]"
        />
      )}
      {statuses.length > 0 && onStatusChange && (
        <PopoverSelect
          value={selectedStatus ?? ''}
          onChange={(v) => onStatusChange(v || null)}
          options={statusOptions}
          title="Status"
          aria-label="Filter by status"
          triggerClassName="min-w-[140px] sm:min-w-[160px]"
        />
      )}
      {plans.length > 0 && onPlanChange && (
        <PopoverSelect
          value={selectedPlan ?? ''}
          onChange={(v) => onPlanChange(v || null)}
          options={planOptions}
          title="Plan"
          aria-label="Filter by plan"
          triggerClassName="min-w-[140px] sm:min-w-[160px]"
        />
      )}
      {outcomes.length > 0 && onOutcomeChange && (
        <PopoverSelect
          value={selectedOutcome ?? ''}
          onChange={(v) => onOutcomeChange(v || null)}
          options={outcomeOptions}
          title="Outcome"
          aria-label="Filter by outcome"
          triggerClassName="min-w-[140px] sm:min-w-[160px]"
        />
      )}
      {priorities.length > 0 && onPriorityChange && (
        <PopoverSelect
          value={selectedPriority ?? ''}
          onChange={(v) => onPriorityChange(v || null)}
          options={priorityOptions}
          title="Priority"
          aria-label="Filter by priority"
          triggerClassName="min-w-[140px] sm:min-w-[160px]"
        />
      )}
      {onSearchChange && (
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" aria-hidden />
          <input
            type="search"
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            name="tenant-list-search"
            placeholder={searchPlaceholder}
            className={cn(
              'w-full pl-9 pr-4 py-2 rounded-lg text-sm',
              'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'hover:border-[var(--border-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]',
              'min-h-[44px] min-w-[44px] touch-manipulation'
            )}
            aria-label="Search"
          />
        </div>
      )}
      {children}
    </div>
  );
}
