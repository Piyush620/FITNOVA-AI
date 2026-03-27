import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { CalorieLogsService } from './calorie-logs.service';
import { CreateCalorieLogDto } from './dto/create-calorie-log.dto';
import { DailyCalorieQueryDto } from './dto/daily-calorie-query.dto';
import { MonthlyCalorieQueryDto } from './dto/monthly-calorie-query.dto';
import { UpdateCalorieLogDto } from './dto/update-calorie-log.dto';

@ApiTags('Calorie Logs')
@ApiBearerAuth()
@Controller('calorie-logs')
export class CalorieLogsController {
  constructor(private readonly calorieLogsService: CalorieLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a calorie log entry for the current user' })
  async createLog(@CurrentUser() user: JwtPayload, @Body() payload: CreateCalorieLogDto) {
    return this.calorieLogsService.createLog(user.sub, payload);
  }

  @Patch(':logId')
  @ApiOperation({ summary: 'Update a calorie log entry owned by the current user' })
  async updateLog(
    @CurrentUser() user: JwtPayload,
    @Param('logId') logId: string,
    @Body() payload: UpdateCalorieLogDto,
  ) {
    return this.calorieLogsService.updateLog(user.sub, logId, payload);
  }

  @Delete(':logId')
  @ApiOperation({ summary: 'Delete a calorie log entry owned by the current user' })
  async deleteLog(@CurrentUser() user: JwtPayload, @Param('logId') logId: string) {
    return this.calorieLogsService.deleteLog(user.sub, logId);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get calorie log entries and totals for a specific date' })
  async getDailyLogs(@CurrentUser() user: JwtPayload, @Query() query: DailyCalorieQueryDto) {
    return this.calorieLogsService.getDailyLogs(user.sub, query.date);
  }

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Get monthly calorie totals, trends, and recommendations' })
  async getMonthlySummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: MonthlyCalorieQueryDto,
  ) {
    return this.calorieLogsService.getMonthlySummary(user.sub, query.month);
  }
}
