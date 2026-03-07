import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentInstance, AgentInstanceDocument } from './schemas/agent-instance.schema';
import { UpdatePromptsDto } from './dto/update-prompts.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel(AgentInstance.name) private instanceModel: Model<AgentInstanceDocument>,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.instanceModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: { $ne: 'deleted' } })
      .populate('templateId', 'name channel')
      .sort({ createdAt: -1 });
  }

  async findAllAdmin(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.instanceModel
        .find(filter)
        .populate('tenantId', 'name slug')
        .populate('templateId', 'name channel')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.instanceModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, tenantId?: string) {
    const filter: any = { _id: id };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const instance = await this.instanceModel
      .findOne(filter)
      .populate('templateId')
      .populate('tenantId', 'name slug');

    if (!instance) throw new NotFoundException('Agent instance not found');
    return instance;
  }

  async findByTenantId(tenantId: string) {
    return this.instanceModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: { $ne: 'deleted' } })
      .populate('templateId', 'name channel');
  }

  async updatePrompts(id: string, tenantId: string, dto: UpdatePromptsDto) {
    const instance = await this.instanceModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { $set: { customPrompts: dto.customPrompts } },
      { new: true },
    );
    if (!instance) throw new NotFoundException('Agent instance not found');
    return instance;
  }

  async syncAgent(id: string, tenantId: string) {
    const instance = await this.instanceModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!instance) throw new NotFoundException('Agent instance not found');

    // TODO: Call Retell API GET /get-agent/{retellAgentId} and update configSnapshot
    instance.lastSyncedAt = new Date();
    await instance.save();

    return instance;
  }
}
