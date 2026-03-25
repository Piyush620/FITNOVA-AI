import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { CreateCheckInDto } from './dto/create-check-in.dto';
import { ProgressService } from './progress.service';

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('check-ins')
  @ApiOperation({ summary: 'Create a progress check-in for the current user' })
  async createCheckIn(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CreateCheckInDto,
  ) {
    return this.progressService.createCheckIn(user.sub, payload);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get progress check-in history for the current user' })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.progressService.getHistory(user.sub, pagination);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get progress summary for the current user' })
  async getSummary(@CurrentUser() user: JwtPayload) {
    return this.progressService.getSummary(user.sub);
  }
}
