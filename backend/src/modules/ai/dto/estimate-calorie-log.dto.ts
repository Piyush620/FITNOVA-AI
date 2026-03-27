import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsString, MaxLength } from 'class-validator';

import { calorieMealTypes, type CalorieMealType } from '../../calorie-logs/schemas/calorie-log.schema';

export class EstimateCalorieLogDto {
  @ApiProperty({ example: '2026-03-27' })
  @IsDateString()
  loggedDate!: string;

  @ApiProperty({ enum: calorieMealTypes, example: 'dinner' })
  @IsEnum(calorieMealTypes)
  mealType!: CalorieMealType;

  @ApiProperty({ example: '2 rotis, dal, paneer sabzi and curd' })
  @IsString()
  @MaxLength(1000)
  rawInput!: string;
}
