/**
 * Admin audit log: list of platform actions (tenant created/updated, etc.).
 * Uses Intl for date/time. Responsive padding and empty state.
 */

import React from 'react';
import type { AuditLog as AuditLogType } from '../types';
import Terminal from 'lucide-react/dist/esm/icons/terminal';
import User from 'lucide-react/dist/esm/icons/user';
import { motion } from 'motion/react';

interface AuditLogsProps {
  logs: AuditLogType[];
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'short',
  timeStyle: 'short',
});

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Audit Logs</h2>
          <p className="text-zinc-500 text-sm sm:text-base">Track all administrative actions across the platform</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          Export CSV
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="divide-y divide-border-dark">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No audit entries yet.</div>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.2) }}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-border-dark flex items-center justify-center shrink-0" aria-hidden>
                    <Terminal size={18} className="text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-500 font-mono truncate">{log.target}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <User size={12} aria-hidden /> {log.actor}
                      </span>
                      <span className="text-xs text-zinc-600">|</span>
                      <span className="text-xs text-zinc-400">Tenant: {log.tenantId}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 sm:text-right tabular-nums">{dateTimeFormatter.format(new Date(log.ts))}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
