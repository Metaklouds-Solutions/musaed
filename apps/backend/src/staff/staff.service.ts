import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantStaff, TenantStaffDocument } from '../tenants/schemas/tenant-staff.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(TenantStaff.name) private staffModel: Model<TenantStaffDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

  async findAllForTenant(tenantId: string | null) {
    const filter: Record<string, unknown> = {};
    if (tenantId) {
      filter.tenantId = new Types.ObjectId(tenantId);
    }
    return this.staffModel
      .find(filter)
      .populate('userId', 'email name avatarUrl role')
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 });
  }

  async invite(tenantId: string, dto: InviteStaffDto) {
    let user = await this.userModel.findOne({ email: dto.email, deletedAt: null });
    const isNewUser = !user;

    if (!user) {
      user = await this.userModel.create({
        email: dto.email,
        passwordHash: null,
        name: dto.name,
        role: 'STAFF',
        status: 'pending',
      });
    }

    const existing = await this.staffModel.findOne({
      userId: user._id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (existing) throw new ConflictException('Staff member already exists for this tenant');

    const staff = await this.staffModel.create({
      userId: user._id,
      tenantId: new Types.ObjectId(tenantId),
      roleSlug: dto.roleSlug,
      status: 'invited',
      invitedAt: new Date(),
    });

    if (isNewUser) {
      const token = await this.authService.generateInviteToken(user._id.toString(), 'invite');
      await this.emailService.sendInviteEmail(user.email, user.name, token);
    }

    return staff;
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

  async remove(id: string) {
    const staff = await this.staffModel.findByIdAndDelete(id);
    if (!staff) throw new NotFoundException('Staff member not found');
    return { message: 'Staff member deleted' };
  }
}
