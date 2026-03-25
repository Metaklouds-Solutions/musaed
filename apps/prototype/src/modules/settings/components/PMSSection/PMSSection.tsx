/**
 * PMS integration section. Connect to practice management systems (Athena, Epic, etc.). Stubs only.
 */

import { useState, useCallback } from 'react';
import { PopoverSelect, Button } from '../../../../shared/ui';
import { pmsAdapter } from '../../../../adapters';
import type { PmsProvider, PmsConnectionConfig } from '../../../../adapters/local/pms.adapter';
import { Plug, RefreshCw, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';

const PROVIDER_OPTIONS = [
  { value: 'athena', label: 'Athena Health' },
  { value: 'epic', label: 'Epic' },
  { value: 'cerner', label: 'Cerner' },
  { value: 'custom', label: 'Custom' },
];

function isPmsProvider(s: unknown): s is PmsProvider {
  return s === 'athena' || s === 'epic' || s === 'cerner' || s === 'custom';
}

function toPmsProvider(s: unknown): PmsProvider {
  return isPmsProvider(s) ? s : 'athena';
}

interface PMSSectionProps {
  tenantId: string | undefined;
}

export function PMSSection({ tenantId }: PMSSectionProps) {
  const [config, setConfig] = useState<PmsConnectionConfig | null>(() =>
    tenantId ? pmsAdapter.getConfig(tenantId) : null
  );
  const [syncing, setSyncing] = useState(false);

  const handleConnect = useCallback(async () => {
    if (!tenantId) return;
    const provider = toPmsProvider(config?.provider ?? 'athena');
    try {
      setConfig(await pmsAdapter.connect(provider, tenantId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to connect PMS';
      toast.error(message);
    }
  }, [tenantId, config?.provider]);

  const handleDisconnect = useCallback(async () => {
    if (!tenantId) return;
    try {
      setConfig(await pmsAdapter.disconnect(tenantId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to disconnect PMS';
      toast.error(message);
    }
  }, [tenantId]);

  const handleSync = useCallback(
    (type: 'patients' | 'appointments') => {
      if (!tenantId || config?.status !== 'connected') return;
      setSyncing(true);
      const fn = type === 'patients' ? pmsAdapter.syncPatients : pmsAdapter.syncAppointments;
      fn(tenantId)
        .then(() => {
          setConfig(pmsAdapter.getConfig(tenantId));
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : `Failed to sync ${type}`;
          toast.error(message);
        })
        .finally(() => {
          setSyncing(false);
        });
    },
    [tenantId, config?.status]
  );

  if (!tenantId) return null;

  const isConnected = config?.status === 'connected';
  const provider = toPmsProvider(config?.provider ?? 'athena');

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Plug size={18} aria-hidden />
        Practice Management (PMS)
      </h3>
      <p className="text-sm text-[var(--text-muted)]">
        Connect to your PMS to sync patients and appointments. Integration stubs — real API wiring coming later.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Provider</label>
          <PopoverSelect
            value={provider}
            onChange={(v) => {
              const p = toPmsProvider(v);
              setConfig((c) => (c ? { ...c, provider: p } : { provider: p, status: 'disconnected' }));
            }}
            options={PROVIDER_OPTIONS}
            placeholder="Select provider"
            title="PMS Provider"
            aria-label="PMS provider"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isConnected ? (
            <>
              <Button onClick={() => void handleDisconnect()} variant="outline" aria-label="Disconnect PMS">
                <Unlink size={16} aria-hidden />
                Disconnect
              </Button>
              <Button
                onClick={() => handleSync('patients')}
                disabled={syncing}
                variant="outline"
                aria-label="Sync patients"
              >
                <RefreshCw size={16} aria-hidden className={syncing ? 'animate-spin' : ''} />
                Sync Patients
              </Button>
              <Button
                onClick={() => handleSync('appointments')}
                disabled={syncing}
                variant="outline"
                aria-label="Sync appointments"
              >
                <RefreshCw size={16} aria-hidden className={syncing ? 'animate-spin' : ''} />
                Sync Appointments
              </Button>
            </>
          ) : (
            <Button onClick={() => void handleConnect()} aria-label="Connect PMS">
              <Link2 size={16} aria-hidden />
              Connect
            </Button>
          )}
        </div>
        {isConnected && config?.lastSyncAt && (
          <p className="text-xs text-[var(--text-muted)]">
            Last sync: {new Date(config.lastSyncAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
