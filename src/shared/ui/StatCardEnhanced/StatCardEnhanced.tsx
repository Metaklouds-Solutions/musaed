/**
 * StatCardEnhanced: sparkline, trend indicator, hover effects.
 */

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardEnhancedProps {
  label: string;
  value: ReactNode;
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
  trend,
  sparklineData,
  className,
}: StatCardEnhancedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      className={cn(
        'rounded-[var(--radius-card)] overflow-hidden p-5 card-glass',
        'transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-[20px] font-semibold leading-tight text-[var(--text-primary)] tabular-nums">
            {value}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
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
