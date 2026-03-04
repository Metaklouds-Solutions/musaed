/**
 * Tenant dashboard: staff count by role (doctors, receptionists).
 */

import { motion } from 'motion/react';
import { Users, Stethoscope, UserCircle } from 'lucide-react';
import { ViewButton } from '../../../../shared/ui';
import type { TenantStaffCounts } from '../../../../shared/types';

interface StaffQuickViewProps {
  counts: TenantStaffCounts;
}

/** Renders a compact staff-count snapshot grouped by key clinic roles. */
export function StaffQuickView({ counts }: StaffQuickViewProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Staff Quick View</h2>
        <ViewButton to="/staff">View all</ViewButton>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-4 flex items-center gap-3 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ds-primary)]/10 text-[var(--ds-primary)]">
            <Users className="w-5 h-5" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{counts.total}</p>
            <p className="text-xs text-[var(--text-muted)]">Total</p>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-4 flex items-center gap-3 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
            <Stethoscope className="w-5 h-5" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{counts.doctors}</p>
            <p className="text-xs text-[var(--text-muted)]">Doctors</p>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-4 flex items-center gap-3 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--info)]/10 text-[var(--info)]">
            <UserCircle className="w-5 h-5" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{counts.receptionists}</p>
            <p className="text-xs text-[var(--text-muted)]">Receptionists</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
