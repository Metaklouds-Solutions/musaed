/**
 * AnimatedCard: wraps Card with entrance animation and optional click handler.
 */

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Card } from '../Card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  onClick?: () => void;
  className?: string;
}

export function AnimatedCard({ children, delay = 0, onClick, className }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer', className)}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      <Card>{children}</Card>
    </motion.div>
  );
}
