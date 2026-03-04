import { useState, useEffect, useCallback } from 'react';
import { maintenanceAdapter, MAINTENANCE_CHANGED } from '../../../adapters';

/** Maintenance mode hook with global status subscription and toggle action. */
export function useAdminSystemMaintenance() {
  const [maintenance, setMaintenance] = useState(() => maintenanceAdapter.getStatus());

  useEffect(() => {
    const handler = () => setMaintenance(maintenanceAdapter.getStatus());
    window.addEventListener(MAINTENANCE_CHANGED, handler);
    return () => window.removeEventListener(MAINTENANCE_CHANGED, handler);
  }, []);

  const toggleMaintenance = useCallback(() => {
    maintenanceAdapter.setEnabled(!maintenance.enabled);
  }, [maintenance.enabled]);

  return { maintenance, toggleMaintenance };
}
