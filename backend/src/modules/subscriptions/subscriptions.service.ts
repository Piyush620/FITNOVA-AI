import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';

import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import {
  SubscriptionCustomer,
  SubscriptionCustomerDocument,
} from './schemas/subscription-customer.schema';
import {
  SubscriptionPlan,
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionStatus,
} from './schemas/subscription-record.schema';

type CurrentSubscriptionSummary = {
  tier: 'free' | 'premium';
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  hasPremiumAccess: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly stripeClient?: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(SubscriptionCustomer.name)
    private readonly subscriptionCustomerModel: Model<SubscriptionCustomerDocument>,
    @InjectModel(SubscriptionRecord.name)
    private readonly subscriptionRecordModel: Model<SubscriptionRecordDocument>,
  ) {
    const stripeSecretKey = this.configService.get<string>('stripe.secretKey');

    if (stripeSecretKey) {
      this.stripeClient = new Stripe(stripeSecretKey);
    }
  }

  getStatus() {
    return {
      stripeConfigured: !!this.configService.get<string>('stripe.secretKey'),
      persistenceConfigured: true,
      persistenceProvider: 'mongodb',
      monthlyPriceConfigured: !!this.configService.get<string>('stripe.priceMonthly'),
      yearlyPriceConfigured: !!this.configService.get<string>('stripe.priceYearly'),
    };
  }

  async getCurrentSubscription(userId: string): Promise<CurrentSubscriptionSummary> {
    const objectId = new Types.ObjectId(userId);
    const [customer, subscription] = await Promise.all([
      this.subscriptionCustomerModel.findOne({ userId: objectId }).lean(),
      this.subscriptionRecordModel.findOne({ userId: objectId }).sort({ updatedAt: -1 }).lean(),
    ]);

    if (!subscription) {
      return this.buildFreeSummary(customer?.stripeCustomerId ?? null);
    }

    return this.mapSubscriptionRecordToSummary(
      subscription,
      customer?.stripeCustomerId ?? null,
    );
  }

  async createCheckoutSession(userId: string, payload: CreateCheckoutSessionDto) {
    const stripe = this.getStripeClientOrThrow();
    const priceId =
      payload.plan === 'monthly'
        ? this.configService.get<string>('stripe.priceMonthly')
        : this.configService.get<string>('stripe.priceYearly');

    if (!priceId) {
      throw new ServiceUnavailableException(
        'Stripe is not fully configured. Add STRIPE_SECRET_KEY and the relevant Stripe price ids to enable subscriptions.',
      );
    }

    const successUrl = this.appendCheckoutSessionId(payload.successUrl);
    const customer = await this.findOrCreateCustomer(userId, stripe);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: payload.cancelUrl,
      client_reference_id: userId,
      allow_promotion_codes: true,
      metadata: {
        userId,
        requestedPlan: payload.plan,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
      userId,
      requestedPlan: payload.plan,
      priceId,
      stripeCustomerId: customer.stripeCustomerId,
    };
  }

  async confirmCheckoutSession(userId: string, sessionId: string) {
    const stripe = this.getStripeClientOrThrow();

    if (!sessionId) {
      throw new ServiceUnavailableException('Stripe checkout session id is required.');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionUserId = session.metadata?.userId ?? session.client_reference_id;

    if (sessionUserId !== userId) {
      this.logger.warn(`Checkout session ${sessionId} does not belong to user ${userId}`);
      return this.getCurrentSubscription(userId);
    }

    await this.handleCheckoutCompleted(stripe, session);
    return this.getCurrentSubscription(userId);
  }

  async handleWebhook(rawBody?: Buffer | string, stripeSignature?: string) {
    const stripe = this.getStripeClientOrThrow();
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    if (!webhookSecret || !stripeSignature || !rawBody) {
      throw new ServiceUnavailableException(
        'Stripe webhook verification is not configured. Add STRIPE_WEBHOOK_SECRET and provide the Stripe signature header.',
      );
    }

    const event = stripe.webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
    await this.processWebhookEvent(stripe, event);

    return {
      received: true,
      verified: true,
      type: event.type,
    };
  }

  private async processWebhookEvent(stripe: Stripe, event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(stripe, session);
        return;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.upsertSubscription(subscription);
        return;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        if (typeof invoice.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await this.upsertSubscription(subscription);
        }
        return;
      }
      default:
        this.logger.debug(`Ignoring unhandled Stripe event ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(
    stripe: Stripe,
    session: Stripe.Checkout.Session,
  ) {
    const userId = session.metadata?.userId ?? session.client_reference_id;
    const stripeCustomerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (!userId || !stripeCustomerId) {
      this.logger.warn(`Checkout session ${session.id} missing user/customer metadata`);
      return;
    }

    await this.upsertCustomer(userId, stripeCustomerId);

    if (typeof session.subscription === 'string') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await this.upsertSubscription(subscription, userId);
    }
  }

  private async findOrCreateCustomer(userId: string, stripe: Stripe) {
    const existing = await this.subscriptionCustomerModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    if (existing) {
      return {
        stripeCustomerId: existing.stripeCustomerId,
      };
    }

    const customer = await stripe.customers.create({
      metadata: {
        userId,
      },
    });

    await this.upsertCustomer(userId, customer.id);

    return {
      stripeCustomerId: customer.id,
    };
  }

  private async upsertCustomer(userId: string, stripeCustomerId: string) {
    await this.subscriptionCustomerModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        userId: new Types.ObjectId(userId),
        stripeCustomerId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async upsertSubscription(
    subscription: Stripe.Subscription,
    fallbackUserId?: string,
  ) {
    const stripeCustomerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id ?? null;

    if (!stripeCustomerId) {
      this.logger.warn(`Subscription ${subscription.id} missing Stripe customer id`);
      return;
    }

    const mappedUserId =
      fallbackUserId ??
      subscription.metadata?.userId ??
      (await this.findUserIdByCustomer(stripeCustomerId));

    if (!mappedUserId) {
      this.logger.warn(`Could not resolve user id for subscription ${subscription.id}`);
      return;
    }

    const price = subscription.items.data[0]?.price;
    const interval = price?.recurring?.interval;

    await this.subscriptionRecordModel.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      {
        userId: new Types.ObjectId(mappedUserId),
        stripeSubscriptionId: subscription.id,
        stripePriceId: price?.id ?? '',
        plan: this.resolvePlanInterval(interval),
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: this.toNullableDate(subscription.items.data[0]?.current_period_start),
        currentPeriodEnd: this.toNullableDate(subscription.items.data[0]?.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async findUserIdByCustomer(stripeCustomerId: string) {
    const customer = await this.subscriptionCustomerModel
      .findOne({ stripeCustomerId })
      .lean();

    return customer?.userId?.toString();
  }

  private mapSubscriptionRecordToSummary(
    record: SubscriptionRecordDocument | (SubscriptionRecord & { _id?: Types.ObjectId }),
    stripeCustomerId: string | null,
  ): CurrentSubscriptionSummary {
    const hasPremiumAccess = ['active', 'trialing'].includes(record.status);

    return {
      tier: hasPremiumAccess ? 'premium' : 'free',
      plan: record.plan ?? 'free',
      status: record.status,
      hasPremiumAccess,
      stripeCustomerId,
      stripeSubscriptionId: record.stripeSubscriptionId,
      currentPeriodStart: record.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: record.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    };
  }

  private buildFreeSummary(stripeCustomerId: string | null = null): CurrentSubscriptionSummary {
    return {
      tier: 'free',
      plan: 'free',
      status: 'inactive',
      hasPremiumAccess: false,
      stripeCustomerId,
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  private resolvePlanInterval(interval?: string | null): SubscriptionPlan {
    if (interval === 'year') {
      return 'yearly';
    }

    if (interval === 'month') {
      return 'monthly';
    }

    return 'free';
  }

  private appendCheckoutSessionId(url: string) {
    const separator = url.includes('?') ? '&' : '?';
    const hasSessionPlaceholder = url.includes('{CHECKOUT_SESSION_ID}') || url.includes('session_id=');

    if (hasSessionPlaceholder) {
      return url;
    }

    return `${url}${separator}session_id={CHECKOUT_SESSION_ID}`;
  }

  private toNullableDate(unixSeconds?: number | null) {
    if (!unixSeconds) {
      return undefined;
    }

    return new Date(unixSeconds * 1000);
  }

  private getStripeClientOrThrow() {
    if (!this.stripeClient) {
      throw new ServiceUnavailableException(
        'Stripe is not fully configured. Add STRIPE_SECRET_KEY and the relevant Stripe price ids to enable subscriptions.',
      );
    }

    return this.stripeClient;
  }
}
