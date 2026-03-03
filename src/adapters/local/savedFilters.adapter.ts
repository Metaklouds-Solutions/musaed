/**
 * Saved filters / views adapter. Stores per-page filter presets in localStorage.
 */

const STORAGE_KEY = 'clinic-crm-saved-filters';

export interface SavedFilter {
  id: string;
  pageKey: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
}

function isSavedFilter(x: unknown): x is SavedFilter {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.pageKey === 'string' &&
    typeof o.name === 'string' &&
    typeof o.filters === 'object' &&
    o.filters !== null &&
    !Array.isArray(o.filters) &&
    typeof o.createdAt === 'string'
  );
}

function parseSavedFilters(raw: string): SavedFilter[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedFilter);
  } catch {
    return [];
  }
}

function loadAll(): SavedFilter[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? parseSavedFilters(raw) : [];
}

function saveAll(data: SavedFilter[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const savedFiltersAdapter = {
  /** List saved filters for a page. */
  list(pageKey: string): SavedFilter[] {
    return loadAll()
      .filter((f) => f.pageKey === pageKey)
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  },

  /** Save current filters as a named view. */
  save(pageKey: string, name: string, filters: Record<string, unknown>): SavedFilter {
    const all = loadAll();
    const id = `sf_${Date.now()}`;
    const item: SavedFilter = {
      id,
      pageKey,
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    all.push(item);
    saveAll(all);
    return item;
  },

  /** Get a saved filter by ID. */
  get(id: string): SavedFilter | null {
    return loadAll().find((f) => f.id === id) ?? null;
  },

  /** Delete a saved filter. */
  delete(id: string): void {
    const all = loadAll().filter((f) => f.id !== id);
    saveAll(all);
  },
};
