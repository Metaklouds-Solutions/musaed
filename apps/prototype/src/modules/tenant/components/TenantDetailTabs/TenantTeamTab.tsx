/**
 * Tenant detail Team tab: members list with CSV import and pagination.
 */

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardBody,
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PillTag,
  Button,
  Pagination,
} from '../../../../shared/ui';
import { AddStaffModal } from '../../../shared/staff';
import { staffAdapter } from '../../../../adapters';
import type { TenantMemberRow } from '../../../../shared/types';

const PAGE_SIZE = 10;

interface TenantTeamTabProps {
  members: TenantMemberRow[];
  tenantId: string | null;
  onChanged?: () => void;
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => line.split(',').map((cell) => cell.trim()));
}

/** Renders tenant team members with Add Member, Import CSV, and pagination. */
type CsvMemberRow = {
  rowNumber: number;
  name: string;
  email: string;
  roleSlug: string;
};

type CsvRowError = {
  rowNumber: number;
  raw: string[];
  reason: string;
};

type ImportAttemptResult = {
  rowNumber: number;
  email: string;
  status: 'created' | 'failed';
  reason?: string;
};

const ALLOWED_ROLE_SLUGS = new Set([
  'tenant_owner',
  'clinic_admin',
  'doctor',
  'receptionist',
  'auditor',
  'tenant_staff',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function parseRoleSlug(raw: string): string {
  const value = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    'tenant owner': 'tenant_owner',
    tenant_owner: 'tenant_owner',
    owner: 'tenant_owner',
    'clinic admin': 'clinic_admin',
    clinic_admin: 'clinic_admin',
    doctor: 'doctor',
    receptionist: 'receptionist',
    auditor: 'auditor',
    staff: 'tenant_staff',
    tenant_staff: 'tenant_staff',
  };
  return map[value] ?? 'tenant_staff';
}

function validateAndMapCsvRows(rows: string[][]): {
  valid: CsvMemberRow[];
  errors: CsvRowError[];
} {
  if (rows.length === 0) {
    return { valid: [], errors: [] };
  }
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const nameIndex = header.findIndex((h) => h === 'name' || h === 'full_name');
  const emailIndex = header.findIndex((h) => h === 'email' || h === 'email_address');
  const roleIndex = header.findIndex((h) => h === 'role' || h === 'role_slug');

  const seenEmails = new Set<string>();
  const valid: CsvMemberRow[] = [];
  const errors: CsvRowError[] = [];

  dataRows.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const name = (nameIndex >= 0 ? row[nameIndex] : row[0] ?? '').trim();
      const email = (emailIndex >= 0 ? row[emailIndex] : row[1] ?? '').trim().toLowerCase();
      const roleRaw = (roleIndex >= 0 ? row[roleIndex] : row[2] ?? '').trim();
      const roleSlug = parseRoleSlug(roleRaw);

      if (name.length === 0) {
        errors.push({ rowNumber, raw: row, reason: 'Missing name' });
        return;
      }
      if (!EMAIL_RE.test(email)) {
        errors.push({ rowNumber, raw: row, reason: 'Invalid email address' });
        return;
      }
      if (!ALLOWED_ROLE_SLUGS.has(roleSlug)) {
        errors.push({ rowNumber, raw: row, reason: `Invalid role: ${roleRaw || 'empty'}` });
        return;
      }
      if (seenEmails.has(email)) {
        errors.push({ rowNumber, raw: row, reason: 'Duplicate email in CSV' });
        return;
      }
      seenEmails.add(email);
      valid.push({
        rowNumber,
        name,
        email,
        roleSlug,
      });
  });

  return { valid, errors };
}

