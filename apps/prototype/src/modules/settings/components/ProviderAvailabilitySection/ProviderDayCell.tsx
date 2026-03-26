/**
 * Single day cell for provider availability. Start/end time inputs.
 */

import { useState, useCallback, useEffect } from 'react';

interface ProviderDayCellProps {
  value: { start: string; end: string } | null;
  onChange: (v: { start: string; end: string } | null) => void;
  disabled?: boolean;
}

function isValidRange(start: string, end: string): boolean {
  return start.length > 0 && end.length > 0 && start < end;
}

export function ProviderDayCell({
  value,
  onChange,
  disabled = false,
}: ProviderDayCellProps) {
  const [start, setStart] = useState(value?.start ?? '');
  const [end, setEnd] = useState(value?.end ?? '');

  useEffect(() => {
    setStart(value?.start ?? '');
    setEnd(value?.end ?? '');
  }, [value?.start, value?.end]);

  const emit = useCallback((nextStart: string, nextEnd: string) => {
    if (nextStart.length === 0 && nextEnd.length === 0) {
      onChange(null);
      return;
    }
    if (isValidRange(nextStart, nextEnd)) {
      onChange({ start: nextStart, end: nextEnd });
      return;
    }
    onChange({ start: nextStart, end: nextEnd });
  }, [onChange]);

  const handleStartChange = useCallback((nextValue: string) => {
    setStart(nextValue);
    emit(nextValue, end);
  }, [emit, end]);

  const handleEndChange = useCallback((nextValue: string) => {
    setEnd(nextValue);
    emit(start, nextValue);
  }, [emit, start]);

  const handleClear = useCallback(() => {
    setStart('');
    setEnd('');
    onChange(null);
  }, [onChange]);

  const showInvalid =
    (start.length > 0 || end.length > 0) && !isValidRange(start, end);

  const handleBlur = useCallback(() => {
    if (start && end) {
      onChange({ start, end });
    } else {
      if (!start && !end) {
        onChange(null);
      }
    }
  }, [start, end, onChange]);

  return (
    <div className="flex flex-col gap-1 min-w-[84px]">
      <input
        type="time"
        value={start}
        onChange={(e) => handleStartChange(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full px-2 py-1 text-xs rounded border bg-[var(--bg-elevated)] text-[var(--text-primary)] ${
          showInvalid ? 'border-red-500' : 'border-[var(--border-subtle)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Start time"
      />
      <input
        type="time"
        value={end}
        onChange={(e) => handleEndChange(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full px-2 py-1 text-xs rounded border bg-[var(--bg-elevated)] text-[var(--text-primary)] ${
          showInvalid ? 'border-red-500' : 'border-[var(--border-subtle)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="End time"
      />
      {!disabled && (start || end) && (
        <button
          type="button"
          onClick={handleClear}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Clear
        </button>
      )}
    </div>
  );
}
