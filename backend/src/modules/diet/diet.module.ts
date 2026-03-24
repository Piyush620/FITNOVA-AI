import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DietController } from './diet.controller';
import { DietService } from './diet.service';
import { DietPlan, DietPlanSchema } from './schemas/diet-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DietPlan.name, schema: DietPlanSchema },
    ]),
  ],
  controllers: [DietController],
  providers: [DietService],
  exports: [DietService],
})
export class DietModule {}
