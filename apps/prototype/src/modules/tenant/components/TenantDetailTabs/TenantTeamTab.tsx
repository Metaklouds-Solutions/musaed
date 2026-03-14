/**
 * Tenant detail Team tab: members list with CSV import and pagination.
 */

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Upload } from 'lucide-react';
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
import type { TenantMemberRow } from '../../../../shared/types';

const PAGE_SIZE = 10;

interface TenantTeamTabProps {
  members: TenantMemberRow[];
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => line.split(',').map((cell) => cell.trim()));
}

/** Renders tenant team members with Add Member, Import CSV, and pagination. */
export function TenantTeamTab({ members }: TenantTeamTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<string[][] | null>(null);
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
    // Placeholder, no-op
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
      setParsedRows(rows);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleConfirmImport = () => {
    if (parsedRows) {
      console.log('CSV import confirmed:', parsedRows);
      setParsedRows(null);
    }
  };

  const handleCancelImport = () => {
    setParsedRows(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <Card variant="glass">
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
              accept=".csv,.xlsx"
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
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleConfirmImport}>
                      Confirm Import
                    </Button>
                    <Button variant="ghost" onClick={handleCancelImport}>
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
                        {paginatedMembers.map((m) => (
                          <TableRow
                            key={`${m.name}-${m.role}-${m.joined}`}
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
