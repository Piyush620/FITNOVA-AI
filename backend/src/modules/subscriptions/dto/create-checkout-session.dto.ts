import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: ['monthly', 'yearly'] })
  @IsIn(['monthly', 'yearly'])
  plan!: 'monthly' | 'yearly';

  @ApiProperty()
  @IsString()
  @IsUrl({ require_tld: false })
  successUrl!: string;

  @ApiProperty()
  @IsString()
  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
