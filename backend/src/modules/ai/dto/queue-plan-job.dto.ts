import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject } from 'class-validator';

export class QueuePlanJobDto {
  @ApiProperty({ enum: ['workout-plan', 'diet-plan', 'adaptive-check-in'] })
  @IsIn(['workout-plan', 'diet-plan', 'adaptive-check-in'])
  jobName!: 'workout-plan' | 'diet-plan' | 'adaptive-check-in';

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;
}
