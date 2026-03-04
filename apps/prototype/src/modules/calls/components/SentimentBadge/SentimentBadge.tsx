/**
 * Sentiment badge from score (0–1). Display only; no business logic.
 */

import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

interface SentimentBadgeProps {
  score: number;
  className?: string;
}

export function SentimentBadge({ score, className }: SentimentBadgeProps) {
  const pct = Math.round(score * 100);
  const tier =
    score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low';
  const config = {
    high: {
      label: 'Positive',
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#22C55E',
      icon: TrendingUp,
    },
    medium: {
      label: 'Neutral',
      bg: 'rgba(113, 113, 122, 0.1)',
      text: '#71717A',
      icon: Minus,
    },
    low: {
      label: 'Low',
      bg: 'rgba(239, 68, 68, 0.1)',
      text: '#EF4444',
      icon: TrendingDown,
    },
  };
  const { label, bg, text, icon: Icon } = config[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${className ?? ''}`}
      style={{ background: bg, color: text }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {label} ({pct}%)
    </span>
  );
}
