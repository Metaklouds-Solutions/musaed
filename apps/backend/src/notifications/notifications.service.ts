import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { User, UserDocument } from '../users/schemas/user.schema';
import { TenantStaff, TenantStaffDocument } from '../tenants/schemas/tenant-staff.schema';
import { NotificationsQueueService } from './notifications.queue.service';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

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
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TenantStaff.name) private tenantStaffModel: Model<TenantStaffDocument>,
    private gateway: NotificationsGateway,
    @Optional() private notificationsQueue: NotificationsQueueService | null,
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
   * Uses queue when enabled to avoid synchronous loops.
   */
  async createForUsers(
    userIds: string[],
    data: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<void> {
    const uniqueIds = [...new Set(userIds)];
    if (this.notificationsQueue?.isEnabled?.()) {
      const jobId = await this.notificationsQueue.enqueueFanout({
        userIds: uniqueIds,
        tenantId: data.tenantId ?? null,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        meta: data.meta,
        priority: data.priority,
      });
      if (jobId) {
        this.logger.debug({
          event: 'notification_fanout_queued',
          type: data.type,
          userCount: uniqueIds.length,
          jobId,
        });
        return;
      }
    }
    for (const userId of uniqueIds) {
      await this.create({ ...data, userId });
    }
  }

  /**
   * Creates a single notification from queue job. Used by worker only.
   */
  async createFromQueue(payload: {
    userId: string;
    tenantId: string | null;
    type: string;
    title: string;
    message: string;
    link?: string;
    meta?: Record<string, unknown>;
    priority?: string;
  }): Promise<NotificationDocument> {
    return this.create({
      userId: payload.userId,
      tenantId: payload.tenantId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      meta: payload.meta,
      priority: payload.priority,
    });
  }

  /**
   * Batch-create notifications for multiple users via insertMany.
   * Emits WebSocket events for each created notification.
   */
  async createBatchFromQueue(
    userIds: string[],
    data: {
      tenantId: string | null;
      type: string;
      title: string;
      message: string;
      link?: string;
      meta?: Record<string, unknown>;
      priority?: string;
    },
  ): Promise<number> {
    if (userIds.length === 0) return 0;

    const docs = userIds.map((userId) => ({
      userId: new Types.ObjectId(userId),
      tenantId: data.tenantId ? new Types.ObjectId(data.tenantId) : null,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link ?? '',
      meta: data.meta ?? {},
      read: false,
      priority: data.priority ?? 'normal',
    }));

    const inserted = await this.notificationModel.insertMany(docs, { ordered: false });

    for (const doc of inserted) {
      const payload = this.toPayload(doc);
      this.gateway.emitToUser(doc.userId.toString(), 'notification', payload);
    }

    return inserted.length;
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
