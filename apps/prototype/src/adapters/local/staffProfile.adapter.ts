/**
 * Staff profile adapter. Provider availability (doctor schedules).
 * Merges seed data with localStorage overrides.
 */

import { seedStaffProfiles } from '../../mock/seedData';
import type { StaffProfile } from '../../shared/types/entities';

const OVERRIDE_KEY_PREFIX = 'clinic-crm-staff-profile-override-';

type AvailabilitySlot = { day: string; start: string; end: string };

function isAvailabilitySlot(x: unknown): x is AvailabilitySlot {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return typeof o.day === 'string' && typeof o.start === 'string' && typeof o.end === 'string';
}

function parseOverrides(raw: string): Record<string, { availability?: AvailabilitySlot[] }> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const result: Record<string, { availability?: AvailabilitySlot[] }> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const o = v as Record<string, unknown>;
        const availability = Array.isArray(o.availability)
          ? o.availability.filter(isAvailabilitySlot)
          : undefined;
        result[k] = availability ? { availability } : {};
      }
    }
    return result;
  } catch {
    return {};
  }
}

function loadOverrides(tenantId: string): Record<string, { availability?: AvailabilitySlot[] }> {
  const stored = localStorage.getItem(`${OVERRIDE_KEY_PREFIX}${tenantId}`);
  return stored ? parseOverrides(stored) : {};
}

function saveOverrides(tenantId: string, overrides: Record<string, { availability?: AvailabilitySlot[] }>): void {
  localStorage.setItem(`${OVERRIDE_KEY_PREFIX}${tenantId}`, JSON.stringify(overrides));
}

export const staffProfileAdapter = {
  /** Get staff profiles for tenant (seed + overrides). Used by calendar/availability. */
  getProfiles(tenantId: string, userIds?: string[]): StaffProfile[] {
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

    if (userIds && userIds.length > 0) {
      const allow = new Set(userIds);
      return result.filter((p) => allow.has(p.userId));
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
