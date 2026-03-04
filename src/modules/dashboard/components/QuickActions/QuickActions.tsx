/**
 * Quick actions: links to Calls, Bookings, Alerts with hover scale.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone, Calendar, AlertCircle } from 'lucide-react';

const ACTIONS = [
  { to: '/calls', label: 'View Calls', icon: Phone },
  { to: '/bookings', label: 'Bookings', icon: Calendar },
  { to: '/alerts', label: 'View Alerts', icon: AlertCircle },
] as const;

/** Renders primary dashboard shortcut actions for calls, bookings, and alerts. */
export function QuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {ACTIONS.map(({ to, label, icon: Icon }, i) => (
        <motion.div
          key={to}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
        >
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
        </motion.div>
      ))}
    </div>
  );
}
