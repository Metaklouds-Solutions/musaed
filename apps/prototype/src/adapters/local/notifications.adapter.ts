/**
 * Local notifications adapter. Returns empty for local/mock mode.
 */

import type { NotificationItem } from '../../app/layout/Header/NotificationDrawer';

export const notificationsAdapter = {
  async getList(_params?: { page?: number; limit?: number; read?: boolean }): Promise<NotificationItem[]> {
    return [];
  },

  async getUnreadCount(): Promise<number> {
    return 0;
  },

  async markAsRead(_id: string): Promise<void> {},

  async markAllAsRead(): Promise<void> {},

  async delete(_id: string): Promise<void> {},

  async clear(): Promise<void> {},
};
