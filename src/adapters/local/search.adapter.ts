/**
 * Global search adapter. Searches tenants, calls, staff, tickets.
 * Uses other local adapters; respects tenant scope for non-admin.
 */

import { tenantsAdapter } from './tenants.adapter';
import { callsAdapter } from './calls.adapter';
import { staffAdapter } from './staff.adapter';
import { supportAdapter } from './support.adapter';
import { customersAdapter } from './customers.adapter';
import { seedTenants } from '../../mock/seedData';

export type SearchResultType = 'tenant' | 'call' | 'staff' | 'ticket' | 'nav';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  meta?: string;
  path: string;
}

function matchQuery(query: string, ...texts: string[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  return texts.some((t) => t?.toLowerCase().includes(q));
}

export const searchAdapter = {
  /**
   * Search across tenants, calls, staff, tickets.
   * For tenant users: only search within their tenantId.
   * For admin: search all.
   */
  search(query: string, tenantId?: string, isAdmin?: boolean): SearchResult[] {
    const q = query.trim();
    if (!q) return [];

    const results: SearchResult[] = [];

    // Tenants (admin only)
    if (isAdmin) {
      const tenants = tenantsAdapter.getAllTenants();
      for (const t of tenants) {
        if (matchQuery(q, t.name, t.plan)) {
          results.push({
            id: `tenant-${t.id}`,
            type: 'tenant',
            label: t.name,
            meta: t.plan,
            path: `/admin/tenants/${t.id}`,
          });
        }
      }
    }

    // Staff
    const staff = staffAdapter.list(tenantId);
    for (const s of staff) {
      if (matchQuery(q, s.name, s.email, s.roleLabel)) {
        results.push({
          id: `staff-${s.userId}`,
          type: 'staff',
          label: s.name,
          meta: s.tenantName ? `${s.roleLabel} · ${s.tenantName}` : s.roleLabel,
          path: isAdmin ? `/admin/staff` : `/staff`,
        });
      }
    }

    // Tickets
    const tickets = supportAdapter.listTickets(tenantId ? { tenantId } : undefined);
    for (const t of tickets) {
      const tenantName = tenantId ? undefined : seedTenants.find((tn) => tn.id === t.tenantId)?.name;
      if (matchQuery(q, t.title, t.category, t.status)) {
        results.push({
          id: `ticket-${t.id}`,
          type: 'ticket',
          label: t.title,
          meta: tenantName ? `${t.status} · ${tenantName}` : t.status,
          path: isAdmin ? `/admin/support/${t.id}` : `/help/tickets/${t.id}`,
        });
      }
    }

    // Calls (with customer name)
    const calls = callsAdapter.getCalls(tenantId);
    const customers = customersAdapter.getCustomers(tenantId);
    const customerMap = new Map(customers.map((c) => [c.id, c.name]));
    for (const c of calls) {
      const customerName = customerMap.get(c.customerId) ?? c.customerId;
      if (matchQuery(q, customerName, c.id)) {
        results.push({
          id: `call-${c.id}`,
          type: 'call',
          label: `Call · ${customerName}`,
          meta: new Date(c.createdAt).toLocaleDateString(),
          path: isAdmin ? `/admin/calls/${c.id}` : `/calls/${c.id}`,
        });
      }
    }

    return results.slice(0, 15);
  },
};
