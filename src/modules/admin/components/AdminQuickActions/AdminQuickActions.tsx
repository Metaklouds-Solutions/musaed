/**
 * Admin quick actions: View Tenants, System Health, Export Report.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Activity, FileDown } from 'lucide-react';

const ACTIONS = [
  { to: '/admin/tenants', label: 'View Tenants', icon: Users },
  { to: '/admin/system', label: 'System Health', icon: Activity },
  { to: '#', label: 'Export Report', icon: FileDown, isPlaceholder: true },
] as const;

/** Renders admin quick-link actions for common operations and monitoring pages. */
export function AdminQuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {ACTIONS.map(({ to, label, icon: Icon, isPlaceholder }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
        >
          {isPlaceholder ? (
            <button
              type="button"
              disabled
              className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-medium text-sm cursor-not-allowed opacity-60 min-h-[44px] min-w-[44px] justify-center sm:justify-start"
              title="Coming soon"
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
            </button>
          ) : (
            <Link
              to={to}
              className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--ds-primary)]/50 hover:bg-[var(--primary-glow)] text-[var(--text-primary)] font-medium text-sm transition-colors min-h-[44px] min-w-[44px] justify-center sm:justify-start"
            >
              <motion.span
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={18} aria-hidden />
              </motion.span>
              <span>{label}</span>
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  );
}
