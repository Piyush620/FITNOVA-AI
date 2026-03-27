import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SubscriptionRecordDocument = HydratedDocument<SubscriptionRecord>;

export const subscriptionPlans = ['free', 'monthly', 'yearly'] as const;
export type SubscriptionPlan = (typeof subscriptionPlans)[number];

export const subscriptionStatuses = [
  'inactive',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused',
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

@Schema({ timestamps: true, collection: 'subscriptions' })
export class SubscriptionRecord {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, index: true })
  stripeSubscriptionId!: string;

  @Prop({ required: true, trim: true })
  stripePriceId!: string;

  @Prop({ required: true, enum: subscriptionPlans, default: 'free' })
  plan!: SubscriptionPlan;

  @Prop({ required: true, enum: subscriptionStatuses, default: 'inactive' })
  status!: SubscriptionStatus;

  @Prop()
  currentPeriodStart?: Date;

  @Prop()
  currentPeriodEnd?: Date;

  @Prop({ default: false })
  cancelAtPeriodEnd!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubscriptionRecordSchema =
  SchemaFactory.createForClass(SubscriptionRecord);
SubscriptionRecordSchema.index({ userId: 1, updatedAt: -1 });
