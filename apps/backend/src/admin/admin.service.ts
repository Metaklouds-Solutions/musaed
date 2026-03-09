import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { TenantStaff, TenantStaffDocument } from '../tenants/schemas/tenant-staff.schema';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';
import { SupportTicket, SupportTicketDocument } from '../support/schemas/support-ticket.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantStaff.name) private staffModel: Model<TenantStaffDocument>,
    @InjectModel(AgentInstance.name) private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
  ) {}

  async getSystemOverview() {
    const [
      totalUsers,
      totalTenants,
      activeTenants,
      totalStaff,
      totalAgents,
      activeAgents,
      openTickets,
    ] = await Promise.all([
      this.userModel.countDocuments({ deletedAt: null }),
      this.tenantModel.countDocuments({ deletedAt: null }),
      this.tenantModel.countDocuments({ deletedAt: null, status: 'ACTIVE' }),
      this.staffModel.countDocuments(),
      this.instanceModel.countDocuments(),
      this.instanceModel.countDocuments({ status: 'active' }),
      this.ticketModel.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    ]);

    return {
      totalUsers,
      totalTenants,
      activeTenants,
      totalStaff,
      totalAgents,
      activeAgents,
      openTickets,
    };
  }

  async getSystemHealth() {
    const mem = process.memoryUsage();
    const MB = 1024 * 1024;
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / MB),
        heapTotalMB: Math.round(mem.heapTotal / MB),
        rssMB: Math.round(mem.rss / MB),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
