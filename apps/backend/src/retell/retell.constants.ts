/** Retell API base URL for all environments. */
export const RETELL_API_BASE_URL = 'https://api.retellai.com';

/** Default timeout for outbound Retell API calls. */
export const RETELL_DEFAULT_TIMEOUT_MS = 30_000;

/** Number of retry attempts for transient Retell failures. */
export const RETELL_RETRY_ATTEMPTS = 3;

/** Base delay for exponential backoff between retries. */
export const RETELL_RETRY_BASE_DELAY_MS = 500;
