/**
 * Admin support inbox. List tickets with filters, assign, reply.
 */

import { useState, useCallback, useMemo } from 'react';
import { supportAdapter, exportAdapter, auditAdapter, tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { SupportTicket } from '../../../shared/types/entities';

/** Returns admin support inbox data, filters, and ticket workflow actions. */
export function useAdminSupport() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tenantFilter, setTenantFilter] = useState<string | ''>('');
  const [statusFilter, setStatusFilter] = useState<SupportTicket['status'] | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<SupportTicket['priority'] | ''>('');

  const { data: tickets, loading, refetch } = useAsyncData(
    () => {
      const filters: Parameters<typeof supportAdapter.listTickets>[0] = {};
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      return Promise.resolve(supportAdapter.listTickets(filters)).then((rows) => {
        if (!tenantFilter) return rows;
        return rows.filter((row) => row.tenantId === tenantFilter);
      });
    },
    [refreshKey, tenantFilter, statusFilter, priorityFilter],
    [] as SupportTicket[],
  );

  const { data: tenants } = useAsyncData(
    () => tenantsAdapter.getAllTenants(),
    [],
    [],
  );

  const getTicket = useCallback(
    async (id: string) =>
      Promise.resolve(
        (supportAdapter as unknown as {
          getTicket: (ticketId: string, options?: { isAdmin?: boolean }) => ReturnType<typeof supportAdapter.getTicket>;
        }).getTicket(id, { isAdmin: true }),
      ),
    [],
  );

  const updateStatus = useCallback(async (id: string, status: SupportTicket['status']) => {
    await Promise.resolve(
      (supportAdapter as unknown as {
        updateStatus: (
          ticketId: string,
          nextStatus: SupportTicket['status'],
          options?: { isAdmin?: boolean },
        ) => ReturnType<typeof supportAdapter.updateStatus>;
      }).updateStatus(id, status, { isAdmin: true }),
    );
    setRefreshKey((k) => k + 1);
  }, []);

  const assignTicket = useCallback(async (ticketId: string, userId: string) => {
    await Promise.resolve(
      (supportAdapter as unknown as {
        assignTicket: (
          id: string,
          assigneeId: string,
          options?: { isAdmin?: boolean },
        ) => ReturnType<typeof supportAdapter.assignTicket>;
      }).assignTicket(ticketId, userId, { isAdmin: true }),
    );
    setRefreshKey((k) => k + 1);
  }, []);

  const addMessage = useCallback(async (ticketId: string, authorId: string, body: string) => {
    await Promise.resolve(
      (supportAdapter as unknown as {
        addMessage: (
          id: string,
          aId: string,
          message: string,
          options?: { isAdmin?: boolean },
        ) => ReturnType<typeof supportAdapter.addMessage>;
      }).addMessage(ticketId, authorId, body, { isAdmin: true }),
    );
    setRefreshKey((k) => k + 1);
  }, []);

  const logTicketAssigned = useCallback((ticketId: string, tenantId?: string) => {
    auditAdapter.log('ticket.assigned', { ticketId, tenantId });
  }, []);

  const exportTicketsCsv = useCallback((rows: Record<string, string>[], fileName: string) => {
    exportAdapter.exportCsv(rows, fileName);
  }, []);

  return {
    tickets,
    tenants,
    loading,
    getTicket,
    updateStatus,
    assignTicket,
    addMessage,
    logTicketAssigned,
    exportTicketsCsv,
    getTenantName: supportAdapter.getTenantName,
    filters: { tenantFilter, statusFilter, priorityFilter },
    setTenantFilter,
    setStatusFilter,
    setPriorityFilter,
    refresh: refetch,
  };
}
