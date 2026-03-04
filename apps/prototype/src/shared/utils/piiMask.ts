/**
 * PII masking utility. Masks emails, phones, and names for privacy/compliance.
 * Use when displaying sensitive data to users without unmask permission.
 */

/** Mask email: j***@example.com (keep first char + domain). */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '—';
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return `*${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}${domain}`;
}

/** Mask phone: ***-***-1234 (keep last 4 digits). */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***-***-${digits.slice(-4)}`;
}

/** Mask name: J*** D*** (first char + asterisks per word). */
export function maskName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '—';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word;
      return `${word[0]}${'*'.repeat(Math.min(word.length - 1, 3))}`;
    })
    .join(' ');
}

/** Regex patterns for PII in free text (transcripts, notes). */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;

/**
 * Mask PII in free text (transcripts, notes). Replaces emails and phone numbers.
 * Names in text are harder to detect; this covers structured PII.
 */
export function maskInText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(EMAIL_RE, (m) => maskEmail(m))
    .replace(PHONE_RE, (m) => maskPhone(m));
}
