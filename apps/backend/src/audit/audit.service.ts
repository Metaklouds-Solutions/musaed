import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { AuditEntry, AuditEntryDocument } from './schemas/audit-entry.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEntry.name) private auditModel: Model<AuditEntryDocument>,
  ) {}

  /**
   * Log an audit action.
   */
  async log(
    action: string,
    userId: string,
    meta?: Record<string, unknown>,
    tenantId?: string | null,
  ): Promise<AuditEntryDocument> {
    const doc = await this.auditModel.create({
      action,
      userId,
      tenantId: tenantId ? new Types.ObjectId(tenantId) : null,
      meta: meta ?? {},
      timestamp: new Date(),
    });
    return doc;
  }

  /**
   * Get recent audit entries (admin only).
   */
  async getRecent(limit = 100, tenantId?: string) {
    const filter: FilterQuery<AuditEntryDocument> = {};
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const data = await this.auditModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return data.map((d) => {
      const r = d as Record<string, unknown>;
      return {
        id: r._id != null ? String(r._id) : undefined,
        action: r.action,
        userId: r.userId,
        tenantId: r.tenantId != null ? String(r.tenantId) : undefined,
        meta: r.meta,
        timestamp: r.timestamp,
      };
    });
  }
}
