/**
 * API export adapter. Fetches CSV from backend and triggers download.
 */

import { getAccessToken } from '../../lib/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

async function downloadFromApi(path: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';
  const keys: (keyof T)[] = columns
    ? columns.map((c) => c.key)
    : (Object.keys(data[0]) as (keyof T)[]);
  const headers = columns ? columns.map((c) => c.header) : keys;
  const headerRow = headers.map(escapeCsvValue).join(',');
  const rows = data.map((row) =>
    keys.map((k) => escapeCsvValue(row[k])).join(',')
  );
  return [headerRow, ...rows].join('\n');
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STAFF_FILENAME = `staff-${new Date().toISOString().slice(0, 10)}.csv`;
const TICKETS_FILENAME = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
const TENANTS_FILENAME = `tenants-${new Date().toISOString().slice(0, 10)}.csv`;

export const exportAdapter = {
  exportCsv<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; header: string }[]
  ): void {
    const csv = toCsv(data, columns);
    if (!csv) return;
    downloadCsv(csv, filename);
  },

  /** Fetches staff CSV from backend. Rows param ignored in API mode. */
  exportStaffCsv(_rows?: Record<string, unknown>[]): Promise<void> {
    return downloadFromApi('/tenant/export/staff', STAFF_FILENAME);
  },

  /** Fetches tickets CSV from backend. Rows param ignored in API mode. */
  exportTicketsCsv(_rows?: Record<string, unknown>[]): Promise<void> {
    return downloadFromApi('/tenant/export/tickets', TICKETS_FILENAME);
  },

  /** Fetches tenants CSV from backend. Rows param ignored in API mode. */
  exportTenantsCsv(_rows?: Record<string, unknown>[]): Promise<void> {
    return downloadFromApi('/admin/export/tenants', TENANTS_FILENAME);
  },
};
