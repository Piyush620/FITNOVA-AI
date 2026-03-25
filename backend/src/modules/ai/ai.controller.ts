import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { AiService } from './ai.service';
import { CoachChatDto } from './dto/coach-chat.dto';
import { AdaptivePlanDto } from './dto/adaptive-plan.dto';
import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';
import { QueuePlanJobDto } from './dto/queue-plan-job.dto';

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
  @ApiOperation({ summary: 'Get AI interaction history for the current user' })
  async getHistory(@CurrentUser() user: JwtPayload) {
    return this.aiService.getHistory(user.sub);
  }

  @Post('workout-plan')
  @ApiOperation({ summary: 'Generate a personalized workout plan' })
  async generateWorkoutPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateWorkoutPlanDto,
  ) {
    return this.aiService.generateWorkoutPlan(user.sub, payload);
  }

  @Post('diet-plan')
  @ApiOperation({ summary: 'Generate a personalized diet plan' })
  async generateDietPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateDietPlanDto,
  ) {
    return this.aiService.generateDietPlan(user.sub, payload);
  }

  @Post('workout-plan/save')
  @ApiOperation({ summary: 'Generate a structured AI workout plan and save it into workout plans' })
  async generateAndSaveWorkoutPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateWorkoutPlanDto,
  ) {
    return this.aiService.generateAndSaveWorkoutPlan(user.sub, payload);
  }

  @Post('diet-plan/save')
  @ApiOperation({ summary: 'Generate a structured AI diet plan and save it into diet plans' })
  async generateAndSaveDietPlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: GenerateDietPlanDto,
  ) {
    return this.aiService.generateAndSaveDietPlan(user.sub, payload);
  }

  @Post('coach-chat')
  @ApiOperation({ summary: 'Chat with the AI fitness coach' })
  async coachChat(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CoachChatDto,
  ) {
    return this.aiService.coachChat(user.sub, payload);
  }

  @Post('adaptive-plan')
  @ApiOperation({ summary: 'Generate adaptive weekly guidance based on workouts, diet, and progress history' })
  async adaptivePlan(
    @CurrentUser() user: JwtPayload,
    @Body() payload: AdaptivePlanDto,
  ) {
    return this.aiService.generateAdaptivePlan(user.sub, payload);
  }

  @Post('queue')
  @ApiOperation({ summary: 'Queue a background plan generation job' })
  async queuePlanJob(
    @CurrentUser() user: JwtPayload,
    @Body() payload: QueuePlanJobDto,
  ) {
    return this.aiService.enqueuePlanJob(user.sub, payload);
  }
}
