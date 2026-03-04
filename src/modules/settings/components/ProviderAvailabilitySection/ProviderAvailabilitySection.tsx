/**
 * Provider availability matrix. Rows = providers (doctors), columns = days.
 * Edit time ranges per day; used for appointment scheduling.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { staffAdapter, staffProfileAdapter } from '../../../../adapters';
import {
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from '../../../../shared/ui';
import { Save } from 'lucide-react';
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
}

export function ProviderAvailabilitySection({ tenantId, onSaved }: ProviderAvailabilitySectionProps) {
  const [saved, setSaved] = useState(false);

  const staff = useMemo(
    () => (tenantId ? staffAdapter.list(tenantId).filter((s) => s.roleSlug === 'doctor' || s.roleSlug === 'tenant_owner') : []),
    [tenantId]
  );
  const profiles = useMemo(
    () => (tenantId ? staffProfileAdapter.getProfiles(tenantId) : []),
    [tenantId]
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

  const [draft, setDraft] = useState<Record<string, Record<string, { start: string; end: string } | null>>>({});
  const getDraftSlot = (userId: string, day: string): { start: string; end: string } | null => {
    return draft[userId]?.[day] ?? getSlot(userId, day);
  };

  const setDraftSlot = useCallback(
    (userId: string, day: string, value: { start: string; end: string } | null) => {
      setDraft((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [day]: value,
        },
      }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!tenantId) return;
    for (const prov of providers) {
      const slots: Array<{ day: string; start: string; end: string }> = [];
      for (const day of DAYS) {
        const v = getDraftSlot(prov.userId, day);
        if (v && v.start && v.end) slots.push({ day, start: v.start, end: v.end });
      }
      staffProfileAdapter.updateProfile(prov.userId, tenantId, slots);
    }
    setDraft({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  }, [tenantId, providers, draft, getDraftSlot, onSaved]);

  if (!tenantId) return null;

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Provider Availability</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Set when each provider is available for appointments. Used by the booking calendar.
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="shrink-0 flex items-center gap-2"
          aria-label={saved ? 'Saved' : 'Save availability'}
        >
          <Save size={18} aria-hidden />
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>

      {providers.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-4">
          No providers in this clinic. Add staff with Doctor role first.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <DataTable minWidth="min-w-[640px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Provider</TableHead>
                  {DAYS.map((d) => (
                    <TableHead key={d} className="min-w-[90px] text-center">
                      {DAY_LABELS[d]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((prov) => (
                  <TableRow key={prov.userId}>
                    <TableCell className="font-medium text-[var(--text-primary)] py-3">
                      {prov.name}
                    </TableCell>
                    {DAYS.map((day) => (
                      <TableCell key={day} className="py-2">
                        <ProviderDayCell
                          userId={prov.userId}
                          day={day}
                          value={getDraftSlot(prov.userId, day)}
                          onChange={(v) => setDraftSlot(prov.userId, day, v)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        </div>
      )}
    </div>
  );
}
