import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: ['monthly', 'yearly'] })
  @IsIn(['monthly', 'yearly'])
  plan!: 'monthly' | 'yearly';

  @ApiProperty()
  @IsString()
  successUrl!: string;

  @ApiProperty()
  @IsString()
  cancelUrl!: string;
}
