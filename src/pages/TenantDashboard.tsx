/**
 * Tenant (clinic) dashboard: KPIs and recent calls/bookings.
 * Time range filters data; KPIs are derived from real data. View All navigates to Call Logs / Bookings.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { Phone, Calendar, TrendingUp, AlertTriangle, Clock, ChevronRight, PhoneMissed, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ViewButton } from '@/shared/ui';
import type { CallSession, Booking } from '../types';

export type DashboardTimeRange = 'today' | '7d' | '30d';

function inTimeRange(iso: string, range: DashboardTimeRange): boolean {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'today') return d >= startOfToday;
  const days = range === '7d' ? 7 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return d >= start;
}

function formatAvgDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

interface TenantDashboardProps {
  sessions: CallSession[];
  bookings: Booking[];
  onViewCall: (id: string) => void;
  onNavigateToTab: (tab: 'calls' | 'bookings') => void;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({
  sessions = [],
  bookings = [],
  onViewCall,
  onNavigateToTab,
}) => {
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('7d');

  const filtered = useMemo(() => {
    const s = sessions.filter((s) => inTimeRange(s.startedAt, timeRange));
    const b = bookings.filter((b) => inTimeRange(b.createdAt, timeRange));
    const totalDuration = s.reduce((sum, x) => sum + x.duration, 0);
    const avgHandleSeconds = s.length ? totalDuration / s.length : 0;
    return { sessions: s, bookings: b, avgHandleSeconds };
  }, [sessions, bookings, timeRange]);

  const kpis = useMemo(
    () => [
      { label: 'Total Calls', value: filtered.sessions.length, icon: Phone, color: 'text-primary' },
      { label: 'Missed Calls', value: filtered.sessions.filter((s) => s.outcome === 'DROPPED').length, icon: PhoneMissed, color: 'text-red-400' },
      { label: 'Bookings Created', value: filtered.bookings.length, icon: Calendar, color: 'text-emerald-400' },
      {
        label: 'Conversion Rate',
        value: filtered.sessions.length ? `${Math.round((filtered.bookings.length / filtered.sessions.length) * 100)}%` : '0%',
        icon: TrendingUp,
        color: 'text-primary',
      },
      { label: 'Avg Handle Time', value: formatAvgDuration(filtered.avgHandleSeconds), icon: Clock, color: 'text-zinc-400' },
      { label: 'AI Flagged', value: filtered.sessions.filter((s) => (s.aiFlags?.length ?? 0) > 0).length, icon: AlertTriangle, color: 'text-amber-400' },
    ],
    [filtered]
  );

  const handleTimeRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value as DashboardTimeRange);
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Clinic Dashboard</h2>
          <p className="text-zinc-500 text-sm sm:text-base">How are we doing in the selected period?</p>
        </div>
        <label className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 shrink-0">Time range</span>
          <select
            className="input-field text-sm w-full sm:w-auto"
            value={timeRange}
            onChange={handleTimeRangeChange}
            aria-label="Dashboard time range"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="card-elevated p-4 space-y-2 h-full">
              <div className="flex items-center justify-between">
                <kpi.icon size={18} className={kpi.color} aria-hidden />
              </div>
              <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{kpi.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="card-elevated">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Recent Calls</CardTitle>
            <ViewButton onClick={() => onNavigateToTab('calls')}>View All</ViewButton>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {filtered.sessions.slice(0, 5).map((session) => (
              <button
                type="button"
                key={session.id}
                onClick={() => onViewCall(session.id)}
                className="w-full flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-white/5 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    session.outcome === 'BOOKED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{session.callerPhone}</p>
                    <p className="text-xs text-zinc-500">{session.intent} • {session.outcome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">{new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] text-zinc-600">{Math.floor(session.duration / 60)}m {session.duration % 60}s</p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-700 group-hover:text-primary transition-colors" aria-hidden />
                </div>
              </button>
            ))}
            {filtered.sessions.length === 0 && (
              <div className="py-6 text-center text-zinc-500 text-sm">No calls in this period.</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
            <ViewButton onClick={() => onNavigateToTab('bookings')}>View All</ViewButton>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {filtered.bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Patient ID: {booking.patientId}</p>
                    <p className="text-xs text-zinc-500">{booking.type} • {booking.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">{booking.status}</p>
                  <p className="text-[10px] text-zinc-500">{new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {filtered.bookings.length === 0 && (
              <div className="py-8 text-center text-zinc-500">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" aria-hidden />
                <p className="text-sm">No bookings in this period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
