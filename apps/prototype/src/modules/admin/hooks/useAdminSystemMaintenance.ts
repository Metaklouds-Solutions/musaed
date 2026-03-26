import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { maintenanceAdapter, MAINTENANCE_CHANGED } from '../../../adapters';

/** Maintenance mode hook with global status subscription and toggle action. */
export function useAdminSystemMaintenance() {
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string }>(
    { enabled: false, message: '' },
  );

  useEffect(() => {
    Promise.resolve(maintenanceAdapter.getStatus())
      .then((value) => setMaintenance(value))
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load maintenance status';
        toast.error(message);
      });
  }, []);

  useEffect(() => {
    const handler = () => {
      Promise.resolve(maintenanceAdapter.getStatus())
        .then((value) => setMaintenance(value))
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to refresh maintenance status';
          toast.error(message);
        });
    };
    window.addEventListener(MAINTENANCE_CHANGED, handler);
    return () => window.removeEventListener(MAINTENANCE_CHANGED, handler);
  }, []);

  const toggleMaintenance = useCallback(() => {
    maintenanceAdapter.setEnabled(!maintenance.enabled);
  }, [maintenance.enabled]);

  return { maintenance, toggleMaintenance };
}
