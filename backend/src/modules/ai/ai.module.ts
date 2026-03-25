import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { QueueModule } from '../queue/queue.module';
import { UsersModule } from '../users/users.module';
import {
  DietPlan,
  DietPlanSchema,
} from '../diet/schemas/diet-plan.schema';
import { DietModule } from '../diet/diet.module';
import {
  ProgressCheckIn,
  ProgressCheckInSchema,
} from '../progress/schemas/progress-check-in.schema';
import {
  WorkoutPlan,
  WorkoutPlanSchema,
} from '../workouts/schemas/workout-plan.schema';
import { WorkoutsModule } from '../workouts/workouts.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiInteraction, AiInteractionSchema } from './schemas/ai-interaction.schema';

@Module({
  imports: [
    UsersModule,
    QueueModule,
    WorkoutsModule,
    DietModule,
    MongooseModule.forFeature([
      { name: AiInteraction.name, schema: AiInteractionSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: DietPlan.name, schema: DietPlanSchema },
      { name: ProgressCheckIn.name, schema: ProgressCheckInSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
