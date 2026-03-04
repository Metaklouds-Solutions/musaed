/**
 * Parse call transcript into speaker segments for replay.
 */

export interface TranscriptSegment {
  speaker: 'patient' | 'agent';
  text: string;
}

const SEGMENT_RE = /(Patient|Agent):\s*([\s\S]*?)(?=(?:Patient|Agent):\s*|$)/gi;

function isSpeaker(s: string): s is TranscriptSegment['speaker'] {
  return s === 'patient' || s === 'agent';
}

export function parseTranscriptSegments(transcript: string): TranscriptSegment[] {
  if (!transcript?.trim()) return [];
  const segments: TranscriptSegment[] = [];
  let m: RegExpExecArray | null;
  while ((m = SEGMENT_RE.exec(transcript)) !== null) {
    const raw = m[1].toLowerCase();
    const speaker = isSpeaker(raw) ? raw : 'agent';
    const text = m[2].trim();
    if (text) segments.push({ speaker, text });
  }
  if (segments.length === 0) {
    const trimmed = transcript.trim();
    if (trimmed) segments.push({ speaker: 'agent', text: trimmed });
  }
  return segments;
}
