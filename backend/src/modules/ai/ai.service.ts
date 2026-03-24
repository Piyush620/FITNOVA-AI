import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { UsersService } from '../users/users.service';
import { QueueService } from '../queue/queue.service';
import { CoachChatDto } from './dto/coach-chat.dto';
import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';
import { QueuePlanJobDto } from './dto/queue-plan-job.dto';
import { coachPrompt, dietPrompt, workoutPrompt } from './prompts';

@Injectable()
export class AiService {
  private readonly client?: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly queueService: QueueService,
  ) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    this.model = this.configService.get<string>('openai.model', 'gpt-5');

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  getStatus() {
    return {
      provider: 'openai',
      configured: !!this.client,
      model: this.model,
    };
  }

  async generateWorkoutPlan(userId: string, payload: GenerateWorkoutPlanDto) {
    const user = await this.usersService.getCurrentUser(userId);
    const output = await this.generateText(
      'You are FitNova AI, an elite fitness programming assistant.',
      workoutPrompt(payload),
    );

    return {
      type: 'workout-plan',
      model: this.model,
      user: {
        id: user.id,
        goal: user.profile.goal,
      },
      content: output,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateDietPlan(userId: string, payload: GenerateDietPlanDto) {
    const user = await this.usersService.getCurrentUser(userId);
    const output = await this.generateText(
      'You are FitNova AI, an expert sports nutrition coach focused on Indian meal planning.',
      dietPrompt(payload),
    );

    return {
      type: 'diet-plan',
      model: this.model,
      user: {
        id: user.id,
        goal: user.profile.goal,
      },
      content: output,
      generatedAt: new Date().toISOString(),
    };
  }

  async coachChat(userId: string, payload: CoachChatDto) {
    const user = await this.usersService.getCurrentUser(userId);
    const output = await this.generateText(
      'You are a premium AI fitness coach for the FitNova AI platform.',
      coachPrompt(user, payload.message),
    );

    return {
      type: 'coach-chat',
      model: this.model,
      reply: output,
      generatedAt: new Date().toISOString(),
    };
  }

  async enqueuePlanJob(userId: string, payload: QueuePlanJobDto) {
    const job = await this.queueService.enqueuePlanGenerationJob(payload.jobName, {
      ...payload.payload,
      userId,
      requestedAt: new Date().toISOString(),
    });

    return {
      queued: true,
      jobId: job.id,
      queue: job.queueName,
      name: job.name,
    };
  }

  private async generateText(instructions: string, input: string) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY is not configured. Add it to the environment to enable AI generation.',
      );
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions,
        input,
      });

      return response.output_text;
    } catch (error: unknown) {
      const openAiError = error as {
        status?: number;
        code?: string;
        message?: string;
      };
      const statusCode =
        typeof openAiError.status === 'number' && openAiError.status >= 400
          ? openAiError.status
          : 502;
      const message = openAiError.message ?? 'OpenAI request failed.';

      this.logger.error(
        `OpenAI generation failed [model=${this.model}, status=${openAiError.status ?? 'unknown'}, code=${openAiError.code ?? 'unknown'}]: ${message}`,
      );

      if (statusCode >= 400 && statusCode < 600) {
        throw new HttpException(
          {
            statusCode,
            message,
            provider: 'openai',
            model: this.model,
            code: openAiError.code ?? 'openai_error',
          },
          statusCode,
        );
      }

      throw new InternalServerErrorException('OpenAI request failed.');
    }
  }
}
