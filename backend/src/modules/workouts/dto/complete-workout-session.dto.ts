import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class CompleteWorkoutSessionDto {
  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  completedDate?: string;
}
