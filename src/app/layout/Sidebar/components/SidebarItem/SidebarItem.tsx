/**
 * Single sidebar nav item: NavLink with hover (subtle dark), active (accent + left bar), focus-visible.
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
          'w-full flex items-center gap-3 py-3 pr-4 transition-colors touch-manipulation',
          'focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
          isActive
            ? 'bg-[var(--primary-glow)] text-[var(--primary)] pl-[13px] border-l-[3px] border-l-[var(--primary)]'
            : 'pl-4 text-[var(--text-muted)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]'
        )
      }
    >
      <Icon size={20} aria-hidden className="shrink-0" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}
