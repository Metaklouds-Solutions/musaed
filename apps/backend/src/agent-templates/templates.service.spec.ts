import { Types } from 'mongoose';
import { TemplatesService } from './templates.service';

describe('TemplatesService capabilityLevel compatibility', () => {
  function buildService() {
    const model = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    const service = new TemplatesService(model as never);
    return { service, model };
  }

  it('normalizes legacy capability on create while keeping shared channel resolver path', async () => {
    const { service, model } = buildService();
    model.create.mockResolvedValue({ _id: 'tpl-1' });

    await service.create(
      {
        name: 'Template',
        channel: 'voice',
        supportedChannels: ['voice'],
        capabilityLevel: 'standard',
      } as never,
      new Types.ObjectId().toString(),
    );

    expect(model.create).toHaveBeenCalledTimes(1);
    const payload = model.create.mock.calls[0][0];
    expect(payload.capabilityLevel).toBe('L2');
    expect(payload.channel).toBe('voice');
    expect(payload.supportedChannels).toEqual(['voice']);
  });

  it('normalizes legacy capability on import and defaults to L1 when omitted', async () => {
    const { service, model } = buildService();
    model.findOne.mockResolvedValue(null);
    model.create.mockResolvedValue({ _id: 'tpl-2' });

    await service.importTemplate(
      {
        name: 'Imported',
        slug: 'imported-template',
        supportedChannels: ['chat'],
        flowTemplate: { response_engine: { type: 'retell-llm' } },
        capabilityLevel: 'enterprise',
      },
      new Types.ObjectId().toString(),
    );

    const payloadWithLegacy = model.create.mock.calls[0][0];
    expect(payloadWithLegacy.capabilityLevel).toBe('L4');
    expect(payloadWithLegacy.channel).toBe('chat');

    await service.importTemplate(
      {
        name: 'Imported 2',
        slug: 'imported-template-2',
        supportedChannels: ['chat'],
        flowTemplate: { response_engine: { type: 'retell-llm' } },
      },
      new Types.ObjectId().toString(),
    );

    const payloadWithoutCapability = model.create.mock.calls[1][0];
    expect(payloadWithoutCapability.capabilityLevel).toBe('L1');
  });

  it('normalizes capability on update without bypassing shared resolver', async () => {
    const { service, model } = buildService();
    const existing = {
      _id: 'tpl-3',
      channel: 'chat',
      supportedChannels: ['chat'],
      flowTemplate: { response_engine: { type: 'retell-llm' } },
      version: 1,
      get(key: string) {
        return (this as Record<string, unknown>)[key];
      },
    };
    model.findOne.mockResolvedValue(existing);
    model.findByIdAndUpdate.mockResolvedValue({ _id: 'tpl-3' });

    await service.update('tpl-3', { capabilityLevel: 'advanced' } as never);

    expect(model.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    const [, update] = model.findByIdAndUpdate.mock.calls[0];
    expect(update.$set.capabilityLevel).toBe('L3');
    expect(update.$set.channel).toBe('chat');
    expect(update.$set.supportedChannels).toEqual(['chat']);
  });
});
