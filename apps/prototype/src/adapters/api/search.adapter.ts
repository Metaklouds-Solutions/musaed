/**
 * API search adapter. Calls backend search endpoint.
 */

import { api } from '../../lib/apiClient';

export type SearchResultType = 'tenant' | 'staff' | 'ticket' | 'nav';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  meta?: string;
  path: string;
}

export const searchAdapter = {
  /**
   * Search across tenants, staff, tickets.
   * Backend respects tenant scope for non-admin.
   */
  async search(
    query: string,
    _tenantId?: string,
    _isAdmin?: boolean,
    types?: string[]
  ): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    const params = new URLSearchParams({ q });
    if (types?.length) {
      params.set('types', types.join(','));
    }
    const data = await api.get<SearchResult[]>(`/search?${params.toString()}`);
    return Array.isArray(data) ? data : [];
  },
};
