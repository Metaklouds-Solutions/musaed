/**
 * Multi-location support backed by tenant.settings.locations.
 */

import { api } from '../../lib/apiClient';
import type { Location } from '../../shared/types/entities';
import { getCachedLocations, setCachedLocations } from './tenantSettingsCache';

function nextId(locations: Location[]): string {
  const max = locations.reduce((m, l) => {
    const n = parseInt(l.id.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `loc_${String(max + 1).padStart(3, '0')}`;
}

async function persist(tenantId: string, locations: Location[]): Promise<void> {
  setCachedLocations(tenantId, locations);
  const payload = locations.map((l) => ({
    id: l.id,
    name: l.name,
    address: l.address,
    phone: l.phone,
    hours: l.hours,
  }));
  await api.patch('/tenant/settings', { locations: payload });
}

export const locationsAdapter = {
  getByTenant(tenantId: string): Location[] {
    return [...getCachedLocations(tenantId)];
  },

  async create(
    location: Omit<Location, 'id' | 'tenantId'>,
    tenantId: string,
  ): Promise<Location> {
    const all = getCachedLocations(tenantId);
    const created: Location = {
      ...location,
      id: nextId(all),
      tenantId,
    };
    await persist(tenantId, [...all, created]);
    return created;
  },

  async update(
    id: string,
    patch: Partial<Omit<Location, 'id' | 'tenantId'>>,
    tenantId: string,
  ): Promise<Location | null> {
    const all = getCachedLocations(tenantId);
    const idx = all.findIndex((l) => l.id === id && l.tenantId === tenantId);
    if (idx < 0) return null;
    const next = [...all];
    next[idx] = { ...next[idx], ...patch };
    await persist(tenantId, next);
    return next[idx];
  },

  async remove(id: string, tenantId: string): Promise<boolean> {
    const all = getCachedLocations(tenantId);
    const next = all.filter((l) => l.id !== id);
    if (next.length === all.length) return false;
    await persist(tenantId, next);
    return true;
  },
};
