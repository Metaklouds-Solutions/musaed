import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance, MaintenanceDocument } from './schemas/maintenance.schema';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name)
    private maintenanceModel: Model<MaintenanceDocument>,
  ) {}

  async getStatus(): Promise<{ enabled: boolean; message: string }> {
    const doc = await this.maintenanceModel.findOne({ key: 'default' });
    if (!doc) return { enabled: false, message: '' };
    return {
      enabled: doc.enabled,
      message:
        doc.message ??
        'System maintenance in progress. Some features may be temporarily unavailable.',
    };
  }

  async setStatus(
    enabled: boolean,
    message?: string,
  ): Promise<{ enabled: boolean; message: string }> {
    const current = await this.getStatus();
    const newMessage = message ?? current.message;
    await this.maintenanceModel.updateOne(
      { key: 'default' },
      { $set: { enabled, message: newMessage } },
      { upsert: true },
    );
    return { enabled, message: newMessage };
  }
}
