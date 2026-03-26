import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
import { NotificationsQueueService } from './notifications.queue.service';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export interface CreateNotificationInput {
  userId: string;
  tenantId?: string | null;
  type: string;
  source?: string;
  severity?: 'critical' | 'important' | 'normal' | 'info';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  meta?: Record<string, unknown>; // backward compatibility
  priority?: string; // backward compatibility
  dedupeKey?: string;
  dedupeWindowSeconds?: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  read?: boolean;
  severity?: string;
  source?: string;
  tenantId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TenantStaff.name)
    private tenantStaffModel: Model<TenantStaffDocument>,
    private gateway: NotificationsGateway,
    @Optional() private notificationsQueue: NotificationsQueueService | null,
  ) {}

  /**
   * Create a single notification and emit via WebSocket.
   */
  async create(input: CreateNotificationInput): Promise<NotificationDocument> {
    const duplicate = await this.findRecentDuplicate(input);
    if (duplicate) return duplicate;
    const dedupeMeta = input.dedupeKey ? { dedupeKey: input.dedupeKey } : {};
    const mergedMeta = {
      ...(input.meta ?? input.metadata ?? {}),
      ...dedupeMeta,
    };
    const mergedMetadata = {
      ...(input.metadata ?? input.meta ?? {}),
      ...dedupeMeta,
    };

    const doc = await this.notificationModel.create({
      userId: new Types.ObjectId(input.userId),
      tenantId: input.tenantId ? new Types.ObjectId(input.tenantId) : null,
      type: input.type,
      source: input.source ?? 'system',
      severity: input.severity ?? this.mapPriorityToSeverity(input.priority),
      title: input.title,
      message: input.message,
      link: input.link ?? '',
      meta: mergedMeta,
      metadata: mergedMetadata,
      read: false,
      priority: input.priority ?? 'normal',
    });

    const payload = this.toPayload(doc);
    this.gateway.emitToUser(input.userId, 'notification:new', payload);
    this.gateway.emitToUser(input.userId, 'notification', payload);
    if (input.tenantId) {
      this.gateway.emitToTenant(input.tenantId, 'notification:new', payload);
      if (input.type === 'new_call') {
        this.gateway.emitToTenant(input.tenantId, 'dashboard:refresh', {
          reason: 'new_call',
          at: new Date().toISOString(),
        });
      }
    }
    this.maybeTrimOldNotificationsForUser(input.userId).catch(
      (error: unknown) => {
        this.logger.warn(
          `Failed to trim user notifications userId=${input.userId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      },
    );
    if (input.tenantId) {
      this.maybeTrimOldNotificationsForTenant(input.tenantId).catch(
        (error: unknown) => {
          this.logger.warn(
            `Failed to trim tenant notifications tenantId=${input.tenantId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        },
      );
    }

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
        source: data.source,
        severity: data.severity,
        title: data.title,
        message: data.message,
        link: data.link,
        meta: data.meta ?? data.metadata,
        metadata: data.metadata ?? data.meta,
        priority: data.priority,
        dedupeKey: data.dedupeKey,
        dedupeWindowSeconds: data.dedupeWindowSeconds,
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
    source?: string;
    severity?: 'critical' | 'important' | 'normal' | 'info';
    title: string;
    message: string;
    link?: string;
    meta?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    priority?: string;
    dedupeKey?: string;
    dedupeWindowSeconds?: number;
  }): Promise<NotificationDocument> {
    return this.create({
      userId: payload.userId,
      tenantId: payload.tenantId,
      type: payload.type,
      source: payload.source,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      metadata: payload.metadata ?? payload.meta,
      meta: payload.meta,
      priority: payload.priority,
      dedupeKey: payload.dedupeKey,
      dedupeWindowSeconds: payload.dedupeWindowSeconds,
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
      source?: string;
      severity?: 'critical' | 'important' | 'normal' | 'info';
      title: string;
      message: string;
      link?: string;
      meta?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      priority?: string;
      dedupeKey?: string;
      dedupeWindowSeconds?: number;
    },
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    if (data.dedupeKey) {
      let created = 0;
      for (const userId of userIds) {
        const before = await this.getUnreadCount(userId);
        await this.createFromQueue({
          userId,
          tenantId: data.tenantId,
          type: data.type,
          source: data.source,
          severity: data.severity,
          title: data.title,
          message: data.message,
          link: data.link,
          meta: data.meta,
          metadata: data.metadata,
          priority: data.priority,
          dedupeKey: data.dedupeKey,
          dedupeWindowSeconds: data.dedupeWindowSeconds,
        });
        const after = await this.getUnreadCount(userId);
        if (after > before) created += 1;
      }
      return created;
    }

    const docs = userIds.map((userId) => ({
      userId: new Types.ObjectId(userId),
      tenantId: data.tenantId ? new Types.ObjectId(data.tenantId) : null,
      type: data.type,
      source: data.source ?? 'system',
      severity: data.severity ?? this.mapPriorityToSeverity(data.priority),
      title: data.title,
      message: data.message,
      link: data.link ?? '',
      meta: data.meta ?? data.metadata ?? {},
      metadata: data.metadata ?? data.meta ?? {},
      read: false,
      priority: data.priority ?? 'normal',
    }));

    const inserted = await this.notificationModel.insertMany(docs, {
      ordered: false,
    });

    for (const doc of inserted) {
      const payload = this.toPayload(doc);
      this.gateway.emitToUser(
        doc.userId.toString(),
        'notification:new',
        payload,
      );
      this.gateway.emitToUser(doc.userId.toString(), 'notification', payload);
      if (doc.tenantId) {
        this.gateway.emitToTenant(
          doc.tenantId.toString(),
          'notification:new',
          payload,
        );
      }
    }

    return inserted.length;
  }

  /**
   * Notify all admin users (platform-wide).
   */
  async createForAdmins(
    data: Omit<CreateNotificationInput, 'userId' | 'tenantId'>,
  ): Promise<void> {
    const admins = await this.userModel
      .find({ role: 'ADMIN', deletedAt: null, status: 'active' })
      .select('_id')
      .lean();
    const ids = admins.map((a) => a._id.toString());
    await this.createForUsers(ids, { ...data, tenantId: null });
    this.gateway.emitToAdmins('notification:new', {
      title: data.title,
      message: data.message,
      severity: data.severity ?? this.mapPriorityToSeverity(data.priority),
      source: data.source ?? 'system',
      type: data.type,
      tenantId: null,
      createdAt: new Date().toISOString(),
    });
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

  async findAllForUser(userId: string, query: NotificationFilters) {
    const {
      page = 1,
      limit = 50,
      read,
      severity,
      source,
      tenantId,
      dateFrom,
      dateTo,
    } = query;
    const filter: FilterQuery<NotificationDocument> = {
      userId: new Types.ObjectId(userId),
    };
    if (read !== undefined) filter.read = read;
    if (severity) filter.severity = severity;
    if (source) filter.source = source;
    if (tenantId && Types.ObjectId.isValid(tenantId)) {
      filter.tenantId = new Types.ObjectId(tenantId);
    }
    if (dateFrom || dateTo) {
      const createdAt: { $gte?: Date; $lte?: Date } = {};
      if (dateFrom) createdAt.$gte = dateFrom;
      if (dateTo) createdAt.$lte = dateTo;
      filter.createdAt = createdAt;
    }

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

  async clearForUser(
    userId: string,
    query: Pick<
      NotificationFilters,
      'read' | 'severity' | 'source' | 'tenantId' | 'dateFrom' | 'dateTo'
    > = {},
  ): Promise<number> {
    const filter: FilterQuery<NotificationDocument> = {
      userId: new Types.ObjectId(userId),
    };
    if (query.read !== undefined) filter.read = query.read;
    if (query.severity) filter.severity = query.severity;
    if (query.source) filter.source = query.source;
    if (query.tenantId && Types.ObjectId.isValid(query.tenantId)) {
      filter.tenantId = new Types.ObjectId(query.tenantId);
    }
    if (query.dateFrom || query.dateTo) {
      const createdAt: { $gte?: Date; $lte?: Date } = {};
      if (query.dateFrom) createdAt.$gte = query.dateFrom;
      if (query.dateTo) createdAt.$lte = query.dateTo;
      filter.createdAt = createdAt;
    }
    const result = await this.notificationModel.deleteMany(filter);
    return result.deletedCount ?? 0;
  }

  /**
   * Removes duplicate notifications for a user while keeping the newest row in each duplicate group.
   * Duplicate key: type + source + title + message + dedupeKey (if present).
   */
  async cleanupDuplicatesForUser(
    userId: string,
    lookbackDays = 30,
  ): Promise<number> {
    const since = new Date(Date.now() - Math.max(1, lookbackDays) * 86_400_000);
    const userObjectId = new Types.ObjectId(userId);

    const groups = await this.notificationModel.aggregate<{
      idsToDelete: Types.ObjectId[];
      duplicateCount: number;
    }>([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: since },
        },
      },
      {
        $addFields: {
          dedupeKey: {
            $ifNull: ['$meta.dedupeKey', '$metadata.dedupeKey'],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            type: '$type',
            source: '$source',
            title: '$title',
            message: '$message',
            dedupeKey: '$dedupeKey',
          },
          ids: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
      {
        $project: {
          duplicateCount: { $subtract: ['$count', 1] },
          idsToDelete: {
            $slice: ['$ids', 1, { $subtract: ['$count', 1] }],
          },
        },
      },
    ]);

    const idsToDelete = groups.flatMap((g) => g.idsToDelete);
    if (idsToDelete.length === 0) return 0;

    const result = await this.notificationModel.deleteMany({
      _id: { $in: idsToDelete },
      userId: userObjectId,
    });
    return result.deletedCount ?? 0;
  }

  private mapPriorityToSeverity(
    priority?: string,
  ): 'critical' | 'important' | 'normal' | 'info' {
    if (priority === 'critical') return 'critical';
    if (priority === 'high') return 'important';
    if (priority === 'low') return 'info';
    return 'normal';
  }

  private async maybeTrimOldNotificationsForTenant(
    tenantId: string,
  ): Promise<void> {
    const MAX_PER_TENANT = 5000;
    const tenantObjectId = new Types.ObjectId(tenantId);
    const count = await this.notificationModel.countDocuments({
      tenantId: tenantObjectId,
    });
    if (count <= MAX_PER_TENANT) return;
    const overflow = count - MAX_PER_TENANT;
    const oldIds = await this.notificationModel
      .find({ tenantId: tenantObjectId })
      .sort({ createdAt: 1 })
      .limit(overflow)
      .select('_id')
      .lean();
    if (oldIds.length > 0) {
      await this.notificationModel.deleteMany({
        _id: { $in: oldIds.map((d) => d._id) },
      });
    }
  }

  private async maybeTrimOldNotificationsForUser(
    userId: string,
  ): Promise<void> {
    const MAX_PER_USER = 5000;
    const userObjectId = new Types.ObjectId(userId);
    const count = await this.notificationModel.countDocuments({
      userId: userObjectId,
    });
    if (count <= MAX_PER_USER) return;
    const overflow = count - MAX_PER_USER;
    const oldIds = await this.notificationModel
      .find({ userId: userObjectId })
      .sort({ createdAt: 1 })
      .limit(overflow)
      .select('_id')
      .lean();
    if (oldIds.length > 0) {
      await this.notificationModel.deleteMany({
        _id: { $in: oldIds.map((d) => d._id) },
      });
    }
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
      source: d.source ?? 'system',
      severity: d.severity ?? this.mapPriorityToSeverity(toStr(d.priority)),
      title: d.title,
      message: d.message,
      link: d.link ?? '',
      meta: d.meta ?? d.metadata ?? {},
      metadata: d.metadata ?? d.meta ?? {},
      read: d.read ?? false,
      readAt: d.readAt,
      priority: d.priority ?? 'normal',
      createdAt: d.createdAt,
      time: (() => {
        const dt = d.createdAt;
        if (dt instanceof Date) return dt.toISOString();
        if (typeof dt === 'string' || typeof dt === 'number')
          return new Date(dt).toISOString();
        return '';
      })(),
    };
  }

  private async findRecentDuplicate(
    input: CreateNotificationInput,
  ): Promise<NotificationDocument | null> {
    const key = input.dedupeKey?.trim();
    if (!key) return null;
    const windowSeconds = Math.max(10, input.dedupeWindowSeconds ?? 300);
    const since = new Date(Date.now() - windowSeconds * 1000);
    return this.notificationModel
      .findOne({
        userId: new Types.ObjectId(input.userId),
        type: input.type,
        title: input.title,
        message: input.message,
        source: input.source ?? 'system',
        createdAt: { $gte: since },
        $or: [{ 'meta.dedupeKey': key }, { 'metadata.dedupeKey': key }],
      })
      .sort({ createdAt: -1 });
  }
}
