/**
 * Notifications panel: filter All | Unread, list, empty state.
 * Uses shared Drawer. State (open/notifications) lives in Header.
 */

import { useState } from 'react';
import { Drawer, DrawerHeader } from '../../../shared/ui';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  items: NotificationItem[];
}

type Filter = 'all' | 'unread';

export function NotificationDrawer({
  open,
  onClose,
  items,
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const filtered =
    filter === 'unread' ? items.filter((n) => n.unread) : items;
  const isEmpty = filtered.length === 0;

  return (
    <Drawer open={open} onClose={onClose} title="Notifications" widthRem={22} side="right">
      <DrawerHeader title="Notifications" onClose={onClose} />
      <div className="flex gap-1 px-5 py-3 border-b border-[var(--separator)]">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
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
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
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
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Bell className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              No notifications
            </p>
            <p
              className="mt-1 text-sm"
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
              <li key={item.id} className="px-5 py-4">
                <div className="flex gap-3">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
