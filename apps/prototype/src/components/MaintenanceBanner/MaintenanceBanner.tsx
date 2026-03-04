/**
 * Maintenance mode banner. Shown at top when admin enables maintenance.
 */

import { useState, useEffect } from 'react';
import { maintenanceAdapter, MAINTENANCE_CHANGED } from '../../adapters';
import { Wrench } from 'lucide-react';

export function MaintenanceBanner() {
  const [status, setStatus] = useState(() => maintenanceAdapter.getStatus());

  useEffect(() => {
    const handler = () => setStatus(maintenanceAdapter.getStatus());
    window.addEventListener(MAINTENANCE_CHANGED, handler);
    return () => window.removeEventListener(MAINTENANCE_CHANGED, handler);
  }, []);

  if (!status.enabled) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[var(--warning)]/15 text-[var(--warning)] border-b border-[var(--warning)]/30"
    >
      <Wrench size={18} className="shrink-0" aria-hidden />
      <span>{status.message}</span>
    </div>
  );
}
