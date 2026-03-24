/**
 * Reusable date range picker with presets, range calendar, and optional apply mode.
 */

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar, ChevronLeft, ChevronRight, Clock3, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date;
  end: Date;
}

export type DatePresetKey = 'today' | '7d' | '30d' | '4w' | '3m' | 'wtd' | 'mtd' | 'ytd' | 'all' | 'month' | 'custom';

interface DatePresetConfig {
  value: DatePresetKey;
  label: string;
}

const PRESET_LABELS: Record<DatePresetKey, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '4w': 'Last 4 weeks',
  '3m': 'Last 3 months',
  wtd: 'Week to date',
  mtd: 'Month to date',
  ytd: 'Year to date',
  all: 'All time',
  month: 'This month',
  custom: 'Custom range',
};

const SHORT_PRESETS: DatePresetConfig[] = [
  { value: '7d', label: PRESET_LABELS['7d'] },
  { value: '30d', label: PRESET_LABELS['30d'] },
  { value: 'month', label: PRESET_LABELS.month },
  { value: 'custom', label: PRESET_LABELS.custom },
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function clampRange(range: DateRange): DateRange {
  const start = startOfDay(range.start);
  const end = endOfDay(range.end);
  if (start.getTime() <= end.getTime()) return { start, end };
  return { start: endOfDay(range.end), end: startOfDay(range.start) };
}

function getPresetRange(preset: DatePresetKey, allTimeStart: Date): DateRange {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (preset) {
    case 'today':
      return { start: todayStart, end: todayEnd };
    case '7d': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 6);
      return { start, end: todayEnd };
    }
    case '30d': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 29);
      return { start, end: todayEnd };
    }
    case '4w': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 27);
      return { start, end: todayEnd };
    }
    case '3m': {
      const start = new Date(todayStart);
      start.setMonth(start.getMonth() - 3);
      start.setDate(start.getDate() + 1);
      return { start: startOfDay(start), end: todayEnd };
    }
    case 'wtd': {
      const start = new Date(todayStart);
      const day = start.getDay();
      const shift = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - shift);
      return { start, end: todayEnd };
    }
    case 'mtd':
    case 'month':
      return { start: new Date(todayStart.getFullYear(), todayStart.getMonth(), 1), end: todayEnd };
    case 'ytd':
      return { start: new Date(todayStart.getFullYear(), 0, 1), end: todayEnd };
    case 'all':
      return { start: startOfDay(allTimeStart), end: todayEnd };
    default:
      return { start: todayStart, end: todayEnd };
  }
}

