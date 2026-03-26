/**
 * Provider availability matrix. Rows = providers (doctors), columns = days.
 * Edit time ranges per day; used for appointment scheduling.
 */

import { useState, useCallback, useMemo } from 'react';
import { staffAdapter, staffProfileAdapter } from '../../../../adapters';
import { useAsyncData } from '../../../../shared/hooks/useAsyncData';
import {
  Button,
} from '../../../../shared/ui';
import { CalendarCheck2, ChevronDown, Copy, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { StaffProfile } from '../../../../shared/types/entities';
import { ProviderDayCell } from './ProviderDayCell';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

interface ProviderAvailabilitySectionProps {
  tenantId: string | undefined;
  onSaved?: () => void;
  readOnly?: boolean;
}

type Slot = { start: string; end: string } | null;
type DraftMap = Record<string, Record<string, Slot>>;

function isValidSlot(slot: Slot): boolean {
  if (!slot) return true;
  if (!slot.start || !slot.end) return false;
  return slot.start < slot.end;
}

function summarizeProvider(
  userId: string,
  days: readonly string[],
  getSlot: (userId: string, day: string) => Slot,
): string {
  const active = days.filter((day) => getSlot(userId, day));
  if (active.length === 0) return 'No weekly schedule';
  return `${active.length} day${active.length === 1 ? '' : 's'} configured`;
}

export function ProviderAvailabilitySection({
  tenantId,
  onSaved,
  readOnly = false,
}: ProviderAvailabilitySectionProps) {
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: staffList } = useAsyncData(
    () => (tenantId ? staffAdapter.list(tenantId) : []),
    [tenantId, refreshKey],
    []
  );
  const staff = useMemo(
    () => (Array.isArray(staffList) ? staffList.filter((s) => s.roleSlug === 'doctor' || s.roleSlug === 'tenant_owner') : []),
    [staffList]
  );
  const profiles = useMemo(
    () =>
      tenantId ? staffProfileAdapter.getProfiles(tenantId, staff.map((s) => s.userId)) : [],
    [tenantId, staff, refreshKey]
  );

  const profileMap = useMemo(() => {
    const m = new Map<string, StaffProfile>();
    for (const p of profiles) m.set(p.userId, p);
    return m;
  }, [profiles]);

  const providers = useMemo(() => {
    const seen = new Set<string>();
    const result: { userId: string; name: string }[] = [];
    for (const s of staff) {
      if (seen.has(s.userId)) continue;
      seen.add(s.userId);
      result.push({ userId: s.userId, name: s.name });
    }
    for (const p of profiles) {
      if (seen.has(p.userId)) continue;
      seen.add(p.userId);
      const staffRow = staff.find((s) => s.userId === p.userId);
      result.push({ userId: p.userId, name: staffRow?.name ?? p.userId });
    }
    return result;
  }, [staff, profiles]);

  const getSlot = useCallback(
    (userId: string, day: string): { start: string; end: string } | null => {
      const p = profileMap.get(userId);
      const av = p?.availability?.find((a) => a.day === day);
      if (!av) return null;
      return { start: av.start, end: av.end };
    },
    [profileMap]
  );

  const [draft, setDraft] = useState<DraftMap>({});
  const getDraftSlot = (userId: string, day: string): Slot => {
    return draft[userId]?.[day] ?? getSlot(userId, day);
  };

  const setDraftSlot = useCallback((userId: string, day: string, value: Slot) => {
      setDraft((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [day]: value,
        },
      }));
  }, []);

  const hasInvalid = useMemo(() => {
    return providers.some((prov) =>
      DAYS.some((day) => !isValidSlot(getDraftSlot(prov.userId, day))),
    );
  }, [providers, draft, profileMap]);

  const isDirty = useMemo(() => Object.keys(draft).length > 0, [draft]);

  const applyToWeekdays = useCallback((userId: string) => {
    const monday = getDraftSlot(userId, 'mon');
    setDraft((prev) => {
      const next = { ...(prev[userId] ?? {}) };
      for (const day of ['mon', 'tue', 'wed', 'thu', 'fri']) {
        next[day] = monday ? { ...monday } : null;
      }
      return { ...prev, [userId]: next };
    });
  }, [getDraftSlot]);

  const copyMondayToAll = useCallback((userId: string) => {
    const monday = getDraftSlot(userId, 'mon');
    setDraft((prev) => {
      const next = { ...(prev[userId] ?? {}) };
      for (const day of DAYS) {
        next[day] = monday ? { ...monday } : null;
      }
      return { ...prev, [userId]: next };
    });
  }, [getDraftSlot]);

  const clearWeek = useCallback((userId: string) => {
    setDraft((prev) => {
      const next = { ...(prev[userId] ?? {}) };
      for (const day of DAYS) {
        next[day] = null;
      }
      return { ...prev, [userId]: next };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!tenantId || readOnly || hasInvalid || isSaving) return;
    setIsSaving(true);
    try {
      for (const prov of providers) {
        const slots: Array<{ day: string; start: string; end: string }> = [];
        for (const day of DAYS) {
          const v = getDraftSlot(prov.userId, day);
          if (v && v.start && v.end && v.start < v.end) {
            slots.push({ day, start: v.start, end: v.end });
          }
        }
        await staffProfileAdapter.updateProfile(prov.userId, tenantId, slots);
      }
      setDraft({});
      setRefreshKey((k) => k + 1);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Provider availability saved');
      onSaved?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save provider availability';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [tenantId, readOnly, hasInvalid, isSaving, providers, getDraftSlot, onSaved]);

  if (!tenantId) return null;

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Provider Availability</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Set weekly schedules for each provider. These times are used for booking and agent slot checks.
          </p>
        </div>
        <Button
          onClick={() => void handleSave()}
          disabled={readOnly || !isDirty || hasInvalid || isSaving}
          loading={isSaving}
          className="shrink-0 flex items-center gap-2"
          aria-label={saved ? 'Saved' : 'Save availability'}
        >
          <Save size={18} aria-hidden />
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
      {readOnly && (
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-lg p-3">
          Availability is read-only in admin context.
        </div>
      )}
      {hasInvalid && (
        <div className="text-xs text-red-500 bg-red-500/10 rounded-lg p-3">
          Some time ranges are invalid. End time must be after start time.
        </div>
      )}

      {providers.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-4">
          No providers in this clinic. Add staff with Doctor role first.
        </p>
      ) : (
        <div className="space-y-3">
          {providers.map((prov) => {
            const open = expanded[prov.userId] ?? false;
            return (
              <div key={prov.userId} className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [prov.userId]: !open }))
                  }
                >
                  <div className="text-left">
                    <p className="font-medium text-[var(--text-primary)]">{prov.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {summarizeProvider(prov.userId, DAYS, getDraftSlot)}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="p-4 space-y-4">
                    {!readOnly && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="text-xs"
                          onClick={() => applyToWeekdays(prov.userId)}
                        >
                          <CalendarCheck2 size={14} />
                          Apply Mon to Weekdays
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-xs"
                          onClick={() => copyMondayToAll(prov.userId)}
                        >
                          <Copy size={14} />
                          Copy Mon to All
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => clearWeek(prov.userId)}
                        >
                          <Trash2 size={14} />
                          Clear Week
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {DAYS.map((day) => (
                        <div key={day} className="space-y-1">
                          <p className="text-xs font-medium text-[var(--text-secondary)] text-center">
                            {DAY_LABELS[day]}
                          </p>
                          <ProviderDayCell
                            value={getDraftSlot(prov.userId, day)}
                            onChange={(v) => setDraftSlot(prov.userId, day, v)}
                            disabled={readOnly}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
