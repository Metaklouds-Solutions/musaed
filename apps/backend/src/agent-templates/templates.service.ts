import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AgentTemplate,
  AgentTemplateDocument,
} from './schemas/agent-template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ImportTemplateDto } from './dto/import-template.dto';
import { normalizeFlowTemplateUrls } from './template-transform.util';
import {
  Channel,
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

const LEGACY_CAPABILITY_TO_CURRENT: Record<string, string> = {
  basic: 'L1',
  standard: 'L2',
  advanced: 'L3',
  enterprise: 'L4',
};

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(AgentTemplate.name)
    private templateModel: Model<AgentTemplateDocument>,
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
    const template = await this.templateModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(dto: CreateTemplateDto, userId: string) {
    const prepared = this.resolveTemplateChannelsAndFlow({
      channel: dto.channel,
      supportedChannels: dto.supportedChannels,
      flowTemplate: dto.flowTemplate,
      requireFlowTemplate: false,
    });
    const capabilityLevel = this.resolveCapabilityLevel(dto.capabilityLevel);
    return this.templateModel.create({
      ...dto,
      supportedChannels: prepared.supportedChannels,
      channel: prepared.channel,
      ...(prepared.flowTemplate ? { flowTemplate: prepared.flowTemplate } : {}),
      ...(capabilityLevel ? { capabilityLevel } : {}),
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

    const prepared = this.resolveTemplateChannelsAndFlow({
      supportedChannels: dto.supportedChannels,
      flowTemplate: dto.flowTemplate,
      requireFlowTemplate: true,
    });

    return this.templateModel.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? '',
      category: dto.category ?? '',
      capabilityLevel: this.resolveCapabilityLevel(dto.capabilityLevel) ?? 'L1',
      supportedChannels: prepared.supportedChannels,
      channel: prepared.channel,
      flowTemplate: prepared.flowTemplate,
      version: 1,
      templateVariables: {
        flowName: dto.flowName ?? '',
      },
      createdBy: new Types.ObjectId(userId),
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const existing = await this.templateModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!existing) throw new NotFoundException('Template not found');

    const patch: Partial<UpdateTemplateDto & { version: number }> = { ...dto };
    const prepared = this.resolveTemplateChannelsAndFlow({
      channel: dto.channel ?? existing.channel,
      supportedChannels: dto.supportedChannels ?? existing.supportedChannels,
      flowTemplate: dto.flowTemplate ?? existing.flowTemplate,
      requireFlowTemplate: true,
    });
    patch.supportedChannels = prepared.supportedChannels;
    patch.channel = prepared.channel;
    if (dto.capabilityLevel !== undefined) {
      patch.capabilityLevel = this.resolveCapabilityLevel(dto.capabilityLevel);
    }
    if (dto.flowTemplate) {
      patch.flowTemplate = prepared.flowTemplate;
    }

    if (this.hasFlowImpactingChanges(existing, patch)) {
      patch.version = (existing.version ?? 1) + 1;
    }

    const template = await this.templateModel.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true },
    );
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

  private resolveTemplateChannelsAndFlow(input: {
    channel?: string;
    supportedChannels?: string[];
    flowTemplate?: Record<string, unknown>;
    requireFlowTemplate: boolean;
  }): {
    flowTemplate?: Record<string, unknown>;
    supportedChannels: Channel[];
    channel: Channel;
  } {
    const channelsInput =
      input.supportedChannels ??
      (typeof input.channel === 'string' && input.channel.length > 0
        ? [input.channel]
        : []);
    if (channelsInput.length === 0) {
      throw new BadRequestException(
        'supportedChannels must contain at least one channel',
      );
    }

    const supportedChannels = normalizeSupportedChannels(channelsInput);
    const channel =
      typeof input.channel === 'string' &&
      supportedChannels.some((supported) => supported === input.channel)
        ? (input.channel as Channel)
        : selectDefaultChannel(supportedChannels);

    if (!input.flowTemplate) {
      if (input.requireFlowTemplate) {
        throw new BadRequestException('flowTemplate is required');
      }
      return { supportedChannels, channel };
    }

    const normalizedFlowTemplate = normalizeFlowTemplateUrls(input.flowTemplate);
    validateFlowTemplateForChannels(normalizedFlowTemplate, supportedChannels);
    return {
      flowTemplate: normalizedFlowTemplate,
      supportedChannels,
      channel,
    };
  }

  private resolveCapabilityLevel(
    rawValue?: string,
  ): string | undefined {
    if (typeof rawValue !== 'string') {
      return undefined;
    }
    const value = rawValue.trim();
    if (value.length === 0) {
      return undefined;
    }
    const upper = value.toUpperCase();
    if (upper === 'L1' || upper === 'L2' || upper === 'L3' || upper === 'L4') {
      return upper;
    }
    return LEGACY_CAPABILITY_TO_CURRENT[value.toLowerCase()] ?? value;
  }
}
