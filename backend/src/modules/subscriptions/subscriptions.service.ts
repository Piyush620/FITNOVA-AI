import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    return {
      stripeConfigured: !!this.configService.get<string>('stripe.secretKey'),
      postgresConfigured: !!this.configService.get<string>('postgres.url'),
      monthlyPriceConfigured: !!this.configService.get<string>('stripe.priceMonthly'),
      yearlyPriceConfigured: !!this.configService.get<string>('stripe.priceYearly'),
    };
  }

  createCheckoutSession(userId: string, payload: CreateCheckoutSessionDto) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    const priceId =
      payload.plan === 'monthly'
        ? this.configService.get<string>('stripe.priceMonthly')
        : this.configService.get<string>('stripe.priceYearly');

    if (!secretKey || !priceId) {
      throw new ServiceUnavailableException(
        'Stripe is not fully configured. Add STRIPE_SECRET_KEY and the relevant Stripe price ids to enable subscriptions.',
      );
    }

    return {
      message: 'Stripe checkout session creation scaffold is ready.',
      nextStep: 'Integrate the Stripe SDK and persist subscription records in PostgreSQL once live billing setup is available.',
      userId,
      requestedPlan: payload.plan,
      priceId,
      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,
    };
  }

  handleWebhook(signaturePresent: boolean) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret || !signaturePresent) {
      throw new ServiceUnavailableException(
        'Stripe webhook verification is not configured. Add STRIPE_WEBHOOK_SECRET and provide the Stripe signature header.',
      );
    }

    return {
      received: true,
      verified: true,
      message: 'Webhook scaffold is in place. Add Stripe event persistence once billing goes live.',
    };
  }
}
