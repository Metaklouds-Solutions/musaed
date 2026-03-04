/**
 * Popover-based select/dropdown. Smooth expand animation, Quick Actions style.
 * Replaces native <select> for consistent UI across tenant and admin.
 */

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PopoverSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PopoverSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PopoverSelectOption[];
  placeholder?: string;
  title?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  'aria-label'?: string;
}

export function PopoverSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  title,
  className,
  triggerClassName,
  contentClassName,
  'aria-label': ariaLabel,
}: PopoverSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          'flex items-center justify-between gap-2 min-w-[140px] px-4 py-2 rounded-lg',
          'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
          'text-[var(--text-primary)] text-sm font-medium',
          'hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)]',
          'transition-colors',
          triggerClassName
        )}
        aria-label={ariaLabel}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={cn('w-4 h-4 shrink-0 opacity-70 transition-transform', open && 'rotate-180')} aria-hidden />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          className={cn(
            'z-50 min-w-[180px] max-h-[280px] overflow-y-auto',
            'rounded-[var(--radius-card)] card-glass border border-[var(--border-subtle)]',
            'p-2 shadow-lg',
            'transition-all duration-200 ease-out',
            contentClassName
          )}
        >
          {title && (
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-2">
              {title}
            </div>
          )}
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value || '__empty__'}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm',
                    'transition-colors',
                    isSelected
                      ? 'bg-[var(--ds-primary)]/10 text-[var(--ds-primary)] font-medium'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
