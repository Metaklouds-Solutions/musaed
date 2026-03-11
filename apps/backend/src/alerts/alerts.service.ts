import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from './schemas/alert.schema';

@Injectable()
export class AlertsService {
  constructor(@InjectModel(Alert.name) private alertModel: Model<AlertDocument>) {}

  async getAlerts(tenantId: string): Promise<{ id: string; tenantId: string; severity: string; title: string; message: string; resolved: boolean; createdAt: string }[]> {
    const alerts = await this.alertModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return alerts.map((a) => ({
      id: String((a as { _id?: unknown })._id),
      tenantId: String((a as { tenantId?: Types.ObjectId }).tenantId),
      severity: (a as { severity?: string }).severity ?? 'medium',
      title: (a as { title?: string }).title ?? '',
      message: (a as { message?: string }).message ?? '',
      resolved: (a as { resolved?: boolean }).resolved ?? false,
      createdAt: ((a as { createdAt?: Date }).createdAt ?? new Date()).toISOString(),
    }));
  }

  async resolveAlert(tenantId: string, alertId: string): Promise<boolean> {
    const result = await this.alertModel.updateOne(
      { _id: new Types.ObjectId(alertId), tenantId: new Types.ObjectId(tenantId) },
      { $set: { resolved: true } },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Creates a new alert for a tenant.
   *
   * @param tenantId - The tenant's MongoDB ID
   * @param data - Alert payload (type, title, message, severity)
   * @returns The created alert document
   */
  async createAlert(
    tenantId: string,
    data: { type: string; title: string; message: string; severity?: string },
  ): Promise<AlertDocument> {
    return this.alertModel.create({
      tenantId: new Types.ObjectId(tenantId),
      type: data.type,
      title: data.title,
      message: data.message,
      severity: data.severity ?? 'medium',
      resolved: false,
    });
  }
}
