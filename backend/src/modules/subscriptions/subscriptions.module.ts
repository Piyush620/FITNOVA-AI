import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import {
  SubscriptionCustomer,
  SubscriptionCustomerSchema,
} from './schemas/subscription-customer.schema';
import {
  SubscriptionRecord,
  SubscriptionRecordSchema,
} from './schemas/subscription-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionCustomer.name, schema: SubscriptionCustomerSchema },
      { name: SubscriptionRecord.name, schema: SubscriptionRecordSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
