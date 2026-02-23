/**
 * Transcript viewer. Highlights sentences that look like booking triggers (keyword-based).
 * Display only; no adapter access.
 */

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
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
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
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
        Transcript
      </h3>
      <div className="space-y-2 text-sm text-[var(--text-primary)]">
        {sentences.map((s, i) => {
          const highlight = isBookingTrigger(s);
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
