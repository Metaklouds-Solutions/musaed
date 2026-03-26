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
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  variant?: SidebarVariant;
  onClick?: () => void;
  badgeCount?: number;
  badgeTooltip?: string;
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
  badgeCount,
  badgeTooltip,
}: SidebarItemProps) {
  const isCompact = variant === 'minimal-compact';
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0;
  const displayCount = showBadge ? (badgeCount > 99 ? '99+' : String(badgeCount)) : null;

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
      <div className={cn('relative', isCompact && 'mx-auto')}>
        <Icon
          size={20}
          aria-hidden
          className="shrink-0"
          strokeWidth={1.5}
        />
        {showBadge && isCompact && (
          <span
            className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-[var(--ds-primary)] text-white text-[10px] leading-4 text-center font-semibold"
            title={badgeTooltip ?? `${badgeCount} open issues`}
            aria-label={badgeTooltip ?? `${badgeCount} open issues`}
          >
            {displayCount}
          </span>
        )}
      </div>
      {!isCompact && <span className="font-medium truncate">{label}</span>}
      {showBadge && !isCompact && (
        <span
          className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[var(--ds-primary)] text-white text-[11px] leading-5 text-center font-semibold"
          title={badgeTooltip ?? `${badgeCount} open issues`}
          aria-label={badgeTooltip ?? `${badgeCount} open issues`}
        >
          {displayCount}
        </span>
      )}
    </NavLink>
  );
}
