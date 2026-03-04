/**
 * Session configuration. Single source of truth for timeout values.
 */

/** Idle timeout: auto-logout after this many ms without activity. Default 60 min. */
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
/** Show warning toast this many ms before expiry. */
export const SESSION_WARNING_BEFORE_MS = 60 * 1000;
