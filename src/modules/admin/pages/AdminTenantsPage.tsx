/**
 * Admin Tenants: Tenant list and Compare Tenants views.
 * Tab switcher: Tenants | Compare Tenants.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Users, GitCompare, Archive } from 'lucide-react';
import {
  PageHeader,
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  ViewButton,
  PillTag,
  TableFilters,
} from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useAdminTenants } from '../hooks';
import { softDeleteAdapter } from '../../../adapters';
import { AddTenantModal } from '../components/AddTenantModal';
import { TenantComparisonView } from '../components/TenantComparisonView';

type ViewMode = 'list' | 'compare';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start, end };
})();

export function AdminTenantsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const { tenants } = useAdminTenants(refreshKey);
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [planFilter, setPlanFilter] = useState<string | null>(null);

  const filteredTenants = useMemo(() => {
    if (!planFilter) return tenants;
    return tenants.filter((t) => t.plan.toLowerCase() === planFilter.toLowerCase());
  }, [tenants, planFilter]);

  const plans = useMemo(() => {
    const set = new Set(tenants.map((t) => t.plan));
    return Array.from(set).map((p) => ({ value: p.toLowerCase(), label: p }));
  }, [tenants]);

  const handleAddSuccess = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleView = useCallback(
    (id: string) => () => navigate(`/admin/tenants/${id}`),
    [navigate]
  );

  const handleArchive = useCallback(
    (id: string) => () => {
      if (!window.confirm('Archive this tenant? They will be hidden from the list.')) return;
      softDeleteAdapter.softDeleteTenant(id);
      setRefreshKey((k) => k + 1);
      toast.success('Tenant archived');
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <PageHeader
            title="Tenants"
            description="Platform tenant list and performance comparison"
          />
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {viewMode === 'compare' && (
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                aria-label="Date range for comparison"
              />
            )}
            {viewMode === 'list' && (
              <Button onClick={() => setAddModalOpen(true)}>
                <UserPlus className="w-4 h-4" aria-hidden />
                Add Tenant
              </Button>
            )}
          </div>
        </div>

        {/* Tab switcher - polished pill design */}
        <div
          role="tablist"
          aria-label="View mode"
          className="inline-flex w-full sm:w-auto rounded-xl p-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm"
        >
          <button
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-[var(--bg-base)] text-[var(--text-primary)] shadow-md border border-[var(--border-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/50'
            }`}
          >
            <Users size={18} aria-hidden />
            Tenants
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'compare'}
            onClick={() => setViewMode('compare')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              viewMode === 'compare'
                ? 'bg-[var(--bg-base)] text-[var(--text-primary)] shadow-md border border-[var(--border-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/50'
            }`}
          >
            <GitCompare size={18} aria-hidden />
            Compare Tenants
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {tenants.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-8">No tenants.</p>
            ) : (
              <>
                <TableFilters
                  plans={plans}
                  selectedPlan={planFilter}
                  onPlanChange={setPlanFilter}
                />
                <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-sm">
                  <DataTable minWidth="min-w-[640px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTenants.map((t) => (
                          <TableRow
                            key={t.id}
                            className="border-t border-[var(--border-subtle)]/50 first:border-t-0"
                          >
                            <TableCell className="font-mono text-sm text-[var(--text-secondary)] py-4">
                              {t.id}
                            </TableCell>
                            <TableCell className="font-medium text-[var(--text-primary)] py-4">
                              {t.name}
                            </TableCell>
                            <TableCell className="py-4">
                              <PillTag variant="plan">{t.plan}</PillTag>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <ViewButton onClick={handleView(t.id)} aria-label="View tenant" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleArchive(t.id)}
                                  aria-label="Archive tenant"
                                  className="text-[var(--text-muted)] hover:text-[var(--destructive)]"
                                >
                                  <Archive size={16} aria-hidden />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DataTable>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TenantComparisonView
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AddTenantModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
