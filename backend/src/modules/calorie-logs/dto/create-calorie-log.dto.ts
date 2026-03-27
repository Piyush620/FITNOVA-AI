import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { calorieLogSources, calorieMealTypes, type CalorieMealType } from '../schemas/calorie-log.schema';

class CreateCalorieLogItemDto {
  @ApiProperty({ example: 'Roti' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: '2 medium rotis' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quantity?: string;

  @ApiPropertyOptional({ example: 220 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCalories?: number;
}

export class CreateCalorieLogDto {
  @ApiProperty({ example: '2026-03-27' })
  @IsDateString()
  loggedDate!: string;

  @ApiProperty({ enum: calorieMealTypes, example: 'lunch' })
  @IsEnum(calorieMealTypes)
  mealType!: CalorieMealType;

  @ApiProperty({ example: 'Chicken rice bowl' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ enum: calorieLogSources, example: 'ai' })
  @IsOptional()
  @IsEnum(calorieLogSources)
  source?: 'manual' | 'ai';

  @ApiPropertyOptional({ example: '2 rotis, dal, paneer sabzi' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rawInput?: string;

  @ApiProperty({ example: 620 })
  @IsNumber()
  @Min(0)
  calories!: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinGrams?: number;

  @ApiPropertyOptional({ example: 68 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsGrams?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fatsGrams?: number;

  @ApiPropertyOptional({ example: 'Had this after a late meeting.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 0.82 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiPropertyOptional({ type: [CreateCalorieLogItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCalorieLogItemDto)
  parsedItems?: CreateCalorieLogItemDto[];
}
