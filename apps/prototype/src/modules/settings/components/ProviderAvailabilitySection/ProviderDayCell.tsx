/**
 * Single day cell for provider availability. Start/end time inputs.
 */

import { useState, useCallback, useEffect } from 'react';

interface ProviderDayCellProps {
  userId: string;
  day: string;
  value: { start: string; end: string } | null;
  onChange: (v: { start: string; end: string } | null) => void;
}

export function ProviderDayCell({ value, onChange }: ProviderDayCellProps) {
  const [start, setStart] = useState(value?.start ?? '');
  const [end, setEnd] = useState(value?.end ?? '');

  useEffect(() => {
    setStart(value?.start ?? '');
    setEnd(value?.end ?? '');
  }, [value?.start, value?.end]);

  const handleBlur = useCallback(() => {
    if (start && end) {
      onChange({ start, end });
    } else {
      onChange(null);
    }
  }, [start, end, onChange]);

  return (
    <div className="flex flex-col gap-1 min-w-[70px]">
      <input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-2 py-1 text-xs rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
        aria-label="Start time"
      />
      <input
        type="time"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-2 py-1 text-xs rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
        aria-label="End time"
      />
    </div>
  );
}
