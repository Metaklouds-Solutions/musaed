/**
 * Tenant dashboard: staff count by role (doctors, receptionists).
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Users, Stethoscope, UserCircle } from 'lucide-react';
import type { TenantStaffCounts } from '../../../../shared/types';

interface StaffQuickViewProps {
  counts: TenantStaffCounts;
}

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
        <Link to="/staff" className="text-sm font-medium text-[var(--ds-primary)] hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-[var(--bg-elevated)] p-4 flex items-center gap-3">
          <Users className="w-10 h-10 text-[var(--text-muted)]" aria-hidden />
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{counts.total}</p>
            <p className="text-xs text-[var(--text-muted)]">Total</p>
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-elevated)] p-4 flex items-center gap-3">
          <Stethoscope className="w-10 h-10 text-[var(--text-muted)]" aria-hidden />
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{counts.doctors}</p>
            <p className="text-xs text-[var(--text-muted)]">Doctors</p>
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-elevated)] p-4 flex items-center gap-3">
          <UserCircle className="w-10 h-10 text-[var(--text-muted)]" aria-hidden />
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{counts.receptionists}</p>
            <p className="text-xs text-[var(--text-muted)]">Receptionists</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
