/**
 * Mock audio player. UI only; no real playback.
 */

import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioMockPlayerProps {
  durationSeconds: number;
}

export function AudioMockPlayer({ durationSeconds }: AudioMockPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const displayTime = playing ? Math.min(progress, durationSeconds) : 0;
  const m = Math.floor(displayTime / 60);
  const s = Math.floor(displayTime % 60);
  const label = `${m}:${s.toString().padStart(2, '0')} / ${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, '0')}`;
  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 flex items-center gap-4"
      style={{ minHeight: '80px' }}
    >
      <button
        type="button"
        onClick={() => {
          setPlaying((p) => !p);
          if (!playing) setProgress((prev) => Math.min(prev + 1, durationSeconds));
        }}
        className="w-12 h-12 rounded-full flex items-center justify-center border border-[var(--border-default)] hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2"
        style={{ color: 'var(--text-primary)' }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className="h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]"
          style={{ background: 'var(--bg-subtle)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(displayTime / durationSeconds) * 100}%`,
              background: 'var(--primary)',
            }}
          />
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}
