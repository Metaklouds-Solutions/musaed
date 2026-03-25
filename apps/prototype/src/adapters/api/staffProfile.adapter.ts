/**
 * Provider availability matrix stored under tenant.settings.providerAvailability.
 */

import { api } from '../../lib/apiClient';
import type { StaffProfile } from '../../shared/types/entities';
import {
  getCachedProviderAvailability,
  setCachedProviderAvailability,
} from './tenantSettingsCache';

type AvailabilitySlot = { day: string; start: string; end: string };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isAvailabilitySlot(x: unknown): x is AvailabilitySlot {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return typeof o.day === 'string' && typeof o.start === 'string' && typeof o.end === 'string';
}

export const staffProfileAdapter = {
  /**
   * Builds profiles for the given user IDs using cached provider availability.
   * Pass `userIds` from tenant staff (API mode); local mode can omit to use seed merge.
   */
  getProfiles(tenantId: string, userIds?: string[]): StaffProfile[] {
    const pa = getCachedProviderAvailability(tenantId);
    const ids =
      userIds && userIds.length > 0
        ? userIds
        : Object.keys(pa).filter((k) => typeof k === 'string' && k.length > 0);

    return ids.map((userId) => {
      const row = pa[userId];
      let availability: AvailabilitySlot[] = [];
      if (isRecord(row) && Array.isArray(row.availability)) {
        availability = row.availability.filter(isAvailabilitySlot);
      }
      return {
        userId,
        tenantId,
        availability,
        specialties: [],
      };
    });
  },

  async updateProfile(
    userId: string,
    tenantId: string,
    availability: AvailabilitySlot[],
  ): Promise<void> {
    const pa = { ...getCachedProviderAvailability(tenantId) };
    pa[userId] = { availability };
    setCachedProviderAvailability(tenantId, pa);
    await api.patch('/tenant/settings', { providerAvailability: pa });
  },
};
