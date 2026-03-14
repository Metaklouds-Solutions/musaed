/**
 * StatCardEnhanced: sparkline, trend indicator, hover effects.
 */

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedNumber } from '../AnimatedNumber';

interface StatCardEnhancedProps {
  label: string;
  value: ReactNode;
  animateValue?: number;
  format?: (n: number) => string;
  decimals?: number;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  className?: string;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 48;
  const height = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="opacity-60 text-[var(--ds-primary)]"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function StatCardEnhanced({
  label,
  value,
  animateValue,
  format,
  decimals,
  trend,
  sparklineData,
  className,
}: StatCardEnhancedProps) {
  const trendTone =
    trend === 'up'
      ? 'text-[var(--success)] bg-[var(--success)]/10'
      : trend === 'down'
        ? 'text-[var(--error)] bg-[var(--error)]/10'
        : 'text-[var(--text-muted)] bg-[var(--bg-hover)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      className={cn(
        'relative rounded-[var(--radius-card)] overflow-hidden p-5 card-glass',
        'transition-colors duration-200',
        className
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[var(--ds-primary)]/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] opacity-70" />
      </div>

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {label}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl font-semibold leading-tight tabular-nums text-[var(--text-primary)]',
              trend === 'up' && 'text-[var(--success)]',
              trend === 'down' && 'text-[var(--error)]'
            )}
          >
            {animateValue != null ? (
              <AnimatedNumber value={animateValue} format={format} decimals={decimals} />
            ) : (
              value
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full',
              trendTone
            )}
          >
            <Activity size={14} aria-hidden />
          </span>
          {trend === 'up' && (
            <TrendingUp
              size={16}
              className="text-[var(--success)]"
              aria-label="Trending up"
            />
          )}
          {trend === 'down' && (
            <TrendingDown
              size={16}
              className="text-[var(--error)]"
              aria-label="Trending down"
            />
          )}
          {trend === 'neutral' && (
            <Minus
              size={16}
              className="text-[var(--text-muted)]"
              aria-label="No change"
            />
          )}
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline data={sparklineData} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
