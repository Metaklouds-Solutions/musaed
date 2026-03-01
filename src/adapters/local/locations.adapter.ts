/**
 * Locations adapter. Multi-location support per tenant. [PHASE-7-MULTI-LOCATION]
 */

import type { Location } from '../../shared/types/entities';

const LOCATIONS_KEY = 'clinic-crm-locations';

function loadAll(): Location[] {
  try {
    const stored = localStorage.getItem(LOCATIONS_KEY);
    return stored ? (JSON.parse(stored) as Location[]) : [];
  } catch {
    return [];
  }
}

function saveAll(locations: Location[]): void {
  try {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  } catch {
    // ignore
  }
}

function nextId(locations: Location[]): string {
  const max = locations.reduce((m, l) => {
    const n = parseInt(l.id.replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `loc_${String(max + 1).padStart(3, '0')}`;
}

export const locationsAdapter = {
  getByTenant(tenantId: string): Location[] {
    return loadAll().filter((l) => l.tenantId === tenantId);
  },

  create(location: Omit<Location, 'id' | 'tenantId'>, tenantId: string): Location {
    const all = loadAll();
    const created: Location = {
      ...location,
      id: nextId(all),
      tenantId,
    };
    all.push(created);
    saveAll(all);
    return created;
  },

  update(id: string, patch: Partial<Omit<Location, 'id' | 'tenantId'>>): Location | null {
    const all = loadAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...patch };
    saveAll(all);
    return all[idx];
  },

  remove(id: string): boolean {
    const all = loadAll().filter((l) => l.id !== id);
    if (all.length === loadAll().length) return false;
    saveAll(all);
    return true;
  },
};
