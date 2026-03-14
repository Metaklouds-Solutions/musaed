/**
 * Modern Billing page (Module 8). Enhanced layout with glassmorphism, 
 * micro-interactions, and refined visual hierarchy.
 */

import React, { useState } from 'react';
import { PageHeader, Button } from '../../../shared/ui';
import { useBilling } from '../hooks';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

// Modern stat card with hover effects and glassmorphism
function ModernStatCard({ label, value, trend, icon }: { 
  label: string; 
  value: string | number; 
  trend?: { value: number; positive: boolean };
  icon?: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-[var(--border-subtle)]/10 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--text-primary)]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </span>
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-[var(--border-subtle)]/50 flex items-center justify-center text-[var(--text-secondary)] transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
      
      {/* Animated bottom border */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--text-primary)]/20 transition-all duration-300 w-0 group-hover:w-full" />
    </div>
  );
}

// Modern credits section with glassmorphism and interactive elements
function CreditsSection({ onBuy }: { onBuy: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <section 
      className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--border-subtle)]/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--text-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform duration-500" 
           style={{ transform: isHovered ? 'translate(30%, -30%) scale(1.1)' : 'translate(50%, -50%)' }} />
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-primary)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Credits</h2>
          </div>
          
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg">
            Purchase additional credits to continue using AI call handling.
          </p>
        </div>
        
        <div className="flex flex-col items-start sm:items-end gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System operational
          </div>
          
          <Button 
            variant="primary" 
            onClick={onBuy}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            aria-label="Buy credits"
            className={`
              relative overflow-hidden transition-all duration-200 
              ${isPressed ? 'scale-95' : 'scale-100'}
              ${isHovered ? 'shadow-lg shadow-[var(--text-primary)]/20' : ''}
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Buy Credits
            </span>
            {/* Button shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
          </Button>
        </div>
      </div>
      
      {/* Progress indicator decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--border-subtle)]/50">
        <div className="h-full w-3/4 bg-gradient-to-r from-[var(--text-primary)]/30 to-[var(--text-primary)]/60" />
      </div>
    </section>
  );
}

// Loading skeleton with modern animation
function BillingSkeleton() {
  const skeletonKeys = ['billing-skeleton-1', 'billing-skeleton-2', 'billing-skeleton-3', 'billing-skeleton-4', 'billing-skeleton-5'] as const;
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-32 bg-[var(--border-subtle)] rounded-lg" />
        <div className="h-4 w-64 bg-[var(--border-subtle)]/50 rounded" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {skeletonKeys.map((key) => (
          <div key={key} className="h-24 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)]" />
        ))}
      </div>
      
      <div className="h-32 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)]" />
    </div>
  );
}

/** Renders tenant billing overview with plan, usage, and credits. */
export function BillingPage() {
  const { overview, loading, buyCredits } = useBilling();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" description="Plan, credits, and usage" />
        <BillingSkeleton />
      </div>
    );
  }

  if (overview == null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" description="Plan, credits, and usage" />
        <div className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)]/50">
          <div className="w-8 h-8 rounded-full bg-[var(--text-muted)]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-muted)]">No billing data available for this account.</p>
        </div>
      </div>
    );
  }

  // Icons for stat cards (using inline SVGs to match existing color scheme)
  const icons = {
    plan: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    minutes: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    credits: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    savings: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    roi: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="Current plan, usage, and credits. Simulated deduction based on call usage."
      />
      
      {/* Stats Grid with modern cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ModernStatCard 
          label="Current plan" 
          value={overview.plan ?? '—'} 
          icon={icons.plan}
        />
        <ModernStatCard 
          label="Minutes used" 
          value={(overview.minutesUsed ?? 0).toLocaleString()} 
          icon={icons.minutes}
        />
        <ModernStatCard 
          label="Credit balance" 
          value={overview.creditBalance ?? 0} 
          icon={icons.credits}
        />
        <ModernStatCard 
          label="Estimated savings" 
          value={formatCurrency(overview.estimatedSavings ?? 0)} 
          icon={icons.savings}
        />
        <ModernStatCard 
          label="Net ROI" 
          value={`${overview.netROI ?? 0}%`} 
          icon={icons.roi}
        />
      </section>

      <CreditsSection onBuy={buyCredits} />
    </div>
  );
}