import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from 'src/modules/auth/schemas/user.schema';
import {
  CalorieLog,
  CalorieLogSchema,
} from 'src/modules/calorie-logs/schemas/calorie-log.schema';
import {
  DietPlan,
  DietPlanSchema,
} from 'src/modules/diet/schemas/diet-plan.schema';
import {
  ProgressCheckIn,
  ProgressCheckInSchema,
} from 'src/modules/progress/schemas/progress-check-in.schema';
import {
  WorkoutPlan,
  WorkoutPlanSchema,
} from 'src/modules/workouts/schemas/workout-plan.schema';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: DietPlan.name, schema: DietPlanSchema },
      { name: CalorieLog.name, schema: CalorieLogSchema },
      { name: ProgressCheckIn.name, schema: ProgressCheckInSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
