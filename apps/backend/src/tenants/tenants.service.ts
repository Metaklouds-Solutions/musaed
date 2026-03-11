import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { TenantStaff, TenantStaffDocument } from './schemas/tenant-staff.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';
import { AgentDeploymentService } from '../agent-deployments/agent-deployment.service';
import { AgentTemplate, AgentTemplateDocument } from '../agent-templates/schemas/agent-template.schema';
import { AgentRolloutService } from '../agent-deployments/agent-rollout.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantStaff.name) private staffModel: Model<TenantStaffDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AgentInstance.name) private agentInstanceModel: Model<AgentInstanceDocument>,
    @InjectModel(AgentTemplate.name) private agentTemplateModel: Model<AgentTemplateDocument>,
    private authService: AuthService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
    private agentDeploymentService: AgentDeploymentService,
    private agentRolloutService: AgentRolloutService,
  ) {}

  async findAll(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const filter: FilterQuery<TenantDocument> = { deletedAt: null };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.tenantModel
        .find(filter)
        .populate('ownerId', 'email name')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.tenantModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const tenant = await this.tenantModel
      .findOne({ _id: id, deletedAt: null })
      .populate('ownerId', 'email name')
      .populate('planId')
      .lean();

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: CreateTenantDto, adminUserId?: string) {
    const existing = await this.tenantModel.findOne({ slug: dto.slug, deletedAt: null });
    if (existing) throw new ConflictException('Slug already taken');

    let selectedTemplate: AgentTemplateDocument | null = null;
    if (dto.templateId) {
      selectedTemplate = await this.agentTemplateModel.findOne({
        _id: dto.templateId,
        deletedAt: null,
      });
      if (!selectedTemplate) {
        throw new NotFoundException('Agent template not found');
      }
      const supportedChannels = this.resolveSupportedChannels(selectedTemplate);
      const requestedChannels = dto.channelsEnabled ?? [];
      if (requestedChannels.length > 0) {
        const hasUnsupported = requestedChannels.some(
          (channel) => !supportedChannels.includes(channel),
        );
        if (hasUnsupported) {
          throw new BadRequestException(
            'channelsEnabled must be a subset of template supported channels',
          );
        }
      }
    }

    const ownerEmail = dto.ownerEmail.toLowerCase().trim();
    const existingOwner = await this.userModel.findOne({ email: ownerEmail, deletedAt: null });
    if (existingOwner) {
      const tenantWithOwner = await this.tenantModel.findOne({
        ownerId: existingOwner._id,
        deletedAt: null,
      });
      if (tenantWithOwner) {
        throw new ConflictException('A tenant with this owner email already exists');
      }
    }

    let owner = await this.userModel.findOne({ email: ownerEmail, deletedAt: null });
    const isNewUser = !owner;

    if (!owner) {
      owner = await this.userModel.create({
        email: ownerEmail,
        passwordHash: null,
        name: (dto.ownerName?.trim() || ownerEmail.split('@')[0]) ?? 'Owner',
        role: 'TENANT_OWNER',
        status: 'pending',
      });
    }

    const hasPassword =
      typeof owner.passwordHash === 'string' && owner.passwordHash.trim().length > 0;
    const shouldSendInvite = !hasPassword || owner.status === 'pending' || owner.status === 'invited';

    const tenant = await this.tenantModel.create({
      name: dto.name,
      slug: dto.slug,
      status: 'ONBOARDING',
      ownerId: owner._id,
      planId: dto.planId ? new Types.ObjectId(dto.planId) : null,
      timezone: dto.timezone ?? 'Asia/Riyadh',
    });

    const staff = await this.staffModel.create({
      userId: owner._id,
      tenantId: tenant._id,
      roleSlug: 'clinic_admin',
      status: shouldSendInvite ? 'invited' : 'active',
      ...(shouldSendInvite ? { invitedAt: new Date() } : { joinedAt: new Date() }),
    });

    let inviteSetupUrl: string | undefined;
    if (shouldSendInvite) {
      const token = await this.authService.generateInviteToken(owner._id.toString(), 'invite');
      inviteSetupUrl = await this.emailService.sendInviteEmail(owner.email, owner.name, token);
    }

    await this.notificationsService.createForAdmins({
      type: 'tenant_created',
      title: 'New tenant',
      message: `${tenant.name} (${tenant.slug})`,
      link: `/admin/tenants/${tenant._id}`,
      meta: { tenantId: tenant._id.toString(), name: tenant.name },
      priority: 'normal',
    });

    if (adminUserId) {
      await this.auditService.log(
        'tenant.created',
        adminUserId,
        { tenantId: tenant._id.toString(), name: tenant.name, slug: tenant.slug },
        tenant._id.toString(),
      );
    }

    if (dto.templateId) {
      if (!selectedTemplate) {
        throw new NotFoundException('Agent template not found');
      }
      const createdInstance = await this.agentInstanceModel.create({
        tenantId: tenant._id,
        templateId: new Types.ObjectId(dto.templateId),
        name: `${tenant.name} Assistant`,
        channelsEnabled: this.resolveInitialChannels(dto.channelsEnabled, selectedTemplate),
        channel: this.resolveInitialChannel(dto.channelsEnabled, selectedTemplate),
        templateVersion: selectedTemplate.version ?? 1,
        status: 'paused',
        customConfig: {},
      });
      if (this.agentRolloutService.isAutoDeployOnCreateEnabled()) {
        await this.agentDeploymentService.enqueueDeployment(
          createdInstance._id.toString(),
          tenant._id.toString(),
        );
      }
    }

    return { tenant, owner, staff, inviteSetupUrl };
  }

  async resendInvite(tenantId: string) {
    const tenant = await this.tenantModel.findOne({ _id: tenantId, deletedAt: null });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const owner = await this.userModel.findById(tenant.ownerId);
    if (!owner) throw new NotFoundException('Owner not found');

    if (owner.status !== 'pending') {
      return { message: 'Owner account is already activated.' };
    }

    const token = await this.authService.generateInviteToken(owner._id.toString(), 'invite');
    const inviteSetupUrl = await this.emailService.sendInviteEmail(owner.email, owner.name, token);
    return { message: 'Invitation email has been resent.', inviteSetupUrl };
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

  async suspend(id: string, adminUserId?: string) {
    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'SUSPENDED' } },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (adminUserId) {
      await this.auditService.log(
        'tenant.disabled',
        adminUserId,
        { tenantId: id, name: tenant.name },
        id,
      );
    }
    return tenant;
  }

  async disable(id: string, adminUserId?: string) {
    return this.suspend(id, adminUserId);
  }

  async enable(id: string, _adminUserId?: string) {
    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'ACTIVE' } },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async remove(id: string, adminUserId?: string) {
    await this.agentDeploymentService.cleanupDeploymentsForTenant(id);

    const tenant = await this.tenantModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.staffModel.updateMany(
      { tenantId: tenant._id },
      { $set: { status: 'disabled' } },
    );
    if (adminUserId) {
      await this.auditService.log(
        'tenant.deleted',
        adminUserId,
        { tenantId: id, name: tenant.name },
        id,
      );
    }
    return { message: 'Tenant deleted' };
  }

  private resolveSupportedChannels(template: AgentTemplateDocument): string[] {
    if (Array.isArray(template.supportedChannels) && template.supportedChannels.length > 0) {
      return template.supportedChannels;
    }
    if (template.channel) {
      return [template.channel];
    }
    return ['chat'];
  }

  private resolveInitialChannels(
    requestedChannels: string[] | undefined,
    template: AgentTemplateDocument,
  ): string[] {
    if (Array.isArray(requestedChannels) && requestedChannels.length > 0) {
      return requestedChannels;
    }
    return this.resolveSupportedChannels(template);
  }

  private resolveInitialChannel(
    requestedChannels: string[] | undefined,
    template: AgentTemplateDocument,
  ): string {
    if (Array.isArray(requestedChannels) && requestedChannels.length > 0) {
      return requestedChannels[0];
    }
    if (template.supportedChannels.includes('chat')) {
      return 'chat';
    }
    return this.resolveSupportedChannels(template)[0] ?? 'chat';
  }

}
