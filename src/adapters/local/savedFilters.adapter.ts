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

function loadAll(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedFilter[]) : [];
  } catch {
    return [];
  }
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
