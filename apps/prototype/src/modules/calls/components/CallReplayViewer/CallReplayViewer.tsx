/**
 * Call replay viewer. Step through transcript segments with prev/next controls.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePiiMask } from '@/shared/hooks/usePiiMask';
import { parseTranscriptSegments } from '../../utils/parseTranscript';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface CallReplayViewerProps {
  transcript: string;
}

const AUTO_STEP_MS = 2000;

export function CallReplayViewer({ transcript }: CallReplayViewerProps) {
  const { maskInText } = usePiiMask();
  const segments = useMemo(
    () => parseTranscriptSegments(transcript).map((s) => ({ ...s, text: maskInText(s.text) })),
    [transcript, maskInText]
  );
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const maxStep = segments.length;
  const visible = segments.slice(0, step);
  const canPrev = step > 0;
  const canNext = step < maxStep;

  const handlePrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleNext = useCallback(() => {
    setStep((s) => Math.min(maxStep, s + 1));
  }, [maxStep]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || step >= maxStep) {
      if (step >= maxStep) setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), AUTO_STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step, maxStep]);

  if (segments.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-sm text-[var(--text-muted)]">No transcript</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Call Replay</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous segment"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[var(--text-muted)] min-w-[4rem] text-center">
            {step} / {maxStep}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next segment"
          >
            <ChevronRight size={18} />
          </button>
          {playing ? (
            <button
              type="button"
              onClick={handlePause}
              className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"
              aria-label="Pause"
            >
              <Pause size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              disabled={!canNext}
              className="p-2 rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-40"
              aria-label="Play"
            >
              <Play size={18} aria-hidden />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {visible.map((seg, i) => (
          <div
            key={i}
            className={cn(
              'px-3 py-2 rounded-lg',
              seg.speaker === 'patient'
                ? 'bg-[var(--ds-primary)]/10 border-l-2 border-[var(--ds-primary)]'
                : 'bg-[var(--bg-elevated)] border-l-2 border-[var(--text-muted)]'
            )}
          >
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase">
              {seg.speaker}
            </span>
            <p className="mt-0.5 text-[var(--text-primary)]">{seg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
