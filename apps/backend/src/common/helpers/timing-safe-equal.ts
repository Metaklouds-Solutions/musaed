import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks.
 * Both strings are compared as UTF-8 buffers. Returns false when
 * either value is undefined, empty, or when lengths differ
 * (length itself is not a secret for API keys).
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if both strings are non-empty and equal
 */
export function safeEqual(
  a: string | undefined,
  b: string | undefined,
): boolean {
  if (!a || !b) return false;

  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) return false;

  return timingSafeEqual(bufA, bufB);
}
