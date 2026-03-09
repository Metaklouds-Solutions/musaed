/**
 * Notifications hook. Fetches list, unread count, subscribes to WebSocket, provides mark-as-read.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../app/session/SessionContext';
import { toast } from 'sonner';
import type { NotificationItem } from '../app/layout/Header/NotificationDrawer';
import { notificationsAdapter } from '../adapters';
import { getNotificationSocket } from '../lib/socket';

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toNotificationItem(p: Record<string, unknown>): NotificationItem {
  const createdAt = (p.createdAt ?? p.time ?? new Date().toISOString()) as string;
  return {
    id: (p.id as string) ?? '',
    title: (p.title as string) ?? '',
    message: (p.message as string) ?? '',
    time: formatTime(createdAt),
    unread: !(p.read as boolean),
    link: p.link as string | undefined,
  };
}

export function useNotifications() {
  const { session } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationsAdapter.getList({ limit: 50 }),
        notificationsAdapter.getUnreadCount(),
      ]);
      setItems(list);
      setUnreadCount(count);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session?.user) return;

    const socket = getNotificationSocket();
    if (!socket) return;

    const onNotification = (payload: Record<string, unknown>) => {
      const item = toNotificationItem(payload);
      setItems((prev) => [item, ...prev]);
      setUnreadCount((c) => c + 1);

      const priority = (payload.priority as string) ?? 'normal';
      if (priority === 'critical' || priority === 'high') {
        toast.info(item.title, { description: item.message });
      }
    };

    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [session?.user]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationsAdapter.markAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationsAdapter.markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  }, []);

  return {
    items,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}
