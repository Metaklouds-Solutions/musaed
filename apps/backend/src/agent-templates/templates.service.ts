import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentTemplate, AgentTemplateDocument } from './schemas/agent-template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(AgentTemplate.name) private templateModel: Model<AgentTemplateDocument>,
  ) {}

  async findAll(query: { channel?: string; page?: number; limit?: number }) {
    const { channel, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (channel) filter.channel = channel;

    const [data, total] = await Promise.all([
      this.templateModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.templateModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const template = await this.templateModel.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(dto: CreateTemplateDto, userId: string) {
    return this.templateModel.create({
      ...dto,
      createdBy: new Types.ObjectId(userId),
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const template = await this.templateModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async remove(id: string) {
    const template = await this.templateModel.findByIdAndDelete(id);
    if (!template) throw new NotFoundException('Template not found');
    return { message: 'Template deleted' };
  }
}
