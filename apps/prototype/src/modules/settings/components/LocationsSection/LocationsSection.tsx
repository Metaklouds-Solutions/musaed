/**
 * Multi-location section. Manage clinic branches. [PHASE-7-MULTI-LOCATION]
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../shared/ui';
import { locationsAdapter } from '../../../../adapters';
import type { Location } from '../../../../shared/types/entities';
import { MapPin, Plus, Trash2 } from 'lucide-react';

const inputClass =
  'w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

interface LocationsSectionProps {
  tenantId: string | undefined;
}

export function LocationsSection({ tenantId }: LocationsSectionProps) {
  const [locations, setLocations] = useState<Location[]>(() =>
    tenantId ? locationsAdapter.getByTenant(tenantId) : []
  );
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newHours, setNewHours] = useState('');

  const refresh = useCallback(() => {
    if (tenantId) setLocations(locationsAdapter.getByTenant(tenantId));
  }, [tenantId]);

  const handleAdd = useCallback(async () => {
    if (!tenantId || !newName.trim()) return;
    try {
      await locationsAdapter.create(
        {
          name: newName.trim(),
          address: newAddress.trim() || undefined,
          phone: newPhone.trim() || undefined,
          hours: newHours.trim() || undefined,
        },
        tenantId
      );
      setNewName('');
      setNewAddress('');
      setNewPhone('');
      setNewHours('');
      setAdding(false);
      refresh();
    } catch {
      toast.error('Could not save location');
    }
  }, [tenantId, newName, newAddress, newPhone, newHours, refresh]);

  const handleRemove = useCallback(
    async (id: string) => {
      if (!tenantId) return;
      try {
        await locationsAdapter.remove(id, tenantId);
        refresh();
      } catch {
        toast.error('Could not remove location');
      }
    },
    [refresh, tenantId]
  );

  if (!tenantId) return null;

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <MapPin size={18} aria-hidden />
        Locations
      </h3>
      <p className="text-sm text-[var(--text-muted)]">
        Manage clinic branches. Add locations for multi-site practices.
      </p>
      <div className="space-y-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="flex items-start justify-between gap-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-primary)]">{loc.name}</p>
              {loc.address && (
                <p className="text-sm text-[var(--text-muted)] mt-0.5">{loc.address}</p>
              )}
              {loc.phone && (
                <p className="text-sm text-[var(--text-muted)]">{loc.phone}</p>
              )}
              {loc.hours && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{loc.hours}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleRemove(loc.id)}
              aria-label={`Remove ${loc.name}`}
            >
              <Trash2 size={16} aria-hidden />
            </Button>
          </div>
        ))}
        {adding && (
          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Location name"
              className={inputClass}
              autoFocus
            />
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Address"
              className={inputClass}
            />
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Phone"
              className={inputClass}
            />
            <input
              type="text"
              value={newHours}
              onChange={(e) => setNewHours(e.target.value)}
              placeholder="Hours (e.g. Mon–Fri 9am–5pm)"
              className={inputClass}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newName.trim()}>
                Add Location
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        {!adding && (
          <Button variant="outline" onClick={() => setAdding(true)} aria-label="Add location">
            <Plus size={16} aria-hidden />
            Add Location
          </Button>
        )}
      </div>
    </div>
  );
}
