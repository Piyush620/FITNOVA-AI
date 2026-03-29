import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendEmailOtpDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
