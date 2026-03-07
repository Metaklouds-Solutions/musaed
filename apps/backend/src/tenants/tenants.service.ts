import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { TenantStaff, TenantStaffDocument } from './schemas/tenant-staff.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantStaff.name) private staffModel: Model<TenantStaffDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const filter: any = { deletedAt: null };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.tenantModel
        .find(filter)
        .populate('ownerId', 'email name')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.tenantModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const tenant = await this.tenantModel
      .findOne({ _id: id, deletedAt: null })
      .populate('ownerId', 'email name')
      .populate('planId');

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.tenantModel.findOne({ slug: dto.slug });
    if (existing) throw new ConflictException('Slug already taken');

    let owner = await this.userModel.findOne({ email: dto.ownerEmail, deletedAt: null });
    if (!owner) {
      const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
      owner = await this.userModel.create({
        email: dto.ownerEmail,
        passwordHash,
        name: dto.ownerName,
        role: 'TENANT_OWNER',
      });
    }

    const tenant = await this.tenantModel.create({
      name: dto.name,
      slug: dto.slug,
      status: 'ONBOARDING',
      ownerId: owner._id,
      planId: dto.planId ? new Types.ObjectId(dto.planId) : null,
      timezone: dto.timezone ?? 'Asia/Riyadh',
    });

    await this.staffModel.create({
      userId: owner._id,
      tenantId: tenant._id,
      roleSlug: 'clinic_admin',
      status: 'active',
      joinedAt: new Date(),
    });

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: dto },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async suspend(id: string) {
    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'SUSPENDED' } },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
