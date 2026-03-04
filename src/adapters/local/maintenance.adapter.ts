/**
 * Maintenance mode adapter. Admin can enable/disable; banner shown to all users.
 */

const MAINTENANCE_KEY = 'clinic-crm-maintenance';
const MAINTENANCE_MESSAGE_KEY = 'clinic-crm-maintenance-message';

export const MAINTENANCE_CHANGED = 'clinic-crm-maintenance-changed';

function load(): { enabled: boolean; message: string } {
  try {
    const stored = localStorage.getItem(MAINTENANCE_KEY);
    const msg = localStorage.getItem(MAINTENANCE_MESSAGE_KEY);
    return {
      enabled: stored === 'true',
      message: msg ?? 'System maintenance in progress. Some features may be temporarily unavailable.',
    };
  } catch {
    return { enabled: false, message: '' };
  }
}

function save(enabled: boolean, message: string): void {
  try {
    localStorage.setItem(MAINTENANCE_KEY, String(enabled));
    localStorage.setItem(MAINTENANCE_MESSAGE_KEY, message);
    window.dispatchEvent(new CustomEvent(MAINTENANCE_CHANGED));
  } catch {
    // ignore
  }
}

export const maintenanceAdapter = {
  isEnabled(): boolean {
    return load().enabled;
  },

  getMessage(): string {
    return load().message;
  },

  getStatus(): { enabled: boolean; message: string } {
    return load();
  },

  setEnabled(enabled: boolean, message?: string): void {
    const current = load();
    save(enabled, message ?? current.message);
  },

  setMessage(message: string): void {
    const current = load();
    save(current.enabled, message);
  },
};
