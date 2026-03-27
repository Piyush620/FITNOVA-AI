import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
        case 'postgres.url':
          return 'postgres://localhost:5432/fitnova';
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
      postgresConfigured: true,
      monthlyPriceConfigured: true,
      yearlyPriceConfigured: false,
    });
  });

  it('returns checkout scaffold payload when Stripe configuration exists', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'stripe.secretKey':
          return 'sk_test_123';
        case 'stripe.priceMonthly':
          return 'price_monthly';
        default:
          return undefined;
      }
    });

    expect(
      service.createCheckoutSession('user-1', {
        plan: 'monthly',
        successUrl: 'https://app.fitnova.ai/billing/success',
        cancelUrl: 'https://app.fitnova.ai/billing/cancel',
      }),
    ).toEqual({
      message: 'Stripe checkout session creation scaffold is ready.',
      nextStep:
        'Integrate the Stripe SDK and persist subscription records in PostgreSQL once live billing setup is available.',
      userId: 'user-1',
      requestedPlan: 'monthly',
      priceId: 'price_monthly',
      successUrl: 'https://app.fitnova.ai/billing/success',
      cancelUrl: 'https://app.fitnova.ai/billing/cancel',
    });
  });

  it('throws when checkout scaffold is requested without Stripe configuration', () => {
    mockConfigService.get.mockReturnValue(undefined);

    expect(() =>
      service.createCheckoutSession('user-1', {
        plan: 'yearly',
        successUrl: 'https://app.fitnova.ai/billing/success',
        cancelUrl: 'https://app.fitnova.ai/billing/cancel',
      }),
    ).toThrow(ServiceUnavailableException);
  });

  it('verifies webhook scaffold only when secret and signature are present', () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'stripe.webhookSecret' ? 'whsec_test_123' : undefined,
    );

    expect(service.handleWebhook(true)).toEqual({
      received: true,
      verified: true,
      message: 'Webhook scaffold is in place. Add Stripe event persistence once billing goes live.',
    });
  });

  it('throws when webhook scaffold is called without verification setup', () => {
    mockConfigService.get.mockReturnValue(undefined);

    expect(() => service.handleWebhook(false)).toThrow(ServiceUnavailableException);
  });
});
