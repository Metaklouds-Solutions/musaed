import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  SupportTicket,
  SupportTicketDocument,
} from '../support/schemas/support-ticket.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

function escapeCsv(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

@Injectable()
export class ExportService {
  constructor(
    @InjectModel(TenantStaff.name)
    private staffModel: Model<TenantStaffDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async exportStaffCsv(tenantId: string): Promise<string> {
    const staff = await this.staffModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        status: { $ne: 'disabled' },
      })
      .populate('userId', 'email name')
      .populate('tenantId', 'name')
      .lean();

    const headers = ['Email', 'Name', 'Role', 'Status', 'Tenant'];
    const rows = (
      staff as {
        userId?: { email?: string; name?: string };
        tenantId?: { name?: string };
        roleSlug?: string;
        status?: string;
      }[]
    ).map((s) => [
      escapeCsv(s.userId?.email),
      escapeCsv(s.userId?.name),
      escapeCsv(s.roleSlug),
      escapeCsv(s.status),
      escapeCsv(s.tenantId?.name),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async exportTicketsCsv(tenantId: string): Promise<string> {
    const tickets = await this.ticketModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const headers = [
      'ID',
      'Title',
      'Category',
      'Status',
      'Priority',
      'Created',
    ];
    const rows = (
      tickets as {
        _id?: unknown;
        title?: string;
        category?: string;
        status?: string;
        priority?: string;
        createdAt?: Date;
      }[]
    ).map((t) => [
      escapeCsv(t._id != null ? String(t._id) : ''),
      escapeCsv(t.title),
      escapeCsv(t.category),
      escapeCsv(t.status),
      escapeCsv(t.priority),
      escapeCsv(t.createdAt ? new Date(t.createdAt).toISOString() : ''),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async exportTenantsCsv(): Promise<string> {
    const tenants = await this.tenantModel
      .find({ deletedAt: null })
      .populate('ownerId', 'email name')
      .lean();

    const headers = [
      'ID',
      'Name',
      'Slug',
      'Status',
      'Owner Email',
      'Owner Name',
    ];
    const rows = (
      tenants as {
        _id?: unknown;
        name?: string;
        slug?: string;
        status?: string;
        ownerId?: { email?: string; name?: string };
      }[]
    ).map((t) => [
      escapeCsv(t._id != null ? String(t._id) : ''),
      escapeCsv(t.name),
      escapeCsv(t.slug),
      escapeCsv(t.status),
      escapeCsv(t.ownerId?.email),
      escapeCsv(t.ownerId?.name),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
