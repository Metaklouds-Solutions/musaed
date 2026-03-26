import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../constants';

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Parses raw pagination query strings into validated numbers.
 *
 * @param raw - Raw query params (page/limit as strings)
 * @param defaults - Override defaults for page/limit
 * @returns Validated { page, limit }
 */
export function parsePagination(
  raw: { page?: string; limit?: string },
  defaults?: { page?: number; limit?: number },
): PaginationParams {
  const defaultPage = defaults?.page ?? DEFAULT_PAGE;
  const defaultLimit = defaults?.limit ?? DEFAULT_LIMIT;

  const parsedPage =
    raw.page !== undefined ? parseInt(raw.page, 10) : defaultPage;
  const parsedLimit =
    raw.limit !== undefined ? parseInt(raw.limit, 10) : defaultLimit;

  return {
    page:
      Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : defaultPage,
    limit:
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 200)
        : defaultLimit,
  };
}
