import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { TenantStaff, TenantStaffDocument } from '../tenants/schemas/tenant-staff.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(TenantStaff.name) private staffModel: Model<TenantStaffDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.staffModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .populate('userId', 'email name avatarUrl role');
  }

  async invite(tenantId: string, dto: InviteStaffDto) {
    let user = await this.userModel.findOne({ email: dto.email, deletedAt: null });

    if (!user) {
      const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
      user = await this.userModel.create({
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: 'STAFF',
      });
    }

    const existing = await this.staffModel.findOne({
      userId: user._id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (existing) throw new ConflictException('Staff member already exists for this tenant');

    return this.staffModel.create({
      userId: user._id,
      tenantId: new Types.ObjectId(tenantId),
      roleSlug: dto.roleSlug,
      status: 'invited',
      invitedAt: new Date(),
    });
  }

  async update(id: string, tenantId: string, dto: UpdateStaffDto) {
    const staff = await this.staffModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { $set: dto },
      { new: true },
    );
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }
}
