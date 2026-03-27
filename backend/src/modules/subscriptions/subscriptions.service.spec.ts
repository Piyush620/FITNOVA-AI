import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionCustomer } from './schemas/subscription-customer.schema';
import { SubscriptionRecord } from './schemas/subscription-record.schema';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockConfigService: { get: jest.Mock };
  let mockSubscriptionCustomerModel: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };
  let mockSubscriptionRecordModel: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };
    mockSubscriptionCustomerModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    mockSubscriptionRecordModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(SubscriptionCustomer.name),
          useValue: mockSubscriptionCustomerModel,
        },
        {
          provide: getModelToken(SubscriptionRecord.name),
          useValue: mockSubscriptionRecordModel,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns billing configuration status flags', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'stripe.secretKey':
          return 'sk_test_123';
        case 'stripe.priceMonthly':
          return 'price_monthly';
        case 'stripe.priceYearly':
          return '';
        default:
          return undefined;
      }
    });

    expect(service.getStatus()).toEqual({
      stripeConfigured: true,
      persistenceConfigured: true,
      persistenceProvider: 'mongodb',
      monthlyPriceConfigured: true,
      yearlyPriceConfigured: false,
    });
  });

  it('returns a free summary when no billing records exist yet', async () => {
    mockSubscriptionCustomerModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    mockSubscriptionRecordModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.getCurrentSubscription('507f1f77bcf86cd799439011')).resolves.toEqual({
      tier: 'free',
      plan: 'free',
      status: 'inactive',
      hasPremiumAccess: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });

  it('creates a real checkout session payload when dependencies are available', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'stripe.priceMonthly') {
        return 'price_monthly';
      }

      return undefined;
    });

    const stripeMock = {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/pay/cs_test_123',
          }),
        },
      },
    };

    jest.spyOn(service as never, 'getStripeClientOrThrow' as never).mockReturnValue(stripeMock as never);
    jest.spyOn(service as never, 'findOrCreateCustomer' as never).mockResolvedValue({
      stripeCustomerId: 'cus_123',
    } as never);

    await expect(
      service.createCheckoutSession('507f1f77bcf86cd799439011', {
        plan: 'monthly',
        successUrl: 'https://app.fitnova.ai/billing/success',
        cancelUrl: 'https://app.fitnova.ai/billing/cancel',
      }),
    ).resolves.toEqual({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      userId: '507f1f77bcf86cd799439011',
      requestedPlan: 'monthly',
      priceId: 'price_monthly',
      stripeCustomerId: 'cus_123',
    });

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url:
          'https://app.fitnova.ai/billing/success?session_id={CHECKOUT_SESSION_ID}',
      }),
    );
  });

  it('throws when checkout is requested without Stripe configuration', async () => {
    await expect(
      service.createCheckoutSession('507f1f77bcf86cd799439011', {
        plan: 'yearly',
        successUrl: 'https://app.fitnova.ai/billing/success',
        cancelUrl: 'https://app.fitnova.ai/billing/cancel',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws when webhook verification setup is missing', async () => {
    await expect(service.handleWebhook(Buffer.from('{}'), 'sig_123')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('confirms checkout sessions directly from Stripe and returns synced subscription state', async () => {
    const session = {
      id: 'cs_test_123',
      client_reference_id: '507f1f77bcf86cd799439011',
      metadata: { userId: '507f1f77bcf86cd799439011' },
      customer: 'cus_123',
      subscription: 'sub_123',
    };
    const syncedSummary = {
      tier: 'premium',
      plan: 'monthly',
      status: 'active',
      hasPremiumAccess: true,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    const stripeMock = {
      checkout: {
        sessions: {
          retrieve: jest.fn().mockResolvedValue(session),
        },
      },
    };

    jest.spyOn(service as never, 'getStripeClientOrThrow' as never).mockReturnValue(stripeMock as never);
    jest.spyOn(service as never, 'handleCheckoutCompleted' as never).mockResolvedValue(undefined as never);
    jest.spyOn(service, 'getCurrentSubscription').mockResolvedValue(syncedSummary as never);

    await expect(
      service.confirmCheckoutSession('507f1f77bcf86cd799439011', 'cs_test_123'),
    ).resolves.toEqual(syncedSummary);
  });
});
