import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SubscriptionCustomerDocument = HydratedDocument<SubscriptionCustomer>;

@Schema({ timestamps: true, collection: 'subscription_customers' })
export class SubscriptionCustomer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, index: true })
  stripeCustomerId!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubscriptionCustomerSchema =
  SchemaFactory.createForClass(SubscriptionCustomer);
