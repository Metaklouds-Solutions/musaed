import React, { useState } from 'react';
import { storage } from '../services/storage';
import { Zap, Shield, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = (role: 'ADMIN' | 'MANAGER') => {
    setLoading(true);
    setTimeout(() => {
      const user = storage.login(role);
      onLogin(user);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <Zap className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome to AgentOs</h2>
          <p className="mt-2 text-zinc-500">Select a role to enter the prototype</p>
        </div>

        <div className="grid gap-4 mt-10">
          <button
            onClick={() => handleLogin('ADMIN')}
            disabled={loading}
            className="group relative flex items-center gap-4 p-6 bg-card-dark border border-border-dark rounded-2xl hover:border-primary/50 transition-all text-left"
          >
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Shield className="text-zinc-400 group-hover:text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Login as Admin</p>
              <p className="text-sm text-zinc-500">Manage all tenants, users, and global settings</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin('MANAGER')}
            disabled={loading}
            className="group relative flex items-center gap-4 p-6 bg-card-dark border border-border-dark rounded-2xl hover:border-primary/50 transition-all text-left"
          >
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <UserIcon className="text-zinc-400 group-hover:text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Login as Tenant Manager</p>
              <p className="text-sm text-zinc-500">Manage specific tenant configuration and observability</p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center mt-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
