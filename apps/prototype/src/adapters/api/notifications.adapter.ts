/**
 * API notifications adapter. Fetches from backend and subscribes to WebSocket.
 */

import { api } from '../../lib/apiClient';
import type { NotificationItem } from '../../app/layout/Header/NotificationDrawer';

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  time?: string;
  createdAt?: string;
  priority?: string;
}

function toNotificationItem(p: NotificationPayload): NotificationItem {
  const createdAt = p.createdAt ?? p.time;
  const date = createdAt ? new Date(createdAt) : new Date();
  const timeStr =
    date.toDateString() === new Date().toDateString()
      ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    id: p.id,
    title: p.title,
    message: p.message,
    time: timeStr,
    unread: !p.read,
    link: p.link,
  };
}

export const notificationsAdapter = {
  async getList(params?: { page?: number; limit?: number; read?: boolean }): Promise<NotificationItem[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.read !== undefined) qs.set('read', String(params.read));
      const resp = await api.get<{ data: NotificationPayload[] }>(`/notifications?${qs.toString()}`);
      return (resp.data ?? []).map(toNotificationItem);
    } catch {
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const resp = await api.get<{ count: number }>('/notifications/unread-count');
      return resp.count ?? 0;
    } catch {
      return 0;
    }
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
