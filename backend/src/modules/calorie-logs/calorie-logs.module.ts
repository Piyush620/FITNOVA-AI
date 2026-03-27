import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { DietPlan, DietPlanSchema } from '../diet/schemas/diet-plan.schema';
import { WorkoutPlan, WorkoutPlanSchema } from '../workouts/schemas/workout-plan.schema';

import { CalorieLogsController } from './calorie-logs.controller';
import { CalorieLogsService } from './calorie-logs.service';
import { CalorieLog, CalorieLogSchema } from './schemas/calorie-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalorieLog.name, schema: CalorieLogSchema },
      { name: User.name, schema: UserSchema },
      { name: DietPlan.name, schema: DietPlanSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
    ]),
  ],
  controllers: [CalorieLogsController],
  providers: [CalorieLogsService],
  exports: [CalorieLogsService],
})
export class CalorieLogsModule {}
