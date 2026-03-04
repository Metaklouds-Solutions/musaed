/**
 * Expandable nav group. Renders parent + children when expanded.
 * Uses motion for smooth expand/collapse.
 * Caller must pass NavGroupItem (item with non-empty children).
 */

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { NavGroupItem } from '../../types';
import { SidebarItem } from '../SidebarItem';
import type { SidebarVariant } from '../SidebarItem';

const EXPAND_TRANSITION = { duration: 0.2 };

interface SidebarGroupProps {
  item: NavGroupItem;
  variant: SidebarVariant;
  onChildClick?: () => void;
}

export function SidebarGroup({ item, variant, onChildClick }: SidebarGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const toggle = useCallback(() => setExpanded((e) => !e), []);
  const isCompact = variant === 'minimal-compact';
  const Icon = item.icon;
  const groupId = `sidebar-group-${item.to.replace(/\//g, '-')}`;

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        className={cn(
          'w-full flex items-center gap-3 rounded-[var(--radius-nav)] py-2.5 transition-colors touch-manipulation',
          isCompact ? 'justify-center px-0 min-w-[44px]' : 'px-3.5',
          'text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]',
          'focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]'
        )}
        title={isCompact ? item.label : undefined}
        aria-expanded={expanded}
        aria-controls={groupId}
      >
        <Icon size={20} aria-hidden className="shrink-0" strokeWidth={1.5} />
        {!isCompact && (
          <>
            <span className="font-medium truncate flex-1 text-left">{item.label}</span>
            {expanded ? (
              <ChevronDown size={16} className="shrink-0 text-[var(--text-muted)]" />
            ) : (
              <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
            )}
          </>
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={groupId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={EXPAND_TRANSITION}
            className="overflow-hidden"
          >
            <div className={cn('space-y-0.5', !isCompact && 'pl-4 ml-2 border-l border-(var(--border-subtle))')}>
              {item.children.map((child) => (
                <SidebarItem
                  key={child.to}
                  to={child.to}
                  label={child.label}
                  icon={child.icon}
                  variant={variant}
                  onClick={onChildClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
