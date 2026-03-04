/**
 * CSV export adapter. Converts array of objects to CSV and triggers download.
 */

/**
 * Escape a value for CSV (handles commas, quotes, newlines).
 */
function escapeCsvValue(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array of objects to CSV string.
 * Uses first object's keys as headers.
 */
export function toCsv<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';
  const keys: (keyof T)[] = columns
    ? columns.map((c) => c.key)
    : (Object.keys(data[0]) as (keyof T)[]);
  const headers = columns
    ? columns.map((c) => c.header)
    : keys;
  const headerRow = headers.map(escapeCsvValue).join(',');
  const rows = data.map((row) =>
    keys.map((k) => escapeCsvValue(row[k])).join(',')
  );
  return [headerRow, ...rows].join('\n');
}

/**
 * Trigger browser download of CSV file.
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV and download.
 */
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
};
