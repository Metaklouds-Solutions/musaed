import React from 'react';
import { AuditLog } from '../types';
import { Shield, User, Zap, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

interface AuditLogsProps {
  logs: AuditLog[];
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-zinc-500">Track all administrative actions across the platform</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">Export CSV</button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="divide-y divide-border-dark">
          {logs.map((log, index) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-border-dark flex items-center justify-center">
                  <Terminal size={18} className="text-zinc-500 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-500 font-mono">{log.target}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <User size={12} /> {log.actor}
                    </span>
                    <span className="text-xs text-zinc-600">|</span>
                    <span className="text-xs text-zinc-400">Tenant: {log.tenantId}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">{new Date(log.ts).toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
