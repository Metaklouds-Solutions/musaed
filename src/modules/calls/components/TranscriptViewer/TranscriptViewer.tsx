/**
 * Transcript viewer. Highlights sentences that look like booking triggers (keyword-based).
 * PII (emails, phones) masked by default; auditors can reveal.
 */

import { usePiiMask } from '@/shared/hooks/usePiiMask';
import { Eye, EyeOff } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: string;
}

const BOOKING_TRIGGER_WORDS = [
  'book',
  'booking',
  'appointment',
  'schedule',
  'reschedule',
  'slot',
  'available',
  'confirm',
  'booked',
];

function isBookingTrigger(sentence: string): boolean {
  const lower = sentence.trim().toLowerCase();
  return BOOKING_TRIGGER_WORDS.some((w) => lower.includes(w));
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const { maskInText, canViewUnmaskedPII, showUnmasked, toggleUnmasked } = usePiiMask();
  const displayText = maskInText(transcript);
  const originalSentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const displaySentences = displayText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sentences = displaySentences.length > 0 ? displaySentences : originalSentences;

  if (sentences.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
        style={{ minHeight: '120px' }}
      >
        <p className="text-sm text-[var(--text-muted)]">No transcript</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
      style={{ minHeight: '120px' }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Transcript
        </h3>
        {canViewUnmaskedPII && (
          <button
            type="button"
            onClick={toggleUnmasked}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            aria-label={showUnmasked ? 'Mask PII' : 'Reveal PII'}
          >
            {showUnmasked ? <EyeOff size={14} /> : <Eye size={14} />}
            {showUnmasked ? 'Mask PII' : 'Reveal PII'}
          </button>
        )}
      </div>
      <div className="space-y-2 text-sm text-[var(--text-primary)]">
        {sentences.map((s, i) => {
          const highlight = isBookingTrigger(originalSentences[i] ?? s);
          return (
            <p
              key={i}
              className={highlight ? 'pl-3 border-l-2 border-[var(--primary)]' : ''}
            >
              {s}
            </p>
          );
        })}
      </div>
    </div>
  );
}
