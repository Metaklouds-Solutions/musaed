/**
 * Alert severity indicator. Visual only; no business logic.
 */

import { AlertTriangle } from 'lucide-react';

type Severity = 'low' | 'medium' | 'high' | 'critical';

const config: Record<Severity, { bg: string; text: string; label: string }> = {
  low: { bg: 'rgba(113, 113, 122, 0.12)', text: 'var(--text-muted)', label: 'Low' },
  medium: { bg: 'rgba(234, 179, 8, 0.12)', text: 'var(--warning)', label: 'Medium' },
  high: { bg: 'rgba(249, 115, 22, 0.12)', text: '#F97316', label: 'High' },
  critical: { bg: 'rgba(239, 68, 68, 0.12)', text: 'var(--error)', label: 'Critical' },
};

interface SeverityIndicatorProps {
  severity: Severity;
  className?: string;
}

export function SeverityIndicator({ severity, className }: SeverityIndicatorProps) {
  const { bg, text, label } = config[severity] ?? config.low;
  return (
    <span
      className={className}
      style={{
        background: bg,
        color: text,
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm, 6px)',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
      aria-label={`Severity: ${label}`}
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
