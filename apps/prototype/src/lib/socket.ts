/**
 * Socket.IO client for real-time notifications.
 * Connects to /notifications namespace with JWT auth.
 * Only connects when VITE_DATA_MODE=api; in local mode returns null to avoid
 * spurious WebSocket connection attempts when the backend is not running.
 */

import { io } from 'socket.io-client';
import { getAccessToken } from './apiClient';

const dataMode = import.meta.env.VITE_DATA_MODE as string | undefined;
const isApiMode = dataMode === 'api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const WS_BASE = BASE_URL.replace(/\/api\/?$/, '');

let socket: ReturnType<typeof io> | null = null;

export function getNotificationSocket(): ReturnType<typeof io> | null {
  if (!isApiMode) return null;

  const token = getAccessToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(`${WS_BASE}/notifications`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectNotificationSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
