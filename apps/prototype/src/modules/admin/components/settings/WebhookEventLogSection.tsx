/**
 * Webhook event log. Table of webhook calls with status, timestamp, retry option.
 */

import { useState, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Badge,
  DataTable,
} from '../../../../shared/ui';
import type { WebhookEventStatus } from '../../../../adapters/types/webhook-events';
import { RotateCw } from 'lucide-react';
import { useAdminWebhookEvents } from '../../hooks';
import {
  getWebhookPublicOrigin,
  WEBHOOK_INBOUND_PATHS,
} from '../../../../lib/webhookPublicUrls';

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: WebhookEventStatus }) {
  const badgeStatus = status === 'success' ? 'active' : status === 'failed' ? 'error' : 'pending';
  return <Badge status={badgeStatus}>{status}</Badge>;
}

/** Renders webhook delivery log with retry action for failed events. */
export function WebhookEventLogSection() {
  const { events, retryingId, retryWebhook } = useAdminWebhookEvents();

  const handleRetry = useCallback((id: string) => {
    retryWebhook(id);
  }, [retryWebhook]);

  if (events.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] card-glass p-6">
        <h3 className="font-semibold text-[var(--text-primary)]">Webhook Event Log</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2">No webhook events yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] card-glass overflow-x-auto">
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Webhook Event Log</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isApiMode
            ? 'Successfully processed webhook events (idempotency ledger). Replay is not available — duplicates are ignored by design.'
            : 'Recent webhook calls. Retry failed deliveries.'}
        </p>
        <div className="text-xs text-[var(--text-muted)] mt-3 space-y-1">
          <p>
            Retell: <code>{origin}{WEBHOOK_INBOUND_PATHS.retell}</code>
          </p>
          <p>
            Stripe: <code>{origin}{WEBHOOK_INBOUND_PATHS.stripe}</code>
          </p>
          <p>
            Cal.com: <code>{origin}{WEBHOOK_INBOUND_PATHS.calcom}</code>
          </p>
        </div>
      </div>
      <DataTable minWidth="min-w-[720px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Retry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-[var(--text-secondary)] text-sm whitespace-nowrap">
                  {formatDate(e.attemptedAt)}
                </TableCell>
                <TableCell className="text-sm">{e.eventType}</TableCell>
                <TableCell className="text-sm text-[var(--text-muted)] max-w-[240px] truncate" title={e.endpoint}>
                  {e.endpoint}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <StatusBadge status={e.status} />
                    {e.statusCode != null && (
                      <span className="text-xs text-[var(--text-muted)]">{e.statusCode}</span>
                    )}
                    {e.lastError && (
                      <span className="text-xs text-[var(--error)] truncate max-w-[160px]" title={e.lastError}>
                        {e.lastError}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {e.status === 'failed' && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRetry(e.id)}
                      disabled={retryingId === e.id}
                      className="gap-1.5"
                      aria-label={`Retry webhook ${e.id}`}
                    >
                      <RotateCw size={14} className={retryingId === e.id ? 'animate-spin' : undefined} />
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}
