/**
 * Date range picker. Presets: Last 7 days, This month, Custom.
 */

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date;
  end: Date;
}

const PRESETS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
] as const;

function getRangeFromPreset(preset: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: today };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: today };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: today };
    }
    default:
      return { start: today, end: today };
  }
}

function formatRange(range: DateRange): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  triggerClassName?: string;
  'aria-label'?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  triggerClassName,
  'aria-label': ariaLabel,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [preset, setPreset] = React.useState<string>('7d');
  const [customStart, setCustomStart] = React.useState(value.start.toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = React.useState(value.end.toISOString().slice(0, 10));

  const handlePresetSelect = (p: string) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = getRangeFromPreset(p);
      onChange(range);
      setOpen(false);
    }
  };

  const handleCustomApply = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (start <= end) {
      onChange({ start, end });
      setOpen(false);
    }
  };

  const displayLabel = preset === 'custom' ? formatRange(value) : PRESETS.find((p) => p.value === preset)?.label ?? formatRange(value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          'flex items-center justify-between gap-2 min-w-[180px] px-4 py-2 rounded-lg',
          'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
          'text-[var(--text-primary)] text-sm font-medium',
          'hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)]',
          'transition-colors',
          triggerClassName,
          className
        )}
        aria-label={ariaLabel}
      >
        <Calendar className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
        <span className="truncate">{displayLabel}</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          className="z-50 min-w-[260px] rounded-[var(--radius-card)] card-glass border border-[var(--border-subtle)] p-4 shadow-lg"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
            Date range
          </div>
          <div className="space-y-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePresetSelect(p.value)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm',
                  'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]',
                  preset === p.value && 'bg-[var(--bg-hover)]'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <div>
                <label htmlFor="daterange-start" className="block text-xs text-[var(--text-muted)] mb-1">Start</label>
                <input
                  id="daterange-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  aria-label="Start date"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
                />
              </div>
              <div>
                <label htmlFor="daterange-end" className="block text-xs text-[var(--text-muted)] mb-1">End</label>
                <input
                  id="daterange-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  aria-label="End date"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCustomApply}
                className="w-full px-4 py-2 rounded-lg bg-[var(--ds-primary)] text-white text-sm font-medium hover:opacity-90"
              >
                Apply
              </button>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
