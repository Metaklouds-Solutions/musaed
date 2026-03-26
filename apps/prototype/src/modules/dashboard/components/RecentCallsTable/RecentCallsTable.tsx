/**
 * Tenant dashboard: recent calls as compact card rows (last 6).
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Phone, Clock, ArrowRight } from 'lucide-react';
import { ViewButton, PillTag } from '../../../../shared/ui';
import type { TenantRecentCall } from '../../../../shared/types';

interface RecentCallsTableProps {
  calls: TenantRecentCall[];
}

const MAX_VISIBLE = 6;

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getOutcomePillVariant(outcome: TenantRecentCall['outcome']) {
  if (outcome === 'booked') return 'outcomeBooked' as const;
  if (outcome === 'escalated') return 'outcomeEscalated' as const;
  if (outcome === 'info_only' || outcome === 'unknown') return 'default' as const;
  return 'outcomeFailed' as const;
}

/** Renders a single call as a compact horizontal card row. */
function CallRow({ call, index }: { call: TenantRecentCall; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <Link
        to={`/calls/${call.id}`}
        className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-[var(--ds-primary)]/[0.04] transition-colors hover:bg-[var(--ds-primary)]/[0.10]"
      >
        <div className="w-9 h-9 rounded-lg bg-[var(--ds-primary)]/10 flex items-center justify-center shrink-0">
          <Phone size={16} className="text-[var(--ds-primary)]" aria-hidden />
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <PillTag variant={getOutcomePillVariant(call.outcome)}>
            {call.outcome}
          </PillTag>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)] shrink-0">
          <Clock size={12} aria-hidden />
          <span className="tabular-nums">{formatDuration(call.duration)}</span>
        </div>

        <span className="text-xs text-[var(--text-muted)] shrink-0 tabular-nums hidden md:block">
          {formatDateTime(call.createdAt)}
        </span>

        <ArrowRight
          size={14}
          className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-hidden
        />
      </Link>
    </motion.div>
  );
}

/** Renders the latest tenant calls as compact clickable rows. */
export function RecentCallsTable({ calls }: RecentCallsTableProps) {
  if (calls.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[var(--radius-card)] card-glass p-6"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Calls</h2>
        <p className="text-sm text-[var(--text-muted)]">
          No calls were found for the selected range. If you expect activity here, expand the date
          range or verify call ingestion.
        </p>
      </motion.section>
    );
  }

  const visible = calls.slice(0, MAX_VISIBLE);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-[var(--radius-card)] card-accent"
    >
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Calls</h2>
        <ViewButton to="/calls">View all</ViewButton>
      </div>

      <div className="divide-y divide-[var(--border-subtle)] px-1 pb-2">
        {visible.map((call, i) => (
          <CallRow key={call.id} call={call} index={i} />
        ))}
      </div>
    </motion.section>
  );
}
