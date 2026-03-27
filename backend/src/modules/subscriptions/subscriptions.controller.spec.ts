import { Test, TestingModule } from '@nestjs/testing';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: {
    getStatus: jest.Mock;
    createCheckoutSession: jest.Mock;
    handleWebhook: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getStatus: jest.fn(),
      createCheckoutSession: jest.fn(),
      handleWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns subscription status from the service', () => {
    service.getStatus.mockReturnValue({
      stripeConfigured: false,
      postgresConfigured: false,
      monthlyPriceConfigured: false,
      yearlyPriceConfigured: false,
    });

    expect(controller.getStatus()).toEqual({
      stripeConfigured: false,
      postgresConfigured: false,
      monthlyPriceConfigured: false,
      yearlyPriceConfigured: false,
    });
    expect(service.getStatus).toHaveBeenCalled();
  });

  it('forwards checkout session requests for the authenticated user', () => {
    service.createCheckoutSession.mockReturnValue({
      requestedPlan: 'monthly',
    });

    const payload = {
      plan: 'monthly' as const,
      successUrl: 'https://app.fitnova.ai/billing/success',
      cancelUrl: 'https://app.fitnova.ai/billing/cancel',
    };

    expect(controller.createCheckoutSession({ sub: 'user-1' } as never, payload)).toEqual({
      requestedPlan: 'monthly',
    });
    expect(service.createCheckoutSession).toHaveBeenCalledWith('user-1', payload);
  });

  it('detects presence of the Stripe signature header on webhook calls', () => {
    service.handleWebhook.mockReturnValue({
      received: true,
    });

    expect(controller.handleWebhook('sig_123')).toEqual({
      received: true,
    });
    expect(service.handleWebhook).toHaveBeenCalledWith(true);
  });
});
