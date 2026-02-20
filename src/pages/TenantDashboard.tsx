import React from 'react';
import { 
  Phone, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  PhoneMissed,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { CallSession, Booking } from '../types';

interface TenantDashboardProps {
  sessions: CallSession[];
  bookings: Booking[];
  onViewCall: (id: string) => void;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({ sessions = [], bookings = [], onViewCall }) => {
  const kpis = [
    { label: 'Total Calls', value: sessions?.length || 0, icon: Phone, color: 'text-primary' },
    { label: 'Missed Calls', value: sessions?.filter(s => s.outcome === 'DROPPED').length || 0, icon: PhoneMissed, color: 'text-red-400' },
    { label: 'Bookings Created', value: bookings?.length || 0, icon: Calendar, color: 'text-emerald-400' },
    { label: 'Conversion Rate', value: `${Math.round(((bookings?.length || 0) / (sessions?.length || 1)) * 100)}%`, icon: TrendingUp, color: 'text-primary' },
    { label: 'Avg Handle Time', value: '3m 12s', icon: Clock, color: 'text-zinc-400' },
    { label: 'AI Flagged', value: sessions?.filter(s => s.aiFlags?.length > 0).length || 0, icon: AlertTriangle, color: 'text-amber-400' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clinic Dashboard</h2>
          <p className="text-zinc-500">How are we doing today?</p>
        </div>
        <div className="flex gap-2">
          <select className="input-field text-sm">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Today</option>
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <kpi.icon size={18} className={kpi.color} />
              <span className="text-[10px] text-emerald-500 font-medium">+12%</span>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Recent Calls */}
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Recent Calls</h3>
            <button className="text-xs text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {sessions?.slice(0, 5).map((session) => (
              <div 
                key={session.id} 
                onClick={() => onViewCall(session.id)}
                className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
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
                  <ChevronRight size={14} className="text-zinc-700 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Bookings */}
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Today's Bookings Created</h3>
            <button className="text-xs text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {bookings?.slice(0, 5).map((booking) => (
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
            {bookings?.length === 0 && (
              <div className="py-8 text-center text-zinc-500">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No bookings created yet today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
