/**
 * Staff profile adapter. Provider availability (doctor schedules).
 * Merges seed data with localStorage overrides.
 */

import { seedStaffProfiles } from '../../mock/seedData';
import type { StaffProfile } from '../../shared/types/entities';

const OVERRIDE_KEY_PREFIX = 'clinic-crm-staff-profile-override-';

type AvailabilitySlot = { day: string; start: string; end: string };

function loadOverrides(tenantId: string): Record<string, { availability?: AvailabilitySlot[] }> {
  try {
    const stored = localStorage.getItem(`${OVERRIDE_KEY_PREFIX}${tenantId}`);
    if (!stored) return {};
    return JSON.parse(stored) as Record<string, { availability?: AvailabilitySlot[] }>;
  } catch {
    return {};
  }
}

function saveOverrides(tenantId: string, overrides: Record<string, { availability?: AvailabilitySlot[] }>): void {
  localStorage.setItem(`${OVERRIDE_KEY_PREFIX}${tenantId}`, JSON.stringify(overrides));
}

export const staffProfileAdapter = {
  /** Get staff profiles for tenant (seed + overrides). Used by calendar/availability. */
  getProfiles(tenantId: string): StaffProfile[] {
    const fromSeed = seedStaffProfiles.filter((p) => p.tenantId === tenantId);
    const overrides = loadOverrides(tenantId);

    const result: StaffProfile[] = [];
    const seen = new Set<string>();

    for (const p of fromSeed) {
      seen.add(p.userId);
      const o = overrides[p.userId];
      result.push({
        ...p,
        availability: o?.availability ?? p.availability,
      });
    }

    for (const [userId, o] of Object.entries(overrides)) {
      if (seen.has(userId)) continue;
      result.push({
        userId,
        tenantId,
        availability: o.availability,
        specialties: [],
      });
    }

    return result;
  },

  /** Update availability for a provider. */
  updateProfile(userId: string, tenantId: string, availability: AvailabilitySlot[]): void {
    const overrides = loadOverrides(tenantId);
    overrides[userId] = { ...overrides[userId], availability };
    saveOverrides(tenantId, overrides);
  },
};
