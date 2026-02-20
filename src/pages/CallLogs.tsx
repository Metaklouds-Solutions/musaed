import React from 'react';
import { CallSession } from '../types';
import { 
  Search, 
  Filter, 
  Phone, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

interface CallLogsProps {
  sessions: CallSession[];
  onViewCall: (id: string) => void;
}

export const CallLogs: React.FC<CallLogsProps> = ({ sessions, onViewCall }) => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Call Logs</h2>
          <p className="text-zinc-500">Find any call fast.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search phone or patient..." 
              className="input-field pl-10 text-sm w-64"
            />
          </div>
          <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-zinc-500 text-[10px] uppercase tracking-wider border-b border-border-dark bg-black/30">
              <th className="p-4 font-semibold">Timestamp</th>
              <th className="p-4 font-semibold">Caller</th>
              <th className="p-4 font-semibold">Intent</th>
              <th className="p-4 font-semibold">Outcome</th>
              <th className="p-4 font-semibold">Duration</th>
              <th className="p-4 font-semibold">AI Flags</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {sessions?.map((session, i) => (
              <motion.tr 
                key={session.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-white/5 transition-colors group cursor-pointer"
                onClick={() => onViewCall(session.id)}
              >
                <td className="p-4 text-xs text-zinc-400">
                  {new Date(session.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-zinc-500" />
                    <span className="text-sm font-medium">{session.callerPhone}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs font-medium px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">
                    {session.intent}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold ${
                    session.outcome === 'BOOKED' ? 'text-emerald-400' : 
                    session.outcome === 'ESCALATED' ? 'text-amber-400' : 
                    'text-zinc-500'
                  }`}>
                    {session.outcome}
                  </span>
                </td>
                <td className="p-4 text-xs text-zinc-500">
                  {Math.floor(session.duration / 60)}m {session.duration % 60}s
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {session.aiFlags?.map(flag => (
                      <span key={flag} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                        {flag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-zinc-500 hover:text-primary transition-colors">
                    <ExternalLink size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
