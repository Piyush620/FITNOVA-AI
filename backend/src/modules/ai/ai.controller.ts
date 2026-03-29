import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Premium } from 'src/common/decorators/premium.decorator';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { AiService } from './ai.service';
import { CalorieInsightsDto } from './dto/calorie-insights.dto';
import { CoachChatDto } from './dto/coach-chat.dto';
import { EstimateCalorieLogDto } from './dto/estimate-calorie-log.dto';
import { AdaptivePlanDto } from './dto/adaptive-plan.dto';
import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';
import { QueuePlanJobDto } from './dto/queue-plan-job.dto';
import { AiInteractionType } from './schemas/ai-interaction.schema';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get AI service configuration status' })
  getStatus() {
    return this.aiService.getStatus();
  }

  @Get('history')
  @Premium()
  @ApiOperation({ summary: 'Get AI interaction history for the current user' })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
  ) {
    const interactionType = Object.values(AiInteractionType).includes(type as AiInteractionType)
      ? (type as AiInteractionType)
      : undefined;

    return this.aiService.getHistory(user.sub, undefined, interactionType);
  }

  @Post('workout-plan')
  @Premium()
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a personalized workout plan' })
  async generateWorkoutPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateWorkoutPlanDto,
  ) {
    return this.aiService.generateWorkoutPlan(user.sub, payload);
  }

  @Post('diet-plan')
  @Premium()
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a personalized diet plan' })
  async generateDietPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateDietPlanDto,
  ) {
    return this.aiService.generateDietPlan(user.sub, payload);
  }

  @Post('workout-plan/save')
  @Premium()
  @Throttle({ default: { limit: 4, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a structured AI workout plan and save it into workout plans' })
  async generateAndSaveWorkoutPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateWorkoutPlanDto,
  ) {
    return this.aiService.generateAndSaveWorkoutPlan(user.sub, payload);
  }

  @Post('diet-plan/save')
  @Premium()
  @Throttle({ default: { limit: 4, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a structured AI diet plan and save it into diet plans' })
  async generateAndSaveDietPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateDietPlanDto,
  ) {
    return this.aiService.generateAndSaveDietPlan(user.sub, payload);
  }

  @Post('coach-chat')
  @Premium()
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @ApiOperation({ summary: 'Chat with the AI fitness coach' })
  async coachChat(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CoachChatDto,
  ) {
    return this.aiService.coachChat(user.sub, payload);
  }

  @Post('calorie-estimate')
  @Premium()
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @ApiOperation({ summary: 'Estimate calories and macros from a natural-language food log' })
  async estimateCalorieLog(
    @CurrentUser() user: JwtPayload,
    @Body() payload: EstimateCalorieLogDto,
  ) {
    return this.aiService.estimateCalorieLog(user.sub, payload);
  }

  @Post('adaptive-plan')
  @Premium()
  @Throttle({ default: { limit: 4, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate adaptive weekly guidance based on workouts, diet, and progress history' })
  async adaptivePlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: AdaptivePlanDto,
  ) {
    return this.aiService.generateAdaptivePlan(user.sub, payload);
  }

  @Post('calorie-insights')
  @Premium()
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI calorie insights from monthly calorie logs and user context' })
  async generateCalorieInsights(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CalorieInsightsDto,
  ) {
    return this.aiService.generateCalorieInsights(user.sub, payload);
  }

  @Post('queue')
  @Premium()
  @Throttle({ default: { limit: 4, ttl: 60000 } })
  @ApiOperation({ summary: 'Queue a background plan generation job' })
  async queuePlanJob(
    @CurrentUser() user: JwtPayload,
    @Body() payload: QueuePlanJobDto,
  ) {
    return this.aiService.enqueuePlanJob(user.sub, payload);
  }
}
