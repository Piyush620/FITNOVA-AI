import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

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

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  equipment!: string;
}
