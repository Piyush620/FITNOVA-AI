import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { WorkoutsService } from './workouts.service';

@ApiTags('Workouts')
@ApiBearerAuth()
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post('plans')
  @ApiOperation({ summary: 'Create a workout plan for the current user' })
  async createPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CreateWorkoutPlanDto,
  ) {
    return this.workoutsService.createPlan(user.sub, payload);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all workout plans for the current user' })
  async listPlans(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.workoutsService.listPlans(user.sub, pagination);
  }

  @Get('plans/active')
  @ApiOperation({ summary: 'Get the active workout plan for the current user' })
  async getActivePlan(@CurrentUser() user: JwtPayload) {
    return this.workoutsService.getActivePlan(user.sub);
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Get a workout plan by id' })
  async getPlanById(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.workoutsService.getPlanById(user.sub, planId);
  }

  @Post('plans/:planId/activate')
  @ApiOperation({ summary: 'Activate a workout plan and archive any existing active plan' })
  async activatePlan(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.workoutsService.activatePlan(user.sub, planId);
  }

  @Post('plans/:planId/restart')
  @ApiOperation({ summary: 'Restart a completed workout plan as a fresh active cycle' })
  async restartPlan(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.workoutsService.restartPlan(user.sub, planId);
  }

  @Delete('plans/:planId')
  @ApiOperation({ summary: 'Delete a workout plan owned by the current user' })
  async deletePlan(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.workoutsService.deletePlan(user.sub, planId);
  }

  @Post('plans/:planId/sessions/:dayNumber/complete')
  @ApiOperation({ summary: 'Mark a workout day as completed' })
  async completeSession(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
    @Param('dayNumber', ParseIntPipe) dayNumber: number,
  ) {
    return this.workoutsService.completeSession(user.sub, planId, dayNumber);
  }
}
