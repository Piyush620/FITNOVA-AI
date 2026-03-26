import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class GenerateWorkoutPlanDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  weight!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  goal!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(40)
  experience!: string;

  @ApiProperty({ minimum: 3, maximum: 7 })
  @IsInt()
  @Min(3)
  @Max(7)
  trainingDaysPerWeek!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  equipment!: string;
}
