import { Test, TestingModule } from '@nestjs/testing';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: {
    getStatus: jest.Mock;
    getCurrentSubscription: jest.Mock;
    createCheckoutSession: jest.Mock;
    confirmCheckoutSession: jest.Mock;
    handleWebhook: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getStatus: jest.fn(),
      getCurrentSubscription: jest.fn(),
      createCheckoutSession: jest.fn(),
      confirmCheckoutSession: jest.fn(),
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
      persistenceConfigured: true,
      persistenceProvider: 'mongodb',
      monthlyPriceConfigured: false,
      yearlyPriceConfigured: false,
    });

    expect(controller.getStatus()).toEqual({
      stripeConfigured: false,
      persistenceConfigured: true,
      persistenceProvider: 'mongodb',
      monthlyPriceConfigured: false,
      yearlyPriceConfigured: false,
    });
  });

  it('returns the current user subscription summary', async () => {
    service.getCurrentSubscription.mockResolvedValue({
      tier: 'free',
      plan: 'free',
      status: 'inactive',
      hasPremiumAccess: false,
    });

    await expect(controller.getCurrentSubscription({ sub: 'user-1' } as never)).resolves.toEqual({
      tier: 'free',
      plan: 'free',
      status: 'inactive',
      hasPremiumAccess: false,
    });
    expect(service.getCurrentSubscription).toHaveBeenCalledWith('user-1');
  });

  it('forwards checkout session requests for the authenticated user', async () => {
    service.createCheckoutSession.mockResolvedValue({
      requestedPlan: 'monthly',
    });

    const payload = {
      plan: 'monthly' as const,
      successUrl: 'https://app.fitnova.ai/billing/success',
      cancelUrl: 'https://app.fitnova.ai/billing/cancel',
    };

    await expect(
      controller.createCheckoutSession({ sub: 'user-1' } as never, payload),
    ).resolves.toEqual({
      requestedPlan: 'monthly',
    });
    expect(service.createCheckoutSession).toHaveBeenCalledWith('user-1', payload);
  });

  it('passes raw body and stripe signature to the webhook handler', async () => {
    service.handleWebhook.mockResolvedValue({
      received: true,
      verified: true,
    });

    await expect(
      controller.handleWebhook({ rawBody: Buffer.from('{}') } as never, 'sig_123'),
    ).resolves.toEqual({
      received: true,
      verified: true,
    });
    expect(service.handleWebhook).toHaveBeenCalledWith(Buffer.from('{}'), 'sig_123');
  });

  it('confirms checkout sessions for the authenticated user', async () => {
    service.confirmCheckoutSession.mockResolvedValue({
      tier: 'premium',
      plan: 'monthly',
      status: 'active',
      hasPremiumAccess: true,
    });

    await expect(
      controller.confirmCheckoutSession({ sub: 'user-1' } as never, 'cs_test_123'),
    ).resolves.toEqual({
      tier: 'premium',
      plan: 'monthly',
      status: 'active',
      hasPremiumAccess: true,
    });
    expect(service.confirmCheckoutSession).toHaveBeenCalledWith('user-1', 'cs_test_123');
  });
});
