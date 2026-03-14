import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProviderAvailability,
  ProviderAvailabilityDocument,
} from './schemas/provider-availability.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export interface AvailabilitySlot {
  id: string;
  type: 'availability';
  staffId: string;
  staffName: string;
  start: Date;
  end: Date;
  day: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(ProviderAvailability.name)
    private availabilityModel: Model<ProviderAvailabilityDocument>,
    @InjectModel(TenantStaff.name)
    private staffModel: Model<TenantStaffDocument>,
  ) {}

  async getAvailabilitySlots(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const availability = await this.availabilityModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .populate('providerId', 'userId')
      .lean();

    const providerIds = availability
      .map((a) => {
        const p = (a as { providerId?: { _id?: unknown } | Types.ObjectId })
          .providerId;
        if (p && typeof p === 'object' && '_id' in p)
          return (p as { _id: Types.ObjectId })._id;
        return p as Types.ObjectId;
      })
      .filter(Boolean);
    const staff = await this.staffModel
      .find({
        _id: { $in: providerIds },
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('userId', 'name')
      .lean();

    const staffMap = new Map(
      staff.map((s) => [
        String((s as { _id?: unknown })._id),
        (s as { userId?: { name?: string } }).userId?.name ?? 'Provider',
      ]),
    );

    while (cur <= endDate) {
      const dayOfWeek = cur.getDay();
      const dayStr = DAY_NAMES[dayOfWeek];
      for (const av of availability) {
        const doc = av as {
          providerId?: { _id?: unknown };
          dayOfWeek?: number;
          startTime?: string;
          endTime?: string;
        };
        if (doc.dayOfWeek !== dayOfWeek) continue;
        const [sh, sm] = (doc.startTime ?? '09:00').split(':').map(Number);
        const [eh, em] = (doc.endTime ?? '17:00').split(':').map(Number);
        const prov = doc.providerId;
        const id =
          prov && typeof prov === 'object' && '_id' in prov
            ? String(prov._id)
            : '';
        const staffName = staffMap.get(id) ?? 'Provider';
        const slotStart = new Date(cur);
        slotStart.setHours(sh ?? 9, sm ?? 0, 0, 0);
        const slotEnd = new Date(cur);
        slotEnd.setHours(eh ?? 17, em ?? 0, 0, 0);
        slots.push({
          id: `avail-${id}-${cur.toISOString().slice(0, 10)}`,
          type: 'availability',
          staffId: id,
          staffName,
          start: slotStart,
          end: slotEnd,
          day: dayStr,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    return slots;
  }
}
