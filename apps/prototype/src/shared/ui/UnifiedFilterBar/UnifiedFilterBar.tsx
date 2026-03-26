import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '../Button';
import { SavedFiltersDropdown } from '../SavedFiltersDropdown';
import { PopoverSelect } from '../PopoverSelect';
import { cn } from '@/lib/utils';
import type { SavedFilter } from '../../../adapters/local/savedFilters.adapter';
import type { UnifiedFilterField, UnifiedFilterTab } from '../../types';

interface UnifiedFilterBarProps {
  tabs?: UnifiedFilterTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  fields?: UnifiedFilterField[];
  onFieldChange?: (fieldId: string, value: string) => void;
  query?: string;
  onQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string) => void;
  onApplyFilter?: (id: string) => void;
  onDeleteFilter?: (id: string) => void;
  onReset?: () => void;
  activeFilterCount?: number;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function UnifiedFilterBar({
  tabs = [],
  activeTab,
  onTabChange,
  fields = [],
  onFieldChange,
  query = '',
  onQueryChange,
  searchPlaceholder = 'Search...',
  savedFilters = [],
  onSaveFilter,
  onApplyFilter,
  onDeleteFilter,
  onReset,
  activeFilterCount = 0,
  rightSlot,
  className,
}: UnifiedFilterBarProps) {
  const hasFilters = fields.length > 0;

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 sm:p-4',
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:gap-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {tabs.length > 0 && onTabChange && (
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => onTabChange(tab.value)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors',
                      activeTab === tab.value
                        ? 'bg-[var(--ds-primary)] text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {hasFilters && onFieldChange && (
              <PopoverPrimitive.Root>
                <PopoverPrimitive.Trigger asChild>
                  <Button variant="secondary" className="min-h-[40px]">
                    <Filter className="h-4 w-4" aria-hidden />
                    Filter
                    {activeFilterCount > 0 ? (
                      <span className="rounded-full bg-[var(--ds-primary)]/15 px-1.5 py-0.5 text-xs text-[var(--ds-primary)]">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    sideOffset={8}
                    align="start"
                    className="z-50 w-[min(92vw,360px)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 shadow-xl"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Filters</p>
                      {onReset ? (
                        <button
                          type="button"
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          onClick={onReset}
                        >
                          Clear all
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <PopoverSelect
                          key={field.id}
                          value={field.value}
                          onChange={(v) => onFieldChange(field.id, v)}
                          options={field.options}
                          title={field.label}
                          aria-label={`Filter by ${field.label.toLowerCase()}`}
                          triggerClassName="w-full min-w-0"
                        />
                      ))}
                    </div>
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {onSaveFilter && onApplyFilter && onDeleteFilter ? (
              <SavedFiltersDropdown
                saved={savedFilters}
                onSave={onSaveFilter}
                onApply={onApplyFilter}
                onDelete={onDeleteFilter}
                className="shrink-0"
              />
            ) : null}
            {rightSlot}
          </div>
        </div>

        {onQueryChange && (
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  'min-h-[44px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] py-2 pl-9 pr-10 text-sm text-[var(--text-primary)]',
                  'placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/30'
                )}
                aria-label="Search"
              />
              {query.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {onReset ? (
              <Button variant="ghost" onClick={onReset} className="min-h-[44px] shrink-0 px-3 text-sm">
                Reset
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
