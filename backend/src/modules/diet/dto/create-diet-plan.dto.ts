import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum MealType {
  BREAKFAST = 'breakfast',
  MID_MORNING = 'mid-morning',
  LUNCH = 'lunch',
  EVENING_SNACK = 'evening-snack',
  DINNER = 'dinner',
  POST_WORKOUT = 'post-workout',
}

enum DietPreference {
  VEG = 'veg',
  NON_VEG = 'non-veg',
  EGGETARIAN = 'eggetarian',
}

export class CreateMealDto {
  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  type!: MealType;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  items?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2500)
  calories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  proteinGrams?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  carbsGrams?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  fatsGrams?: number;
}

export class CreateDietDayDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(7)
  dayNumber!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(40)
  dayLabel!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  theme?: string;

  @ApiProperty({ type: [CreateMealDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CreateMealDto)
  meals!: CreateMealDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6000)
  targetCalories?: number;
}

export class CreateDietPlanDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  goal!: string;

  @ApiProperty({ enum: DietPreference })
  @IsEnum(DietPreference)
  preference!: DietPreference;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(6000)
  targetCalories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activateNow?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAiGenerated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [CreateDietDayDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => CreateDietDayDto)
  days!: CreateDietDayDto[];
}
