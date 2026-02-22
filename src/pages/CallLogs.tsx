/**
 * Call logs table for Admin and Tenant views. Lists sessions with timestamp,
 * caller, intent, outcome, duration, AI flags. Client-side search and outcome filter.
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { CallSession } from '../types';
import Search from 'lucide-react/dist/esm/icons/search';
import Phone from 'lucide-react/dist/esm/icons/phone';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { motion } from 'motion/react';

type OutcomeFilter = 'ALL' | CallSession['outcome'];

interface CallLogsProps {
  sessions: CallSession[];
  onViewCall: (id: string) => void;
}

/** Format session start for table (locale-aware). */
function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Format duration as "Xm Ys". */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export const CallLogs: React.FC<CallLogsProps> = ({ sessions, onViewCall }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('ALL');

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const byOutcome =
      outcomeFilter === 'ALL'
        ? sessions
        : sessions.filter((s) => s.outcome === outcomeFilter);
    if (!q) return byOutcome;
    return byOutcome.filter(
      (s) =>
        s.callerPhone.toLowerCase().includes(q) ||
        s.intent.toLowerCase().includes(q) ||
        s.outcome.toLowerCase().includes(q)
    );
  }, [sessions, searchQuery, outcomeFilter]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Call Logs</h2>
          <p className="text-zinc-500 text-sm sm:text-base">Find any call fast.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} aria-hidden />
            <input
              type="search"
              placeholder="Search phone or intent…"
              aria-label="Search calls"
              value={searchQuery}
              onChange={handleSearchChange}
              className="input-field pl-10 text-sm w-full sm:w-64"
            />
          </div>
          <label className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 shrink-0">Outcome</span>
            <select
              className="input-field text-sm w-full sm:w-32"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as OutcomeFilter)}
              aria-label="Filter by outcome"
            >
              <option value="ALL">All</option>
              <option value="BOOKED">Booked</option>
              <option value="PENDING">Pending</option>
              <option value="ESCALATED">Escalated</option>
              <option value="DROPPED">Dropped</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card card-elevated p-0 overflow-x-auto overscroll-contain">
        <table className="w-full min-w-[640px]" role="grid">
          <thead>
            <tr className="text-left text-zinc-500 text-[10px] uppercase tracking-wider border-b border-border-dark bg-black/30">
              <th className="p-3 sm:p-4 font-semibold">Timestamp</th>
              <th className="p-3 sm:p-4 font-semibold">Caller</th>
              <th className="p-3 sm:p-4 font-semibold">Intent</th>
              <th className="p-3 sm:p-4 font-semibold">Outcome</th>
              <th className="p-3 sm:p-4 font-semibold">Duration</th>
              <th className="p-3 sm:p-4 font-semibold">AI Flags</th>
              <th className="p-3 sm:p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500">
                  {sessions.length === 0 ? 'No calls yet.' : 'No calls match your filters.'}
                </td>
              </tr>
            ) : (
              filteredSessions.map((session, i) => (
                <motion.tr
                  key={session.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2) }}
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => onViewCall(session.id)}
                >
                  <td className="p-3 sm:p-4 text-xs text-zinc-400 tabular-nums">{formatTimestamp(session.startedAt)}</td>
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-zinc-500 shrink-0" aria-hidden />
                      <span className="text-sm font-medium truncate">{session.callerPhone}</span>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className="text-xs font-medium px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">
                      {session.intent}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`text-xs font-bold ${
                        session.outcome === 'BOOKED'
                          ? 'text-emerald-400'
                          : session.outcome === 'ESCALATED'
                            ? 'text-amber-400'
                            : 'text-zinc-500'
                      }`}
                    >
                      {session.outcome}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-xs text-zinc-500 tabular-nums">{formatDuration(session.duration)}</td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1">
                      {(session.aiFlags ?? []).map((flag) => (
                        <span
                          key={flag}
                          className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <button
                      type="button"
                      className="p-2 text-zinc-500 hover:text-primary transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="View call"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCall(session.id);
                      }}
                    >
                      <ExternalLink size={16} aria-hidden />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
