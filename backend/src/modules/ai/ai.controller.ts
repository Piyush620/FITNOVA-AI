import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { AiService } from './ai.service';
import { CoachChatDto } from './dto/coach-chat.dto';
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

  @Post('coach-chat')
  @ApiOperation({ summary: 'Chat with the AI fitness coach' })
  async coachChat(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CoachChatDto,
  ) {
    return this.aiService.coachChat(user.sub, payload);
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
