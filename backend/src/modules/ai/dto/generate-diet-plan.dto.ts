import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

enum DietPreference {
  VEG = 'veg',
  NON_VEG = 'non-veg',
  EGGETARIAN = 'eggetarian',
}

enum BudgetLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

enum CuisineRegion {
  NORTH_INDIAN = 'north-indian',
  SOUTH_INDIAN = 'south-indian',
  EAST_INDIAN = 'east-indian',
  WEST_INDIAN = 'west-indian',
  MIXED = 'mixed-indian',
}

export class GenerateDietPlanDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  goal!: string;

  @ApiProperty()
  @IsInt()
  @Min(30)
  @Max(300)
  currentWeightKg!: number;

  @ApiProperty()
  @IsInt()
  @Min(30)
  @Max(300)
  targetWeightKg!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(52)
  timelineWeeks!: number;

  @ApiProperty({ enum: DietPreference })
  @IsEnum(DietPreference)
  preference!: DietPreference;

  @ApiProperty({ enum: CuisineRegion })
  @IsEnum(CuisineRegion)
  cuisineRegion!: CuisineRegion;

  @ApiProperty({ enum: BudgetLevel })
  @IsEnum(BudgetLevel)
  budget!: BudgetLevel;
}
