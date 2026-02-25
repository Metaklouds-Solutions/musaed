/**
 * Sidebar nav item. Design.json: radius 10px, padding 10px 14px, active = bg + left accent bar, hover = subtle.
 */

import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
}

export function SidebarItem({ to, label, icon: Icon, onClick }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'w-full flex items-center gap-3 rounded-[var(--radius-nav)] py-2.5 px-3.5 transition-colors touch-manipulation',
          'focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
          isActive
            ? 'bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)] pl-3 border-l-[3px] border-l-[var(--ds-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]'
        )
      }
    >
      <Icon size={20} aria-hidden className="shrink-0" strokeWidth={1.5} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}