export function TenantTeamTab({ members, tenantId, onChanged }: TenantTeamTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<string[][] | null>(null);
  const [csvMembers, setCsvMembers] = useState<CsvMemberRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<CsvRowError[]>([]);
  const [importing, setImporting] = useState(false);
  const [lastImportResults, setLastImportResults] = useState<ImportAttemptResult[] | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedMembers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return members.slice(start, start + PAGE_SIZE);
  }, [members, safePage]);

  useEffect(() => {
    if (page > totalPages && totalPages >= 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handleAddMember = () => {
    setAddModalOpen(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCSV(text);
      const { valid, errors } = validateAndMapCsvRows(rows);
      if (valid.length === 0 && errors.length === 0) {
        toast.error('CSV is empty');
        return;
      }
      setParsedRows(rows);
      setCsvMembers(valid);
      setCsvErrors(errors);
      setLastImportResults(null);
      if (errors.length > 0) {
        toast.warning(`Found ${errors.length} invalid row${errors.length === 1 ? '' : 's'}. Review before import.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!tenantId || csvMembers.length === 0) return;
    setImporting(true);
    try {
      const results: ImportAttemptResult[] = [];
      for (const row of csvMembers) {
        try {
          await Promise.resolve(
            staffAdapter.add({
              name: row.name,
              email: row.email,
              roleSlug: row.roleSlug,
              tenantId,
            }),
          );
          results.push({
            rowNumber: row.rowNumber,
            email: row.email,
            status: 'created',
          });
        } catch (error) {
          results.push({
            rowNumber: row.rowNumber,
            email: row.email,
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Failed to create staff',
          });
        }
      }
      setLastImportResults(results);
      const created = results.filter((r) => r.status === 'created').length;
      const failed = results.length - created;
      if (created === 0) {
        toast.error('No staff were imported. Check the report below.');
        return;
      }
      toast.success(
        `Imported ${created} staff member${created === 1 ? '' : 's'}${failed > 0 ? ` (${failed} failed)` : ''}`,
      );
      onChanged?.();
    } finally {
      setImporting(false);
    }
  }, [csvMembers, onChanged, tenantId]);

  const handleCancelImport = () => {
    setParsedRows(null);
    setCsvMembers([]);
    setCsvErrors([]);
    setLastImportResults(null);
  };

  const handleAddStaff = useCallback(
    async (data: {
      name: string;
      email: string;
      roleSlug: string;
      tenantId: string;
    }) => {
      try {
        await Promise.resolve(staffAdapter.add(data));
        toast.success('Staff added');
        setAddModalOpen(false);
        onChanged?.();
      } catch {
        toast.error('Failed to add staff');
      }
    },
    [onChanged],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <Card variant="glass">
        {!!tenantId && (
          <AddStaffModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            tenantId={tenantId}
            onSubmit={handleAddStaff}
          />
        )}
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <Users className="w-5 h-5" aria-hidden />
            Team
            <span className="text-sm font-normal text-[var(--text-muted)]">
              ({members.length} {members.length === 1 ? 'member' : 'members'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleAddMember}>
              Add Member
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="w-4 h-4" aria-hidden />
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {members.length === 0 && !parsedRows ? (
            <div className="p-8 text-center">
              <p className="text-[var(--text-muted)] text-sm">No members yet.</p>
            </div>
          ) : (
            <>
              {parsedRows && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-b border-[var(--border-subtle)] p-4 space-y-4"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">Preview import</p>
                  <DataTable minWidth="min-w-[480px]" variant="plain">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {parsedRows[0]?.map((_, i) => (
                            <TableHead key={i}>Column {i + 1}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedRows.slice(0, 10).map((row, rowIdx) => (
                          <TableRow
                            key={rowIdx}
                            className="border-t border-[var(--border-subtle)]/50 first:border-t-0"
                          >
                            {row.map((cell, cellIdx) => (
                              <TableCell key={cellIdx} className="text-[var(--text-secondary)] text-sm">
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DataTable>
                  {parsedRows.length > 10 && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Showing first 10 of {parsedRows.length} rows
                    </p>
                  )}
                  <div className="text-xs text-[var(--text-muted)] space-y-1">
                    <p>Valid rows: {csvMembers.length}</p>
                    <p>Invalid rows: {csvErrors.length}</p>
                  </div>
                  {csvErrors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">Validation errors</p>
                      <div className="max-h-40 overflow-auto border border-[var(--border-subtle)] rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-[var(--bg-subtle)]">
                            <tr>
                              <th className="text-left px-2 py-1">Row</th>
                              <th className="text-left px-2 py-1">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvErrors.map((err) => (
                              <tr key={`${err.rowNumber}-${err.reason}`} className="border-t border-[var(--border-subtle)]/40">
                                <td className="px-2 py-1">{err.rowNumber}</td>
                                <td className="px-2 py-1">{err.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {lastImportResults && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">Import report</p>
                      <div className="max-h-44 overflow-auto border border-[var(--border-subtle)] rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-[var(--bg-subtle)]">
                            <tr>
                              <th className="text-left px-2 py-1">Row</th>
                              <th className="text-left px-2 py-1">Email</th>
                              <th className="text-left px-2 py-1">Status</th>
                              <th className="text-left px-2 py-1">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lastImportResults.map((result) => (
                              <tr key={`${result.rowNumber}-${result.email}`} className="border-t border-[var(--border-subtle)]/40">
                                <td className="px-2 py-1">{result.rowNumber}</td>
                                <td className="px-2 py-1">{result.email}</td>
                                <td className="px-2 py-1">{result.status}</td>
                                <td className="px-2 py-1">{result.reason ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => void handleConfirmImport()}
                      loading={importing}
                      disabled={importing || csvMembers.length === 0}
                    >
                      Confirm Import
                    </Button>
                    <Button variant="ghost" onClick={handleCancelImport} disabled={importing}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
              {members.length > 0 && (
                <>
                  <DataTable minWidth="min-w-[480px]" variant="plain">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMembers.map((m, idx) => (
                          <TableRow
                            key={`${m.name}-${m.role}-${m.joined}-${idx}`}
                            className="border-t border-[var(--border-subtle)]/50 first:border-t-0"
                          >
                            <TableCell className="font-medium text-[var(--text-primary)]">{m.name}</TableCell>
                            <TableCell className="text-[var(--text-secondary)]">{m.role}</TableCell>
                            <TableCell>
                              <PillTag variant={m.status === 'active' ? 'status' : 'invited'}>
                                {m.status}
                              </PillTag>
                            </TableCell>
                            <TableCell className="text-[var(--text-muted)] text-sm">{m.joined}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DataTable>
                  {totalPages > 1 && (
                    <div className="p-5 border-t border-[var(--border-subtle)]/40">
                      <Pagination
                        page={safePage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={members.length}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
