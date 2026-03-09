import { Injectable } from '@nestjs/common';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { User, UserDocument } from '../users/schemas/user.schema';
import { TenantStaff, TenantStaffDocument } from '../tenants/schemas/tenant-staff.schema';

export interface CreateNotificationInput {
  userId: string;
  tenantId?: string | null;
  type: string;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, unknown>;
  priority?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TenantStaff.name) private tenantStaffModel: Model<TenantStaffDocument>,
    private gateway: NotificationsGateway,
  ) {}

  /**
   * Create a single notification and emit via WebSocket.
   */
  async create(input: CreateNotificationInput): Promise<NotificationDocument> {
    const doc = await this.notificationModel.create({
      userId: new Types.ObjectId(input.userId),
      tenantId: input.tenantId ? new Types.ObjectId(input.tenantId) : null,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? '',
      meta: input.meta ?? {},
      read: false,
      priority: input.priority ?? 'normal',
    });

    const payload = this.toPayload(doc);
    this.gateway.emitToUser(input.userId, 'notification', payload);

    return doc;
  }

  /**
   * Create notifications for multiple users (e.g. all admins, all tenant staff).
   */
  async createForUsers(
    userIds: string[],
    data: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<void> {
    const uniqueIds = [...new Set(userIds)];
    for (const userId of uniqueIds) {
      await this.create({ ...data, userId });
    }
  }

  /**
   * Notify all admin users (platform-wide).
   */
  async createForAdmins(data: Omit<CreateNotificationInput, 'userId' | 'tenantId'>): Promise<void> {
    const admins = await this.userModel
      .find({ role: 'ADMIN', deletedAt: null, status: 'active' })
      .select('_id')
      .lean();
    const ids = admins.map((a) => a._id.toString());
    await this.createForUsers(ids, { ...data, tenantId: null });
  }

  /**
   * Notify tenant owner and clinic admins.
   */
  async createForTenantStaff(
    tenantId: string,
    data: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<void> {
    const staff = await this.tenantStaffModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        status: 'active',
        roleSlug: { $in: ['tenant_owner', 'clinic_admin', 'receptionist'] },
      })
      .select('userId')
      .lean();
    const ids = staff.map((s) => s.userId.toString());
    if (ids.length > 0) {
      await this.createForUsers(ids, { ...data, tenantId });
    }
  }

  async findAllForUser(
    userId: string,
    query: { page?: number; limit?: number; read?: boolean },
  ) {
    const { page = 1, limit = 50, read } = query;
    const filter: FilterQuery<NotificationDocument> = {
      userId: new Types.ObjectId(userId),
    };
    if (read !== undefined) filter.read = read;

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data: data.map((d) => this.toPayload(d)),
      total,
      page,
      limit,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: { read: true, readAt: new Date() } },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true, readAt: new Date() } },
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.notificationModel.deleteOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
  }

  private toPayload(doc: unknown): Record<string, unknown> {
    if (!isRecord(doc)) return {};
    const d = doc;
    const toStr = (x: unknown): string => (x != null ? String(x) : '');
    return {
      id: toStr(d._id),
      userId: toStr(d.userId),
      tenantId: d.tenantId ? toStr(d.tenantId) : null,
      type: d.type,
      title: d.title,
      message: d.message,
      link: d.link ?? '',
      meta: d.meta ?? {},
      read: d.read ?? false,
      readAt: d.readAt,
      priority: d.priority ?? 'normal',
      createdAt: d.createdAt,
      time: (() => {
        const dt = d.createdAt;
        if (dt instanceof Date) return dt.toISOString();
        if (typeof dt === 'string' || typeof dt === 'number') return new Date(dt).toISOString();
        return '';
      })(),
    };
  }
}