function formatRange(range: DateRange): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(range.start)} - ${fmt(range.end)}`;
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getTimezoneLabel(): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const hours = Math.floor(abs / 60).toString().padStart(2, '0');
  const minutes = (abs % 60).toString().padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  triggerClassName?: string;
  mode?: 'instant' | 'apply';
  presets?: DatePresetKey[];
  allTimeStart?: Date;
  showFilterPill?: boolean;
  'aria-label'?: string;
}

interface CalendarDayCell {
  date: Date;
  isCurrentMonth: boolean;
}

function buildMonthGrid(month: Date): CalendarDayCell[] {
  const first = startOfMonth(month);
  const startDay = first.getDay();
  const mondayBasedStart = startDay === 0 ? 6 : startDay - 1;

  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayBasedStart);

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({ date, isCurrentMonth: date.getMonth() === month.getMonth() });
  }
  return cells;
}

function normalizeRange(range: DateRange): DateRange {
  const normalized = clampRange(range);
  if (normalized.start.getTime() <= normalized.end.getTime()) return normalized;
  return { start: normalized.end, end: normalized.start };
}

function rangesEqual(a: DateRange, b: DateRange): boolean {
  return a.start.getTime() === b.start.getTime() && a.end.getTime() === b.end.getTime();
}

function resolvePresets(keys?: DatePresetKey[]): DatePresetConfig[] {
  if (!keys || keys.length === 0) return SHORT_PRESETS;
  return keys.map((key) => ({ value: key, label: PRESET_LABELS[key] }));
}

export function DateRangePicker({
  value,
  onChange,
  className,
  triggerClassName,
  mode = 'instant',
  presets,
  allTimeStart = new Date(new Date().getFullYear() - 2, 0, 1),
  showFilterPill = false,
  'aria-label': ariaLabel,
}: DateRangePickerProps) {
  const presetOptions = React.useMemo(() => resolvePresets(presets), [presets]);
  const [open, setOpen] = React.useState(false);
  const [draftRange, setDraftRange] = React.useState<DateRange>(() => normalizeRange(value));
  const [activePreset, setActivePreset] = React.useState<DatePresetKey>('custom');
  const [leftMonth, setLeftMonth] = React.useState<Date>(() => startOfMonth(value.start));
  const [anchorDate, setAnchorDate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (!open) {
      setDraftRange(normalizeRange(value));
      setLeftMonth(startOfMonth(value.start));
      setAnchorDate(null);
    }
  }, [open, value]);

  const normalizedValue = normalizeRange(value);
  const hasDraftChanges = !rangesEqual(normalizedValue, normalizeRange(draftRange));

  const handlePresetSelect = (preset: DatePresetKey) => {
    setActivePreset(preset);
    if (preset === 'custom') return;

    const range = normalizeRange(getPresetRange(preset, allTimeStart));
    if (mode === 'instant') {
      onChange(range);
      setOpen(false);
      return;
    }

    setDraftRange(range);
    setLeftMonth(startOfMonth(range.start));
  };

  const applyDraft = () => {
    onChange(normalizeRange(draftRange));
    setOpen(false);
  };

  const cancelDraft = () => {
    setDraftRange(normalizeRange(value));
    setLeftMonth(startOfMonth(value.start));
    setAnchorDate(null);
    setOpen(false);
  };

  const handleDayClick = (day: Date) => {
    setActivePreset('custom');

    if (!anchorDate) {
      setAnchorDate(day);
      const start = startOfDay(day);
      setDraftRange({ start, end: endOfDay(day) });
      return;
    }

    const start = anchorDate.getTime() <= day.getTime() ? anchorDate : day;
    const end = anchorDate.getTime() <= day.getTime() ? day : anchorDate;
    setDraftRange({ start: startOfDay(start), end: endOfDay(end) });
    setAnchorDate(null);

    if (mode === 'instant') {
      onChange({ start: startOfDay(start), end: endOfDay(end) });
      setOpen(false);
    }
  };

  const rightMonth = addMonths(leftMonth, 1);
  const label = formatRange(normalizedValue);
  const tz = getTimezoneLabel();

  const renderCalendar = (month: Date) => {
    const cells = buildMonthGrid(month);

    return (
      <div className="min-w-[230px] md:min-w-[244px]">
        <div className="mb-3 text-center text-sm font-semibold text-[var(--text-primary)]">{formatMonth(month)}</div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--text-muted)] mb-2">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <span key={`${month.toISOString()}-${d}`} className="py-1">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ date, isCurrentMonth }) => {
            const isStart = sameDay(date, draftRange.start);
            const isEnd = sameDay(date, draftRange.end);
            const inRange = date.getTime() >= startOfDay(draftRange.start).getTime() && date.getTime() <= endOfDay(draftRange.end).getTime();

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleDayClick(date)}
                className={cn(
                  'h-9 rounded-md text-sm transition-colors',
                  !isCurrentMonth && 'text-[var(--text-disabled)]',
                  isCurrentMonth && 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                  inRange && 'bg-[var(--bg-hover)]',
                  (isStart || isEnd) && 'bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-primary)]'
                )}
                aria-label={date.toDateString()}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <div className={cn('flex items-center gap-2', className)}>
        <PopoverPrimitive.Trigger
          className={cn(
            'flex items-center justify-between gap-2 min-w-[225px] px-3 py-2 rounded-lg',
            'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
            'text-[var(--text-primary)] text-sm font-medium',
            'hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)] transition-colors',
            triggerClassName
          )}
          aria-label={ariaLabel}
        >
          <Calendar className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{label}</span>
        </PopoverPrimitive.Trigger>
        {showFilterPill && (
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <Filter className="h-3.5 w-3.5" aria-hidden /> Filter
          </span>
        )}
      </div>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="end"
          className="z-50 w-[min(95vw,760px)] max-h-[85vh] overflow-auto rounded-[var(--radius-card)] card-glass border border-[var(--border-subtle)] p-0 shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-[156px_1fr]">
            <div className="border-b md:border-b-0 md:border-r border-[var(--border-subtle)] p-2.5 md:p-3 space-y-1">
              {presetOptions.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={cn(
                    'w-full text-left rounded-md px-3 py-2 text-sm transition-colors',
                    activePreset === preset.value
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div>
              <div className="p-2.5 md:p-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setLeftMonth((m) => addMonths(m, -1))}
                    className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftMonth((m) => addMonths(m, 1))}
                    className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] md:hidden"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftMonth((m) => addMonths(m, 1))}
                    className="hidden md:inline-flex rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  {renderCalendar(leftMonth)}
                  <div className="hidden md:block w-px bg-[var(--border-subtle)]" />
                  <div className="hidden md:block">{renderCalendar(rightMonth)}</div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-[var(--text-secondary)]"><Clock3 className="h-4 w-4" /> 12:00:00 am</span>
                    <span className="text-xs text-[var(--text-muted)]">{tz}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-[var(--text-secondary)]"><Clock3 className="h-4 w-4" /> 11:59:59 pm</span>
                    <span className="text-xs text-[var(--text-muted)]">{tz}</span>
                  </div>
                </div>
              </div>

              <div className="px-3 md:px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-[var(--text-secondary)]">Range: {formatRange(draftRange)}</p>
                {mode === 'apply' ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelDraft}
                      className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyDraft}
                      disabled={!hasDraftChanges}
                      className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
