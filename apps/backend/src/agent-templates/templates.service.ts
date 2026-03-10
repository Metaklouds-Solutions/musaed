import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentTemplate, AgentTemplateDocument } from './schemas/agent-template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ImportTemplateDto } from './dto/import-template.dto';
import { normalizeFlowTemplateUrls } from './template-transform.util';
import {
  normalizeSupportedChannels,
  selectDefaultChannel,
  validateFlowTemplateForChannels,
} from './flow-template.validator';

const FLOW_IMPACTING_FIELDS: Array<keyof UpdateTemplateDto> = [
  'flowTemplate',
  'channel',
  'supportedChannels',
  'voiceConfig',
  'chatConfig',
  'emailConfig',
  'llmConfig',
  'basePrompt',
  'templateVariables',
];

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(AgentTemplate.name) private templateModel: Model<AgentTemplateDocument>,
  ) {}

  async findAll(query: { channel?: string; page?: number; limit?: number }) {
    const { channel, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = { deletedAt: null };
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
    const template = await this.templateModel.findOne({ _id: id, deletedAt: null });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(dto: CreateTemplateDto, userId: string) {
    return this.templateModel.create({
      ...dto,
      createdBy: new Types.ObjectId(userId),
    });
  }

  async importTemplate(dto: ImportTemplateDto, userId: string) {
    const existing = await this.templateModel.findOne({
      slug: dto.slug,
      deletedAt: null,
    });
    if (existing) {
      throw new ConflictException('Template slug already exists');
    }

    const supportedChannels = normalizeSupportedChannels(dto.supportedChannels);
    const normalizedFlowTemplate = normalizeFlowTemplateUrls(dto.flowTemplate);
    validateFlowTemplateForChannels(normalizedFlowTemplate, supportedChannels);
    const channel = selectDefaultChannel(supportedChannels);

    return this.templateModel.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? '',
      category: dto.category ?? '',
      capabilityLevel: dto.capabilityLevel ?? 'L1',
      supportedChannels,
      channel,
      flowTemplate: normalizedFlowTemplate,
      version: 1,
      templateVariables: {
        flowName: dto.flowName ?? '',
      },
      createdBy: new Types.ObjectId(userId),
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const existing = await this.templateModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Template not found');

    const patch: Partial<UpdateTemplateDto & { version: number }> = { ...dto };
    const nextSupportedChannels = dto.supportedChannels
      ? normalizeSupportedChannels(dto.supportedChannels)
      : normalizeSupportedChannels(existing.supportedChannels);
    patch.supportedChannels = nextSupportedChannels;

    if (
      !patch.channel ||
      !nextSupportedChannels.some((channel) => channel === patch.channel)
    ) {
      patch.channel = selectDefaultChannel(nextSupportedChannels);
    }

    const effectiveFlowTemplate = normalizeFlowTemplateUrls(dto.flowTemplate ?? existing.flowTemplate);
    validateFlowTemplateForChannels(effectiveFlowTemplate, nextSupportedChannels);
    if (dto.flowTemplate) {
      patch.flowTemplate = effectiveFlowTemplate;
    }

    if (this.hasFlowImpactingChanges(existing, patch)) {
      patch.version = (existing.version ?? 1) + 1;
    }

    const template = await this.templateModel.findByIdAndUpdate(id, { $set: patch }, { new: true });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async remove(id: string) {
    const template = await this.templateModel.findByIdAndUpdate(
      id,
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!template) throw new NotFoundException('Template not found');
    return { message: 'Template archived' };
  }

  private hasFlowImpactingChanges(
    existing: AgentTemplateDocument,
    patch: Partial<UpdateTemplateDto>,
  ): boolean {
    return FLOW_IMPACTING_FIELDS.some((field) => {
      if (!(field in patch)) {
        return false;
      }
      const existingValue = existing.get(field);
      const nextValue = patch[field];
      return JSON.stringify(existingValue) !== JSON.stringify(nextValue);
    });
  }
}
