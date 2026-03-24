import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CoachChatDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  message!: string;
}
