import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  SupportTicket,
  SupportTicketDocument,
} from '../support/schemas/support-ticket.schema';

export interface SearchResultItem {
  id: string;
  type: 'tenant' | 'staff' | 'ticket';
  label: string;
  meta?: string;
  path: string;
}

function matchQuery(
  q: string,
  ...texts: (string | undefined | null)[]
): boolean {
  const lower = q.toLowerCase().trim();
  if (!lower) return false;
  return texts.some((t) => t?.toLowerCase().includes(lower));
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantStaff.name)
    private staffModel: Model<TenantStaffDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
  ) {}

  async search(
    query: string,
    options: { tenantId?: string | null; isAdmin?: boolean; types?: string[] },
  ): Promise<SearchResultItem[]> {
    const q = query.trim();
    if (!q) return [];

    const {
      tenantId,
      isAdmin,
      types = ['tenants', 'staff', 'tickets'],
    } = options;
    const results: SearchResultItem[] = [];

    if (types.includes('tenants') && isAdmin) {
      const tenants = await this.tenantModel
        .find({ deletedAt: null })
        .populate<{ ownerId: { name?: string } }>('ownerId', 'name')
        .limit(20)
        .lean();
      for (const t of tenants) {
        const name = (t as { name?: string }).name ?? '';
        const slug = (t as { slug?: string }).slug ?? '';
        if (matchQuery(q, name, slug)) {
          results.push({
            id: `tenant-${t._id}`,
            type: 'tenant',
            label: name,
            meta: slug,
            path: `/admin/tenants/${t._id}`,
          });
        }
      }
    }

    if (types.includes('staff')) {
      const staffFilter: Record<string, unknown> = {
        status: { $ne: 'disabled' },
      };
      if (!isAdmin && tenantId) {
        staffFilter.tenantId = new Types.ObjectId(tenantId);
      }
      const staff = await this.staffModel
        .find(staffFilter)
        .populate<{
          userId: { name?: string; email?: string };
          tenantId: { name?: string };
        }>('userId', 'name email')
        .populate('tenantId', 'name')
        .limit(20)
        .lean();
      for (const s of staff) {
        const name = s.userId?.name ?? '';
        const email = s.userId?.email ?? '';
        const roleSlug = (s as { roleSlug?: string }).roleSlug ?? '';
        const tenantName = s.tenantId?.name;
        const doc = s as { userId?: { _id?: unknown }; _id?: unknown };
        const staffId = doc.userId?._id ?? doc._id;
        if (matchQuery(q, name, email, roleSlug)) {
          results.push({
            id: `staff-${String(staffId ?? '')}`,
            type: 'staff',
            label: name || email,
            meta: tenantName ? `${roleSlug} · ${tenantName}` : roleSlug,
            path: isAdmin ? '/admin/staff' : '/staff',
          });
        }
      }
    }

    if (types.includes('tickets')) {
      const ticketFilter: Record<string, unknown> = {};
      if (!isAdmin && tenantId) {
        ticketFilter.tenantId = new Types.ObjectId(tenantId);
      }
      const tickets = await this.ticketModel
        .find(ticketFilter)
        .populate<{ tenantId: { name?: string } }>('tenantId', 'name')
        .limit(20)
        .sort({ createdAt: -1 })
        .lean();
      for (const t of tickets) {
        const title = (t as { title?: string }).title ?? '';
        const category = (t as { category?: string }).category ?? '';
        const status = (t as { status?: string }).status ?? '';
        const tenantName = t.tenantId?.name;
        if (matchQuery(q, title, category, status)) {
          results.push({
            id: `ticket-${t._id}`,
            type: 'ticket',
            label: title,
            meta: tenantName ? `${status} · ${tenantName}` : status,
            path: isAdmin
              ? `/admin/support/${t._id}`
              : `/help/tickets/${t._id}`,
          });
        }
      }
    }

    return results.slice(0, 15);
  }
}
