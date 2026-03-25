import { WebhookProcessor } from './webhook.processor';

describe('WebhookProcessor', () => {
  const webhooksService = {
    claimProcessedEvent: jest.fn(),
    releaseProcessedEvent: jest.fn(),
    handleInvoicePaid: jest.fn(),
    handleInvoiceFailed: jest.fn(),
    handleSubscriptionDeleted: jest.fn(),
    handleRetellCallStarted: jest.fn(),
    handleRetellCallEnded: jest.fn(),
    handleRetellCallAnalyzed: jest.fn(),
    handleRetellAlertTriggered: jest.fn(),
  };

  const notificationsService = {
    createForAdmins: jest.fn().mockResolvedValue(undefined),
  };

  const processor = new WebhookProcessor(
    webhooksService as never,
    notificationsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    webhooksService.claimProcessedEvent.mockResolvedValue(true);
  });

  it('keeps claim on successful processing', async () => {
    const job = {
      data: {
        source: 'stripe',
        eventId: 'evt_1',
        eventType: 'invoice.payment_succeeded',
        payload: { customer: 'cus_1' },
      },
    };

    await processor.process(job as never);

    expect(webhooksService.claimProcessedEvent).toHaveBeenCalledWith(
      'evt_1',
      'stripe',
      'invoice.payment_succeeded',
    );
    expect(webhooksService.handleInvoicePaid).toHaveBeenCalledWith({
      customer: 'cus_1',
    });
    expect(webhooksService.releaseProcessedEvent).not.toHaveBeenCalled();
  });

  it('releases claim when processing throws', async () => {
    webhooksService.handleInvoicePaid.mockRejectedValueOnce(
      new Error('boom'),
    );
    const job = {
      data: {
        source: 'stripe',
        eventId: 'evt_2',
        eventType: 'invoice.payment_succeeded',
        payload: { customer: 'cus_2' },
      },
    };

    await expect(processor.process(job as never)).rejects.toThrow('boom');
    expect(webhooksService.releaseProcessedEvent).toHaveBeenCalledWith(
      'evt_2',
      'stripe',
    );
  });

  it('skips processing when event is already claimed', async () => {
    webhooksService.claimProcessedEvent.mockResolvedValue(false);
    const job = {
      data: {
        source: 'retell',
        eventId: 'evt_3',
        eventType: 'call_started',
        payload: { event: 'call_started' },
      },
    };

    await processor.process(job as never);

    expect(webhooksService.handleRetellCallStarted).not.toHaveBeenCalled();
    expect(webhooksService.releaseProcessedEvent).not.toHaveBeenCalled();
  });
});
