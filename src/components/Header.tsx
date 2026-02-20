import React from 'react';
import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  user: { name: string; role: string } | null;
}

export const Header: React.FC<HeaderProps> = ({ title, user }) => {
  return (
    <header className="h-16 border-b border-border-dark flex items-center justify-between px-8 bg-bg-dark/50 backdrop-blur-md sticky top-0 z-10">
      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-black border border-border-dark rounded-full pl-10 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <button className="text-zinc-400 hover:text-white relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-border-dark">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <User size={18} className="text-zinc-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
