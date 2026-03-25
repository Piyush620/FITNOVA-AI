import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import OpenAI from 'openai';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

import { DietService } from '../diet/diet.service';
import { DietPlan, DietPlanDocument } from '../diet/schemas/diet-plan.schema';
import {
  ProgressCheckIn,
  ProgressCheckInDocument,
} from '../progress/schemas/progress-check-in.schema';
import { UsersService } from '../users/users.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { WorkoutPlan, WorkoutPlanDocument } from '../workouts/schemas/workout-plan.schema';
import { QueueService } from '../queue/queue.service';
import { AdaptivePlanDto } from './dto/adaptive-plan.dto';
import { CoachChatDto } from './dto/coach-chat.dto';
import { CreateDietPlanDto } from '../diet/dto/create-diet-plan.dto';
import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';
import { QueuePlanJobDto } from './dto/queue-plan-job.dto';
import { CreateWorkoutPlanDto } from '../workouts/dto/create-workout-plan.dto';
import {
  coachPrompt,
  dietPrompt,
  structuredDietPrompt,
  structuredWorkoutPrompt,
  workoutPrompt,
} from './prompts';
import {
  AiInteraction,
  AiInteractionDocument,
  AiInteractionType,
} from './schemas/ai-interaction.schema';

@Injectable()
export class AiService {
  private readonly openAiClient?: OpenAI;
  private readonly geminiClient?: GoogleGenAI;
  private readonly provider: 'gemini' | 'openai';
  private readonly model: string;
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectModel(AiInteraction.name)
    private readonly aiInteractionModel: Model<AiInteractionDocument>,
    @InjectModel(WorkoutPlan.name)
    private readonly workoutPlanModel: Model<WorkoutPlanDocument>,
    @InjectModel(DietPlan.name)
    private readonly dietPlanModel: Model<DietPlanDocument>,
    @InjectModel(ProgressCheckIn.name)
    private readonly progressCheckInModel: Model<ProgressCheckInDocument>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly workoutsService: WorkoutsService,
    private readonly dietService: DietService,
    private readonly queueService: QueueService,
  ) {
    this.provider = this.configService.get<'gemini' | 'openai'>('ai.provider', 'gemini');

    const openAiApiKey = this.configService.get<string>('openai.apiKey');
    const geminiApiKey = this.configService.get<string>('gemini.apiKey');

    this.model =
      this.provider === 'gemini'
        ? this.configService.get<string>('gemini.model', 'gemini-2.5-flash')
        : this.configService.get<string>('openai.model', 'gpt-4.1-mini');

    if (openAiApiKey) {
      this.openAiClient = new OpenAI({ apiKey: openAiApiKey });
    }

    if (geminiApiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    }
  }

  getStatus() {
    return {
      provider: this.provider,
      configured: this.provider === 'gemini' ? !!this.geminiClient : !!this.openAiClient,
      model: this.model,
    };
  }

  async getHistory(userId: string, pagination: PaginationQueryDto = { page: 1, limit: 20 }) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [interactions, total] = await Promise.all([
      this.aiInteractionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.aiInteractionModel.countDocuments(filter),
    ]);

    return {
      items: interactions.map((interaction) => ({
        id: interaction._id.toString(),
        type: interaction.type,
        provider: interaction.provider,
        model: interaction.model,
        promptPayload: interaction.promptPayload,
        outputText: interaction.outputText,
        createdAt: interaction.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async generateWorkoutPlan(userId: string, payload: GenerateWorkoutPlanDto) {
    const user = await this.usersService.getCurrentUser(userId);
    const output = await this.generateText(
      'You are FitNova AI, an elite fitness programming assistant.',
      workoutPrompt(payload),
    );
    await this.persistInteraction(userId, AiInteractionType.WORKOUT_PLAN, { ...payload }, output);

    return {
      type: 'workout-plan',
      provider: this.provider,
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
    await this.persistInteraction(userId, AiInteractionType.DIET_PLAN, { ...payload }, output);

    return {
      type: 'diet-plan',
      provider: this.provider,
      model: this.model,
      user: {
        id: user.id,
        goal: user.profile.goal,
      },
      content: output,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateAndSaveWorkoutPlan(userId: string, payload: GenerateWorkoutPlanDto) {
    const output = await this.generateText(
      'You are FitNova AI, an elite fitness programming assistant that returns strict JSON.',
      structuredWorkoutPrompt(payload),
    );
    const parsedPlan = this.parseJsonResponse(output) as CreateWorkoutPlanDto;
    const savedPlan = await this.workoutsService.createPlan(userId, parsedPlan);

    await this.persistInteraction(
      userId,
      AiInteractionType.WORKOUT_PLAN,
      { ...payload, savedToWorkouts: true },
      output,
    );

    return {
      type: 'workout-plan',
      provider: this.provider,
      model: this.model,
      saved: true,
      plan: savedPlan,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateAndSaveDietPlan(userId: string, payload: GenerateDietPlanDto) {
    const output = await this.generateText(
      'You are FitNova AI, an expert Indian nutrition coach that returns strict JSON.',
      structuredDietPrompt(payload),
    );
    const parsedPlan = this.parseJsonResponse(output) as CreateDietPlanDto;
    const savedPlan = await this.dietService.createPlan(userId, parsedPlan);

    await this.persistInteraction(
      userId,
      AiInteractionType.DIET_PLAN,
      { ...payload, savedToDiet: true },
      output,
    );

    return {
      type: 'diet-plan',
      provider: this.provider,
      model: this.model,
      saved: true,
      plan: savedPlan,
      generatedAt: new Date().toISOString(),
    };
  }

  async coachChat(userId: string, payload: CoachChatDto) {
    const user = await this.usersService.getCurrentUser(userId);
    const output = await this.generateText(
      'You are a premium AI fitness coach for the FitNova AI platform.',
      coachPrompt(user, payload.message),
    );
    await this.persistInteraction(userId, AiInteractionType.COACH_CHAT, { ...payload }, output);

    return {
      type: 'coach-chat',
      provider: this.provider,
      model: this.model,
      reply: output,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateAdaptivePlan(userId: string, payload: AdaptivePlanDto) {
    const user = await this.usersService.getCurrentUser(userId);
    const objectId = new Types.ObjectId(userId);
    const [workoutPlans, dietPlans, progressHistory] = await Promise.all([
      this.workoutPlanModel.find({ userId: objectId }).sort({ updatedAt: -1 }).limit(5).lean(),
      this.dietPlanModel.find({ userId: objectId }).sort({ updatedAt: -1 }).limit(5).lean(),
      this.progressCheckInModel.find({ userId: objectId }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const adherenceSummary = {
      completedWorkoutDays: workoutPlans.reduce(
        (sum, plan) => sum + plan.days.filter((day) => !!day.completedAt).length,
        0,
      ),
      totalWorkoutDays: workoutPlans.reduce((sum, plan) => sum + plan.days.length, 0),
      completedMeals: dietPlans.reduce(
        (sum, plan) => sum + plan.days.reduce((inner, day) => inner + day.meals.filter((meal) => !!meal.completedAt).length, 0),
        0,
      ),
      totalMeals: dietPlans.reduce(
        (sum, plan) => sum + plan.days.reduce((inner, day) => inner + day.meals.length, 0),
        0,
      ),
      recentCheckIns: progressHistory.map((entry) => ({
        createdAt: entry.createdAt,
        weightKg: entry.weightKg,
        energyLevel: entry.energyLevel,
        sleepQuality: entry.sleepQuality,
        moodScore: entry.moodScore,
      })),
    };

    const output = await this.generateText(
      'Act as a professional fitness coach. Analyze adherence and recent check-ins, then recommend a practical weekly adjustment plan.',
      `User data:\n${JSON.stringify(user, null, 2)}\n\nProgress summary:\n${JSON.stringify(adherenceSummary, null, 2)}\n\nRequested focus area: ${payload.focusArea ?? 'overall performance and consistency'}`,
    );

    await this.persistInteraction(
      userId,
      AiInteractionType.COACH_CHAT,
      { focusArea: payload.focusArea ?? 'overall performance and consistency', adherenceSummary },
      output,
    );

    return {
      type: 'adaptive-plan',
      provider: this.provider,
      model: this.model,
      content: output,
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
    if (this.provider === 'gemini') {
      return this.generateWithGemini(instructions, input);
    }

    return this.generateWithOpenAi(instructions, input);
  }

  private async persistInteraction(
    userId: string,
    type: AiInteractionType,
    promptPayload: Record<string, unknown>,
    outputText: string,
  ) {
    await this.aiInteractionModel.create({
      userId: new Types.ObjectId(userId),
      type,
      provider: this.provider,
      model: this.model,
      promptPayload,
      outputText,
    });
  }

  private parseJsonResponse(output: string) {
    const trimmed = output.trim();
    const withoutFences = trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(withoutFences) as Record<string, any>;
    } catch {
      const firstBrace = withoutFences.indexOf('{');
      const lastBrace = withoutFences.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        return JSON.parse(withoutFences.slice(firstBrace, lastBrace + 1)) as Record<string, any>;
      }

      throw new InternalServerErrorException(
        'AI provider returned a response that could not be parsed into structured JSON.',
      );
    }
  }

  private async generateWithGemini(instructions: string, input: string) {
    if (!this.geminiClient) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not configured. Add it to the environment to enable Gemini generation.',
      );
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `${instructions}\n\n${input}`,
      });

      return response.text ?? '';
    } catch (error: unknown) {
      const geminiError = error as {
        status?: number;
        code?: string | number;
        message?: string;
      };
      const statusCode =
        typeof geminiError.status === 'number' && geminiError.status >= 400
          ? geminiError.status
          : 502;
      const message = geminiError.message ?? 'Gemini request failed.';

      this.logger.error(
        `Gemini generation failed [model=${this.model}, status=${geminiError.status ?? 'unknown'}, code=${geminiError.code ?? 'unknown'}]: ${message}`,
      );

      if (statusCode >= 400 && statusCode < 600) {
        throw new HttpException(
          {
            statusCode,
            message,
            provider: 'gemini',
            model: this.model,
            code: String(geminiError.code ?? 'gemini_error'),
          },
          statusCode,
        );
      }

      throw new InternalServerErrorException('Gemini request failed.');
    }
  }

  private async generateWithOpenAi(instructions: string, input: string) {
    if (!this.openAiClient) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY is not configured. Add it to the environment to enable OpenAI generation.',
      );
    }

    try {
      const response = await this.openAiClient.responses.create({
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
