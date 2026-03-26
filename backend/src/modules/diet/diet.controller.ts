import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { DietService } from './diet.service';

@ApiTags('Diet')
@ApiBearerAuth()
@Controller('diet')
export class DietController {
  constructor(private readonly dietService: DietService) {}

  @Post('plans')
  @ApiOperation({ summary: 'Create a diet plan for the current user' })
  async createPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CreateDietPlanDto,
  ) {
    return this.dietService.createPlan(user.sub, payload);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all diet plans for the current user' })
  async listPlans(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.dietService.listPlans(user.sub, pagination);
  }

  @Get('plans/active')
  @ApiOperation({ summary: 'Get the active diet plan for the current user' })
  async getActivePlan(@CurrentUser() user: JwtPayload) {
    return this.dietService.getActivePlan(user.sub);
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Get a diet plan by id' })
  async getPlanById(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.dietService.getPlanById(user.sub, planId);
  }

  @Post('plans/:planId/activate')
  @ApiOperation({ summary: 'Activate a diet plan and archive existing active plans' })
  async activatePlan(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.dietService.activatePlan(user.sub, planId);
  }

  @Post('plans/:planId/restart')
  @ApiOperation({ summary: 'Restart a completed diet plan as a fresh active cycle' })
  async restartPlan(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.dietService.restartPlan(user.sub, planId);
  }

  @Delete('plans/:planId')
  @ApiOperation({ summary: 'Delete a diet plan owned by the current user' })
  async deletePlan(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
  ) {
    return this.dietService.deletePlan(user.sub, planId);
  }

  @Post('plans/:planId/days/:dayNumber/meals/:mealType/complete')
  @ApiOperation({ summary: 'Mark a meal as completed' })
  async completeMeal(
    @CurrentUser() user: JwtPayload,
    @Param('planId') planId: string,
    @Param('dayNumber') dayNumber: string,
    @Param('mealType') mealType: string,
  ) {
    return this.dietService.completeMeal(user.sub, planId, Number(dayNumber), mealType);
  }
}
