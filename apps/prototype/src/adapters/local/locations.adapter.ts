/**
 * Locations adapter. Multi-location support per tenant. [PHASE-7-MULTI-LOCATION]
 */

import type { Location } from '../../shared/types/entities';

const LOCATIONS_KEY = 'clinic-crm-locations';

function isLocation(x: unknown): x is Location {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.tenantId === 'string' &&
    typeof o.name === 'string'
  );
}

function parseLocations(raw: string): Location[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocation);
  } catch {
    return [];
  }
}

function loadAll(): Location[] {
  const stored = localStorage.getItem(LOCATIONS_KEY);
  return stored ? parseLocations(stored) : [];
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

  async create(
    location: Omit<Location, 'id' | 'tenantId'>,
    tenantId: string,
  ): Promise<Location> {
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

  async update(
    id: string,
    patch: Partial<Omit<Location, 'id' | 'tenantId'>>,
    tenantId: string,
  ): Promise<Location | null> {
    const all = loadAll();
    const idx = all.findIndex((l) => l.id === id && l.tenantId === tenantId);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...patch };
    saveAll(all);
    return all[idx];
  },

  async remove(id: string, tenantId: string): Promise<boolean> {
    const all = loadAll();
    const next = all.filter((l) => !(l.id === id && l.tenantId === tenantId));
    if (next.length === all.length) return false;
    saveAll(next);
    return true;
  },
};
