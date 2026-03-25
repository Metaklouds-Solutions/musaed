/**
 * Audio placeholder for calls without a recording.
 */

import { VolumeX } from 'lucide-react';

interface AudioMockPlayerProps {
  durationSeconds: number;
}

/** Renders an explicit unavailable state instead of fake playback controls. */
export function AudioMockPlayer({ durationSeconds }: AudioMockPlayerProps) {
  const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="rounded-[var(--radius-card)] card-glass p-5 flex items-start gap-4"
      style={{ minHeight: '80px' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center border border-[var(--border-default)]"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
        aria-hidden
      >
        <VolumeX size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Recording unavailable
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          No audio recording was captured for this call.
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Call duration: {formatDuration(durationSeconds)}
        </p>
      </div>
    </div>
  );
}
