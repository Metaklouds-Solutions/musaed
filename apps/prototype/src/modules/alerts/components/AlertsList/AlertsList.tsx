/**
 * Alerts list with severity and resolve action. Presentational; data from props.
 */

import { Button } from '../../../../shared/ui';
import { SeverityIndicator } from '../SeverityIndicator';
import type { Alert } from '../../../../shared/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isCreditLow(alert: Alert): boolean {
  return /credit|balance|top.?up/i.test(alert.title) || /credit/i.test(alert.message);
}

function isBookingDrop(alert: Alert): boolean {
  return /booking|conversion/i.test(alert.title) || /booking|conversion/i.test(alert.message);
}

interface AlertsListProps {
  alerts: Alert[];
  onResolve: (alertId: string) => void;
}

export function AlertsList({ alerts, onResolve }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-6">
        No alerts. New simulated alerts may appear every 20 seconds.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 flex flex-wrap items-start gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <SeverityIndicator severity={alert.severity} />
              {(isCreditLow(alert) || isBookingDrop(alert)) && (
                <span className="text-xs text-[var(--text-muted)]">
                  {isCreditLow(alert) ? 'Credit low' : 'Booking drop'}
                </span>
              )}
              {alert.resolved && (
                <span className="text-xs font-medium text-[var(--text-muted)]">Resolved</span>
              )}
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">{alert.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{alert.message}</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">{formatDate(alert.createdAt)}</p>
          </div>
          {!alert.resolved && (
            <Button
              variant="secondary"
              onClick={() => onResolve(alert.id)}
              aria-label={`Resolve ${alert.title}`}
            >
              Resolve
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
