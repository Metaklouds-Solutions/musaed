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
  const severity =
    (p.severity as NotificationItem['severity']) ??
    ((p.priority as string) === 'critical'
      ? 'critical'
      : (p.priority as string) === 'high'
        ? 'important'
        : (p.priority as string) === 'low'
          ? 'info'
          : 'normal');
  return {
    id: (p.id as string) ?? (p._id as string) ?? '',
    title: (p.title as string) ?? '',
    message: (p.message as string) ?? '',
    time: formatTime(createdAt),
    severity,
    source: (p.source as string) ?? 'system',
    type: (p.type as string) ?? 'system',
    metadata: (p.metadata as Record<string, unknown>) ?? (p.meta as Record<string, unknown>) ?? {},
    unread: !(p.read as boolean),
    link: p.link as string | undefined,
  };
}

function dedupeById(items: NotificationItem[]): NotificationItem[] {
  const seen = new Set<string>();
  const out: NotificationItem[] = [];
  for (const item of items) {
    if (!item.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export function useNotifications() {
  const { session } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bellPulse, setBellPulse] = useState(0);

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
      setItems((prev) => dedupeById([...list, ...prev]));
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
      setItems((prev) => {
        const exists = prev.some((n) => n.id === item.id);
        if (exists) {
          return prev.map((n) => (n.id === item.id ? { ...n, ...item } : n));
        }
        setUnreadCount((c) => c + (item.unread ? 1 : 0));
        setBellPulse((p) => p + 1);
        return [item, ...prev];
      });

      const severity = (payload.severity as string) ?? ((payload.priority as string) ?? 'normal');
      if (severity === 'critical' || severity === 'important' || severity === 'high') {
        toast.info(item.title, { description: item.message });
      }
    };

    socket.on('notification:new', onNotification);
    socket.on('notification', onNotification);
    const onDashboardRefresh = () => {
      window.dispatchEvent(new Event('dashboard:refresh'));
    };
    socket.on('dashboard:refresh', onDashboardRefresh);
    return () => {
      socket.off('notification:new', onNotification);
      socket.off('notification', onNotification);
      socket.off('dashboard:refresh', onDashboardRefresh);
    };
  }, [session?.user]);

  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;
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

  const clearNotifications = useCallback(async () => {
    await notificationsAdapter.clear();
    setItems([]);
    setUnreadCount(0);
  }, []);

  return {
    items,
    unreadCount,
    loading,
    bellPulse,
    refresh,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
