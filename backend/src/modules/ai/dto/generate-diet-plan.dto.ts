import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

enum DietPreference {
  VEG = 'veg',
  NON_VEG = 'non-veg',
}

enum BudgetLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class GenerateDietPlanDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  goal!: string;

  @ApiProperty()
  @IsInt()
  @Min(1000)
  @Max(6000)
  calories!: number;

  @ApiProperty({ enum: DietPreference })
  @IsEnum(DietPreference)
  preference!: DietPreference;

  @ApiProperty({ enum: BudgetLevel })
  @IsEnum(BudgetLevel)
  budget!: BudgetLevel;
}
