/**
 * Session management section in Settings. Shows current session info and extend button.
 */

import { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useSession } from '@/app/session/SessionContext';
import { SESSION_IDLE_TIMEOUT_MS } from '@/app/session/sessionConfig';

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)} sec`;
  return `${Math.floor(ms / 60_000)} min`;
}

export function SessionManagementSection() {
  const { sessionStartedAt, lastActivityAt, extendSession } = useSession();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  if (sessionStartedAt == null || lastActivityAt == null) return null;

  const idleMs = now - lastActivityAt;
  const expiresInMs = Math.max(0, SESSION_IDLE_TIMEOUT_MS - idleMs);

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-[var(--ds-primary)]" aria-hidden />
        <h3 className="font-semibold text-[var(--text-primary)]">Active Session</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Your session will expire after 60 minutes of inactivity. Activity includes mouse, keyboard, and touch.
      </p>
      <div className="space-y-2 text-sm text-[var(--text-secondary)]">
        <p>Started: {formatDuration(now - sessionStartedAt)} ago</p>
        <p>Last activity: {formatDuration(idleMs)} ago</p>
        <p>Expires in: {formatDuration(expiresInMs)}</p>
      </div>
      <Button
        variant="secondary"
        onClick={extendSession}
        className="mt-4 flex items-center gap-2"
        aria-label="Extend session"
      >
        <RefreshCw className="w-4 h-4" />
        Extend Session
      </Button>
    </div>
  );
}
