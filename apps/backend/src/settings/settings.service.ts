import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async getSettings(tenantId: string) {
    const tenant = await this.tenantModel.findOne({
      _id: tenantId,
      deletedAt: null,
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return {
      timezone: tenant.timezone,
      locale: tenant.locale,
      settings: tenant.settings,
    };
  }

  async updateSettings(tenantId: string, dto: UpdateSettingsDto) {
    const update: Record<string, unknown> = {};

    if (dto.timezone !== undefined) update.timezone = dto.timezone;
    if (dto.locale !== undefined) update.locale = dto.locale;
    if (dto.businessHours !== undefined) {
      update['settings.businessHours'] =
        typeof dto.businessHours === 'string'
          ? dto.businessHours
          : dto.businessHours;
    }
    if (dto.notifications !== undefined)
      update['settings.notifications'] = dto.notifications;
    if (dto.featureFlags !== undefined)
      update['settings.featureFlags'] = dto.featureFlags;
    if (dto.locations !== undefined)
      update['settings.locations'] = dto.locations;
    if (dto.appointmentReminders !== undefined)
      update['settings.appointmentReminders'] = dto.appointmentReminders;

    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: tenantId, deletedAt: null },
      { $set: update },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');

    return {
      timezone: tenant.timezone,
      locale: tenant.locale,
      settings: tenant.settings,
    };
  }
}
