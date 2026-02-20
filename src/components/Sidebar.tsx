import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Activity, 
  ShieldCheck, 
  LogOut, 
  PlusCircle,
  Database,
  Globe,
  Zap,
  Phone,
  Calendar,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  role: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, role }) => {
  const adminItems = [
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'sessions', label: 'All Sessions', icon: Activity },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const managerItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calls', label: 'Call Logs', icon: Phone },
    { id: 'patients', label: 'CRM Patients', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Clinic Settings', icon: Settings },
  ];

  const menuItems = role === 'ADMIN' ? adminItems : managerItems;

  return (
    <div className="w-64 h-screen bg-card-dark border-r border-border-dark flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Zap className="text-black w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight">AgentOs</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id 
                ? 'bg-primary/10 text-primary' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border-dark">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
