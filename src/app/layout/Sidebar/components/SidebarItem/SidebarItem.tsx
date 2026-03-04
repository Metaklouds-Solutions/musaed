/**
 * Sidebar nav item. Design.json: radius 10px, padding, active = bg + left accent bar.
 * Supports glass-expanded (icon + label) and minimal-compact (icon only, tooltip).
 */

import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type SidebarVariant = 'glass-expanded' | 'minimal-compact';

interface SidebarItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  variant?: SidebarVariant;
  onClick?: () => void;
}

const expandedClasses =
  'w-full flex items-center gap-3 rounded-[var(--radius-nav)] py-2.5 px-3.5 transition-colors touch-manipulation';
const compactClasses =
  'w-full flex items-center justify-center rounded-[var(--radius-nav)] py-2.5 px-0 transition-colors touch-manipulation min-w-[44px]';

export function SidebarItem({
  to,
  label,
  icon: Icon,
  variant = 'glass-expanded',
  onClick,
}: SidebarItemProps) {
  const isCompact = variant === 'minimal-compact';

  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={isCompact ? label : undefined}
      className={({ isActive }) =>
        cn(
          isCompact ? compactClasses : expandedClasses,
          'focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
          isActive
            ? 'bg-[var(--sidebar-item-active)] text-[var(--ds-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]',
          isCompact && 'justify-center pl-0',
          !isCompact && isActive && 'pl-3 border-l-[3px] border-l-[var(--ds-primary)] font-semibold'
        )
      }
    >
      <Icon
        size={20}
        aria-hidden
        className={cn('shrink-0', isCompact && 'mx-auto')}
        strokeWidth={1.5}
      />
      {!isCompact && <span className="font-medium truncate">{label}</span>}
    </NavLink>
  );
}
