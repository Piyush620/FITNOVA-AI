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

import { CalorieLogsService } from '../calorie-logs/calorie-logs.service';
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
import { CalorieInsightsDto } from './dto/calorie-insights.dto';
import { CoachChatDto } from './dto/coach-chat.dto';
import { EstimateCalorieLogDto } from './dto/estimate-calorie-log.dto';
import { CreateDietPlanDto } from '../diet/dto/create-diet-plan.dto';
import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';
import { QueuePlanJobDto } from './dto/queue-plan-job.dto';
import { CreateWorkoutPlanDto } from '../workouts/dto/create-workout-plan.dto';
import {
  coachPrompt,
  dietPrompt,
  structuredDietPrompt,
  structuredCalorieEstimatePrompt,
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
  private readonly weekdayLabels = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ] as const;
  private readonly dietMealOrder = [
    'breakfast',
    'mid-morning',
    'lunch',
    'evening-snack',
    'dinner',
    'post-workout',
  ] as const;
  private readonly requiredDietMeals = ['breakfast', 'lunch', 'evening-snack', 'dinner'] as const;
  private readonly dietPreferences = ['veg', 'non-veg', 'eggetarian'] as const;
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
    private readonly calorieLogsService: CalorieLogsService,
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

  async getHistory(
    userId: string,
    pagination: PaginationQueryDto = { page: 1, limit: 20 },
    type?: AiInteractionType,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter = {
      userId: new Types.ObjectId(userId),
      ...(type ? { type } : {}),
    };

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
      workoutPrompt(payload, {
        age: user.profile.age,
        gender: user.profile.gender,
        goal: user.profile.goal,
        activityLevel: user.profile.activityLevel,
      }),
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
    const activeWorkoutContext = await this.getActiveWorkoutContext(userId);
    const output = await this.generateText(
      'You are FitNova AI, an expert sports nutrition coach focused on Indian meal planning.',
      dietPrompt(payload, {
        gender: user.profile.gender,
        goal: user.profile.goal,
        activityLevel: user.profile.activityLevel,
      }, activeWorkoutContext),
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
    const user = await this.usersService.getCurrentUser(userId);
    const output = await this.generateText(
      'You are FitNova AI, an elite fitness programming assistant that returns strict JSON.',
      structuredWorkoutPrompt(payload, {
        age: user.profile.age,
        gender: user.profile.gender,
        goal: user.profile.goal,
        activityLevel: user.profile.activityLevel,
      }),
    );
    const parsedPlan = this.normalizeWorkoutPlan(
      this.parseJsonResponse(output) as Record<string, unknown>,
      payload,
    );
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
    const user = await this.usersService.getCurrentUser(userId);
    const activeWorkoutContext = await this.getActiveWorkoutContext(userId);
    const output = await this.generateText(
      'You are FitNova AI, an expert Indian nutrition coach that returns strict JSON.',
      structuredDietPrompt(payload, {
        gender: user.profile.gender,
        goal: user.profile.goal,
        activityLevel: user.profile.activityLevel,
      }, activeWorkoutContext),
    );
    const parsedPlan = this.normalizeDietPlan(
      this.parseJsonResponse(output) as Record<string, unknown>,
      payload,
      activeWorkoutContext,
    );
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
    const recentContext = await this.getRecentCoachContext(userId);
    const output = await this.generateText(
      'You are a premium AI fitness coach for the FitNova AI platform.',
      coachPrompt(user, payload.message, recentContext),
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

  async estimateCalorieLog(userId: string, payload: EstimateCalorieLogDto) {
    const user = await this.usersService.getCurrentUser(userId);
    const output = await this.generateText(
      'You are FitNova AI, a food logging assistant that estimates calories and macros from plain-language meal descriptions and returns strict JSON.',
      structuredCalorieEstimatePrompt(payload, {
        gender: user.profile.gender,
        goal: user.profile.goal,
        activityLevel: user.profile.activityLevel,
      }),
    );
    const parsed = this.normalizeCalorieEstimate(this.parseJsonResponse(output) as Record<string, unknown>, payload);

    await this.persistInteraction(
      userId,
      AiInteractionType.CALORIE_ESTIMATE,
      { ...payload },
      output,
    );

    return {
      type: 'calorie-estimate',
      provider: this.provider,
      model: this.model,
      estimate: parsed,
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

  async generateCalorieInsights(userId: string, payload: CalorieInsightsDto) {
    const [user, monthlySummary] = await Promise.all([
      this.usersService.getCurrentUser(userId),
      this.calorieLogsService.getMonthlySummary(userId, payload.month),
    ]);

    const output = await this.generateText(
      'Act as a premium nutrition coach. Review monthly calorie intake, consistency, and macro trends, then give practical and direct recommendations. Keep the response concise but specific.',
      `User profile:\n${JSON.stringify(
        {
          goal: user.profile.goal,
          activityLevel: user.profile.activityLevel,
          age: user.profile.age,
          gender: user.profile.gender,
          weightKg: user.profile.weightKg,
        },
        null,
        2,
      )}\n\nMonthly calorie summary:\n${JSON.stringify(monthlySummary, null, 2)}\n\nGive:
1. a short assessment
2. the main calorie pattern
3. 3 concrete adjustments for next month`,
    );

    await this.persistInteraction(
      userId,
      AiInteractionType.CALORIE_INSIGHTS,
      { month: payload.month ?? monthlySummary.month, monthlySummary },
      output,
    );

    return {
      type: 'calorie-insights',
      provider: this.provider,
      model: this.model,
      month: payload.month ?? monthlySummary.month,
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

  private normalizeWorkoutPlan(
    payload: Record<string, unknown>,
    input: GenerateWorkoutPlanDto,
  ): CreateWorkoutPlanDto {
    const rawDays = Array.isArray(payload.days) ? payload.days : [];
    const sourceDays = rawDays.filter(
      (day): day is Record<string, unknown> =>
        !!day &&
        typeof day === 'object' &&
        Array.isArray(day.exercises) &&
        day.exercises.length > 0,
    );

    if (sourceDays.length === 0) {
      throw new InternalServerErrorException(
        'AI provider returned a workout plan without any usable day entries.',
      );
    }

    const normalizedDays = Array.from({ length: input.trainingDaysPerWeek }, (_, index) => {
      const template = sourceDays[index] ?? sourceDays[index % sourceDays.length];
      const exercises = Array.isArray(template.exercises)
        ? template.exercises
            .filter(
              (exercise): exercise is Record<string, unknown> =>
                !!exercise && typeof exercise === 'object',
            )
            .map((exercise, exerciseIndex) => ({
              name: this.getTrimmedString(
                exercise.name,
                `Exercise ${exerciseIndex + 1}`,
                120,
              ),
              muscleGroup: this.getOptionalTrimmedString(exercise.muscleGroup, 80),
              sets: this.getBoundedInteger(exercise.sets, 3, 1, 12),
              reps: this.getTrimmedString(exercise.reps, '8-12', 40),
              restSeconds: this.getOptionalBoundedInteger(exercise.restSeconds, 0, 600),
              equipment: this.getOptionalTrimmedString(exercise.equipment, 80),
              notes: this.getOptionalTrimmedString(exercise.notes, 300),
            }))
            .slice(0, 10)
        : [];

      if (exercises.length === 0) {
        exercises.push({
          name: 'Primary movement',
          muscleGroup: this.getOptionalTrimmedString(template.focus, 80),
          sets: 3,
          reps: '8-12',
          restSeconds: 90,
          equipment: undefined,
          notes: 'AI output was incomplete, so a fallback exercise was added.',
        });
      }

      return {
        dayNumber: index + 1,
        dayLabel: this.weekdayLabels[index],
        focus: this.getTrimmedString(template.focus, `Training Day ${index + 1}`, 80),
        durationMinutes: this.getOptionalBoundedInteger(template.durationMinutes, 10, 240) ?? 45,
        exercises,
      };
    });

    return {
      title: this.getTrimmedString(payload.title, `${input.goal} Workout Plan`, 120),
      goal: this.getTrimmedString(payload.goal, input.goal, 120),
      level: this.getTrimmedString(payload.level, input.experience, 40),
      equipment: this.getStringArray(payload.equipment, 10, 80),
      startDate: this.getOptionalTrimmedString(payload.startDate),
      endDate: this.getOptionalTrimmedString(payload.endDate),
      activateNow: this.getBoolean(payload.activateNow, true),
      isAiGenerated: true,
      notes: this.getOptionalTrimmedString(payload.notes, 500),
      days: normalizedDays,
    };
  }

  private normalizeDietPlan(
    plan: Record<string, unknown>,
    input: GenerateDietPlanDto,
    workout?: {
      title?: string;
      trainingDaysPerWeek?: number;
      averageWorkoutMinutes?: number;
      focusSummary?: string;
      days?: Array<{
        dayNumber: number;
        dayLabel: string;
        focus: string;
        durationMinutes?: number;
      }>;
    },
  ): CreateDietPlanDto {
    const sourceDays = Array.isArray(plan.days)
      ? plan.days.filter(
          (day): day is Record<string, unknown> =>
            !!day &&
            typeof day === 'object' &&
            Array.isArray(day.meals) &&
            day.meals.length > 0,
        )
      : [];

    if (sourceDays.length === 0) {
      throw new InternalServerErrorException('AI provider returned a diet plan without any usable day entries.');
    }

    const normalizedDays = this.weekdayLabels.map((label, index) => {
      const template = sourceDays[index] ?? sourceDays[index % sourceDays.length];
      const matchingWorkoutDay = workout?.days?.find((day) => day.dayLabel === label);
      const rawMeals = Array.isArray(template.meals)
        ? template.meals.filter(
            (meal): meal is Record<string, unknown> => !!meal && typeof meal === 'object',
          )
        : [];
      const normalizedMeals = rawMeals
        .map((meal, mealIndex) => {
          const mealType = this.isAllowedMealType(meal.type)
            ? meal.type
            : this.dietMealOrder[mealIndex] ?? 'other';

          return {
            type: mealType,
            title: this.getTrimmedString(
              meal.title,
              this.getFallbackMealTitle(mealType),
              120,
            ),
            description: this.getOptionalTrimmedString(meal.description, 300),
            items: this.getStringArray(meal.items, 12, 120),
            calories: this.getOptionalBoundedInteger(meal.calories, 0, 2500),
            proteinGrams: this.getOptionalBoundedInteger(meal.proteinGrams, 0, 300),
            carbsGrams: this.getOptionalBoundedInteger(meal.carbsGrams, 0, 300),
            fatsGrams: this.getOptionalBoundedInteger(meal.fatsGrams, 0, 200),
          };
        })
        .slice(0, 8);

      for (const mealType of this.requiredDietMeals) {
        if (!normalizedMeals.some((meal) => meal.type === mealType)) {
          normalizedMeals.push({
            type: mealType,
            title: this.getFallbackMealTitle(mealType),
            description: 'Added automatically because the AI response omitted this meal slot.',
            items: [],
            calories: undefined,
            proteinGrams: undefined,
            carbsGrams: undefined,
            fatsGrams: undefined,
          });
        }
      }

      if (matchingWorkoutDay && !normalizedMeals.some((meal) => meal.type === 'post-workout')) {
        normalizedMeals.push({
          type: 'post-workout',
          title: 'Post-workout recovery meal',
          description: `Recovery-focused meal for ${matchingWorkoutDay.focus.toLowerCase()} day.`,
          items: [],
          calories: undefined,
          proteinGrams: undefined,
          carbsGrams: undefined,
          fatsGrams: undefined,
        });
      }

      normalizedMeals.sort(
        (left, right) =>
          this.dietMealOrder.indexOf(left.type) - this.dietMealOrder.indexOf(right.type),
      );

      return {
        dayNumber: index + 1,
        dayLabel: label,
        theme:
          this.getOptionalTrimmedString(template.theme, 120) ??
          (matchingWorkoutDay ? `${matchingWorkoutDay.focus} fuel and recovery` : undefined),
        meals: normalizedMeals,
        targetCalories:
          this.getOptionalBoundedInteger(template.targetCalories, 0, 6000) ??
          this.getOptionalBoundedInteger(plan.targetCalories, 1000, 6000),
      };
    }) as unknown as CreateDietPlanDto['days'];

    const alignedDays = this.alignDietDaysWithWorkout(normalizedDays, workout);

    return {
      title: this.getTrimmedString(plan.title, `${input.goal} Diet Plan`, 120),
      goal: this.getTrimmedString(plan.goal, input.goal, 120),
      preference: this.isDietPreference(plan.preference) ? plan.preference : input.preference,
      targetCalories: this.getOptionalBoundedInteger(plan.targetCalories, 1000, 6000),
      activateNow: this.getBoolean(plan.activateNow, true),
      isAiGenerated: true,
      startDate: this.getOptionalTrimmedString(plan.startDate),
      endDate: this.getOptionalTrimmedString(plan.endDate),
      notes: this.buildDietWorkoutLinkNote(this.getOptionalTrimmedString(plan.notes, 500), workout),
      days: alignedDays,
    } as CreateDietPlanDto;
  }

  private async getRecentCoachContext(userId: string) {
    const interactions = await this.aiInteractionModel
      .find({
        userId: new Types.ObjectId(userId),
        type: AiInteractionType.COACH_CHAT,
      })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    if (interactions.length === 0) {
      return '';
    }

    return interactions
      .reverse()
      .map((interaction, index) => {
        const promptMessage =
          interaction.promptPayload &&
          typeof interaction.promptPayload === 'object' &&
          'message' in interaction.promptPayload &&
          typeof interaction.promptPayload.message === 'string'
            ? interaction.promptPayload.message.trim()
            : '';
        const reply = interaction.outputText?.trim() ?? '';

        return [
          `Exchange ${index + 1}:`,
          promptMessage ? `User: ${promptMessage}` : null,
          reply ? `Coach: ${reply}` : null,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');
  }

  private normalizeCalorieEstimate(payload: Record<string, unknown>, input: EstimateCalorieLogDto) {
    const title =
      typeof payload.title === 'string' && payload.title.trim().length > 0
        ? payload.title.trim().slice(0, 120)
        : input.rawInput.trim().slice(0, 120);
    const mealType =
      typeof payload.mealType === 'string' &&
      ['breakfast', 'mid-morning', 'lunch', 'evening-snack', 'dinner', 'post-workout', 'other'].includes(payload.mealType)
        ? payload.mealType
        : input.mealType;
    const normalizeNumber = (value: unknown, max: number) =>
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(0, Math.min(max, Number(value.toFixed(1))))
        : 0;

    const parsedItems = Array.isArray(payload.parsedItems)
      ? payload.parsedItems
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map((item) => ({
            name:
              typeof item.name === 'string' && item.name.trim().length > 0
                ? item.name.trim().slice(0, 120)
                : 'Food item',
            quantity:
              typeof item.quantity === 'string' && item.quantity.trim().length > 0
                ? item.quantity.trim().slice(0, 120)
                : undefined,
            estimatedCalories: normalizeNumber(item.estimatedCalories, 4000),
          }))
          .slice(0, 12)
      : [];

    if (parsedItems.length === 0) {
      parsedItems.push({
        name: title,
        quantity: undefined,
        estimatedCalories: normalizeNumber(payload.calories, 4000),
      });
    }

    return {
      loggedDate: input.loggedDate,
      mealType,
      title,
      rawInput: input.rawInput.trim(),
      source: 'ai' as const,
      confidence:
        typeof payload.confidence === 'number' && Number.isFinite(payload.confidence)
          ? Math.max(0, Math.min(1, Number(payload.confidence.toFixed(2))))
          : 0.65,
      calories: normalizeNumber(payload.calories, 4000),
      proteinGrams: normalizeNumber(payload.proteinGrams, 400),
      carbsGrams: normalizeNumber(payload.carbsGrams, 400),
      fatsGrams: normalizeNumber(payload.fatsGrams, 400),
      notes:
        typeof payload.notes === 'string' && payload.notes.trim().length > 0
          ? payload.notes.trim().slice(0, 500)
          : 'Estimated from natural-language meal input.',
      parsedItems,
    };
  }

  private async getActiveWorkoutContext(userId: string) {
    const activeWorkoutPlan = await this.workoutPlanModel
      .findOne({ userId: new Types.ObjectId(userId), status: 'active' })
      .lean();

    if (!activeWorkoutPlan) {
      return undefined;
    }

    const trainingDaysPerWeek = activeWorkoutPlan.days.length;
    const averageWorkoutMinutes =
      trainingDaysPerWeek > 0
        ? Math.round(
            activeWorkoutPlan.days.reduce(
              (sum, day) => sum + (day.durationMinutes ?? 45),
              0,
            ) / trainingDaysPerWeek,
          )
        : undefined;

    return {
      title: activeWorkoutPlan.title,
      trainingDaysPerWeek,
      averageWorkoutMinutes,
      days: activeWorkoutPlan.days
        .slice()
        .sort((left, right) => left.dayNumber - right.dayNumber)
        .map((day) => ({
          dayNumber: day.dayNumber,
          dayLabel: day.dayLabel,
          focus: day.focus,
          durationMinutes: day.durationMinutes,
        })),
      focusSummary: activeWorkoutPlan.days
        .map((day) => `${day.dayLabel}: ${day.focus}`)
        .join('; '),
    };
  }

  private alignDietDaysWithWorkout(
    days: CreateDietPlanDto['days'],
    workout?: {
      days?: Array<{
        dayLabel: string;
        focus: string;
      }>;
      averageWorkoutMinutes?: number;
    },
  ) {
    if (!workout?.days?.length) {
      return days;
    }

    const baseTarget = Math.round(
      days.reduce((sum, day) => sum + (day.targetCalories ?? 0), 0) / Math.max(days.length, 1),
    );

    if (!baseTarget) {
      return days;
    }

    const trainingDayLabels = new Set(workout.days.map((day) => day.dayLabel));
    const trainingDayCount = trainingDayLabels.size;
    const restDayCount = Math.max(days.length - trainingDayCount, 0);
    const trainingBoost = Math.max(
      100,
      Math.min(275, Math.round((workout.averageWorkoutMinutes ?? 45) * 2.2)),
    );
    const restReduction =
      restDayCount > 0 ? Math.round((trainingBoost * trainingDayCount) / restDayCount) : 0;

    return days.map((day) => {
      const workoutDay = workout.days?.find((entry) => entry.dayLabel === day.dayLabel);

      return {
        ...day,
        targetCalories: workoutDay
          ? Math.min(6000, baseTarget + trainingBoost)
          : Math.max(1200, baseTarget - restReduction),
      };
    });
  }

  private buildDietWorkoutLinkNote(
    existingNotes?: string,
    workout?: {
      title?: string;
      days?: Array<{
        dayLabel: string;
        focus: string;
      }>;
    },
  ) {
    if (!workout?.days?.length) {
      return existingNotes;
    }

    const workoutSummary = `Nutrition synced to workout split${workout.title ? ` "${workout.title}"` : ''}: ${workout.days
      .map((day) => `${day.dayLabel} ${day.focus}`)
      .join(', ')}. Training days carry more calories and recovery support.`;

    if (!existingNotes) {
      return workoutSummary.slice(0, 500);
    }

    return `${existingNotes}\n\n${workoutSummary}`.slice(0, 500);
  }

  private getTrimmedString(value: unknown, fallback = '', maxLength = 255) {
    if (typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
  }

  private getOptionalTrimmedString(value: unknown, maxLength = 255) {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
  }

  private getBoundedInteger(value: unknown, fallback: number, min: number, max: number) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, Math.round(value)));
  }

  private getOptionalBoundedInteger(value: unknown, min: number, max: number) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return undefined;
    }

    return Math.max(min, Math.min(max, Math.round(value)));
  }

  private getBoolean(value: unknown, fallback: boolean) {
    return typeof value === 'boolean' ? value : fallback;
  }

  private getStringArray(value: unknown, maxItems: number, maxItemLength: number) {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const items = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim().slice(0, maxItemLength))
      .slice(0, maxItems);

    return items.length > 0 ? items : undefined;
  }

  private isAllowedMealType(value: unknown): value is CreateDietPlanDto['days'][number]['meals'][number]['type'] {
    return typeof value === 'string' && this.dietMealOrder.includes(value as (typeof this.dietMealOrder)[number]);
  }

  private isDietPreference(value: unknown): value is CreateDietPlanDto['preference'] {
    return typeof value === 'string' && this.dietPreferences.includes(value as (typeof this.dietPreferences)[number]);
  }

  private getFallbackMealTitle(mealType: string) {
    switch (mealType) {
      case 'breakfast':
        return 'Balanced breakfast';
      case 'mid-morning':
        return 'Mid-morning snack';
      case 'lunch':
        return 'Balanced lunch';
      case 'evening-snack':
        return 'Evening snack';
      case 'dinner':
        return 'Balanced dinner';
      case 'post-workout':
        return 'Post-workout recovery meal';
      default:
        return 'Meal';
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
