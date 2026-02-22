/**
 * Login screen: role selection only (Admin or Tenant Manager).
 * No credentials; used for prototype/demo. Shows loading state during sign-in.
 */

import React, { useState, useCallback } from 'react';
import { storage } from '../services/storage';
import type { User } from '../types';
import type { Theme } from '../App';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Shield from 'lucide-react/dist/esm/icons/shield';
import User from 'lucide-react/dist/esm/icons/user';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Moon from 'lucide-react/dist/esm/icons/moon';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
  theme?: Theme;
  onThemeToggle?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, theme = 'dark', onThemeToggle }) => {
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  const handleLogin = useCallback(
    (role: 'ADMIN' | 'MANAGER') => {
      setLoading(true);
      setTimeout(() => {
        const user = storage.login(role);
        onLogin(user);
        setLoading(false);
      }, 800);
    },
    [onLogin]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 relative">
      {onThemeToggle ? (
        <button
          type="button"
          onClick={onThemeToggle}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={22} aria-hidden /> : <Moon size={22} aria-hidden />}
        </button>
      ) : null}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <section className="text-center" aria-label="Welcome">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6" aria-hidden>
            <Zap className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Welcome to AgentOs</h1>
          <p className="mt-2 text-muted-foreground">Select a role to enter the prototype</p>
        </section>

        <div className="grid gap-4 mt-10">
          <button
            type="button"
            onClick={() => handleLogin('ADMIN')}
            disabled={loading}
            className="group relative flex items-center gap-4 p-4 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors text-left touch-manipulation focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Login as Admin"
          >
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0" aria-hidden>
              <Shield className="text-muted-foreground group-hover:text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-foreground">Login as Admin</p>
              <p className="text-sm text-muted-foreground">Manage all tenants, users, and global settings</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLogin('MANAGER')}
            disabled={loading}
            className="group relative flex items-center gap-4 p-4 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors text-left touch-manipulation focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Login as Tenant Manager"
          >
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0" aria-hidden>
              <User className="text-muted-foreground group-hover:text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-foreground">Login as Tenant Manager</p>
              <p className="text-sm text-muted-foreground">Manage specific tenant configuration and observability</p>
            </div>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center mt-8" aria-live="polite">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};
