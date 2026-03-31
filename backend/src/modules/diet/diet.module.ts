import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CalorieLog, CalorieLogSchema } from '../calorie-logs/schemas/calorie-log.schema';
import { DietController } from './diet.controller';
import { DietService } from './diet.service';
import { DietPlan, DietPlanSchema } from './schemas/diet-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DietPlan.name, schema: DietPlanSchema },
      { name: CalorieLog.name, schema: CalorieLogSchema },
    ]),
  ],
  controllers: [DietController],
  providers: [DietService],
  exports: [DietService],
})
export class DietModule {}
