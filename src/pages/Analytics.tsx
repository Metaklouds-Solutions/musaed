import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Users, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';

export const Analytics: React.FC = () => {
  const stats = [
    { label: 'Booking Rate', value: '42%', change: '+5.2%', trend: 'up', icon: TrendingUp },
    { label: 'Avg Handle Time', value: '3m 12s', change: '-12s', trend: 'up', icon: Clock },
    { label: 'Escalation Rate', value: '8.4%', change: '-2.1%', trend: 'up', icon: AlertTriangle },
    { label: 'Patient Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up', icon: Users },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-zinc-500">Trends and improvements for your AI agent.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <stat.icon size={20} className="text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="card h-80 flex flex-col justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" /> Intents Trend
          </h3>
          <div className="flex-1 flex items-end gap-2 pt-8">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-sm relative group" style={{ height: `${h}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {h} calls
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 pt-4 border-t border-border-dark mt-4">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="card h-80 flex flex-col">
          <h3 className="font-semibold flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-primary" /> Outcome Breakdown
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-40 h-40 rounded-full border-[16px] border-emerald-500 flex items-center justify-center">
              <div className="absolute inset-[-16px] rounded-full border-[16px] border-amber-500 border-t-transparent border-r-transparent border-b-transparent rotate-45"></div>
              <div className="text-center">
                <p className="text-2xl font-bold">72%</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Booked</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-zinc-400">Booked (72%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-zinc-400">Escalated (18%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
              <span className="text-xs text-zinc-400">Dropped (10%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-400" /> Top Drop-off Points
        </h3>
        <div className="space-y-4">
          {[
            { step: 'Insurance Verification', rate: '24%', reason: 'Patient missing ID card' },
            { step: 'Provider Selection', rate: '12%', reason: 'Preferred provider unavailable' },
            { step: 'Email Capture', rate: '8%', reason: 'User refused to provide' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-border-dark">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                  0{i+1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.step}</p>
                  <p className="text-xs text-zinc-500">{item.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-400">{item.rate}</p>
                <p className="text-[10px] text-zinc-600 uppercase font-bold">Drop-off</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
