/**
 * Notifications panel: filter All | Unread, list, empty state.
 * Uses shared Drawer. State (open/notifications) lives in Header.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerHeader } from '../../../shared/ui';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  link?: string;
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  items: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  hasUnread?: boolean;
}

type Filter = 'all' | 'unread';

export function NotificationDrawer({
  open,
  onClose,
  items,
  onMarkAsRead,
  onMarkAllAsRead,
  hasUnread = items.some((n) => n.unread),
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const navigate = useNavigate();
  const filtered =
    filter === 'unread' ? items.filter((n) => n.unread) : items;
  const isEmpty = filtered.length === 0;

  return (
    <Drawer open={open} onClose={onClose} title="Notifications" widthRem={24} side="right">
      <DrawerHeader title="Notifications" onClose={onClose} />
      <div className="flex gap-2 px-4 sm:px-5 py-3 border-b border-[var(--separator)]">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'flex-1 sm:flex-none px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm font-medium rounded-xl sm:rounded-lg transition-colors cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]'
          )}
          style={
            filter === 'all'
              ? { background: 'var(--primary-glow)', color: 'var(--primary)' }
              : { color: 'var(--text-muted)' }
          }
        >
          All
        </button>
        {onMarkAllAsRead && hasUnread && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Mark all read
          </button>
        )}
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={cn(
            'flex-1 sm:flex-none px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm font-medium rounded-xl sm:rounded-lg transition-colors cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]'
          )}
          style={
            filter === 'unread'
              ? { background: 'var(--primary-glow)', color: 'var(--primary)' }
              : { color: 'var(--text-muted)' }
          }
        >
          Unread
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-12 px-6 text-center">
            <div
              className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-4"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Bell className="w-8 h-8 sm:w-7 sm:h-7" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p
              className="text-base sm:text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              No notifications
            </p>
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {filter === 'unread'
                ? 'No unread notifications.'
                : 'You’re all caught up.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--separator)]">
            {filtered.map((item) => (
              <li key={item.id} className="px-4 sm:px-5 py-4 sm:py-4">
                <button
                  type="button"
                  onClick={() => {
                    if (item.unread && onMarkAsRead) onMarkAsRead(item.id);
                    if (item.link?.startsWith('/')) {
                      onClose();
                      navigate(item.link);
                    }
                  }}
                  className="w-full text-left flex gap-3 hover:bg-[var(--bg-hover)]/50 rounded-lg -m-2 p-2 transition-colors"
                >
                  {item.unread && (
                    <span
                      className="mt-2 w-2 h-2 rounded-full shrink-0"
                      style={{ background: 'var(--primary)' }}
                      aria-hidden
                    />
                  )}
                  <div className={cn('min-w-0 flex-1', item.unread && 'pl-2')}>
                    <p
                      className={cn(
                        'text-sm',
                        item.unread ? 'font-semibold' : 'font-medium'
                      )}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="mt-0.5 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.message}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {item.time}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
