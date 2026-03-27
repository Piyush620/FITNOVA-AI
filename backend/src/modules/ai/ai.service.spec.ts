import { ConfigService } from '@nestjs/config';

import { AiService } from './ai.service';
import { AiInteractionType } from './schemas/ai-interaction.schema';

describe('AiService', () => {
  const userId = '507f1f77bcf86cd799439011';
  let service: AiService;
  let mockAiInteractionModel: {
    create: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let mockUsersService: { getCurrentUser: jest.Mock };
  let mockWorkoutsService: { createPlan: jest.Mock };
  let mockDietService: { createPlan: jest.Mock };
  let mockCalorieLogsService: { getMonthlySummary: jest.Mock };
  let mockQueueService: { enqueuePlanGenerationJob: jest.Mock };

  beforeEach(() => {
    mockAiInteractionModel = {
      create: jest.fn().mockResolvedValue(undefined),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    mockUsersService = {
      getCurrentUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        profile: {
          age: 25,
          gender: 'male',
          goal: 'fat loss',
          activityLevel: 'moderate',
          weightKg: 80,
        },
      }),
    };
    mockWorkoutsService = {
      createPlan: jest.fn().mockResolvedValue({ id: 'workout-plan-1' }),
    };
    mockDietService = {
      createPlan: jest.fn().mockResolvedValue({ id: 'diet-plan-1' }),
    };
    mockCalorieLogsService = {
      getMonthlySummary: jest.fn(),
    };
    mockQueueService = {
      enqueuePlanGenerationJob: jest.fn(),
    };

    service = new AiService(
      mockAiInteractionModel as never,
      {} as never,
      {} as never,
      {} as never,
      {
        get: jest.fn().mockImplementation((key: string, fallback?: unknown) => fallback),
      } as unknown as ConfigService,
      mockUsersService as never,
      mockWorkoutsService as never,
      mockDietService as never,
      mockCalorieLogsService as never,
      mockQueueService as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes malformed structured workout output before saving', async () => {
    const generateTextSpy = jest.spyOn(service as any, 'generateText');
    generateTextSpy.mockResolvedValue(`{
      "title": "",
      "goal": "",
      "level": "",
      "equipment": ["Dumbbells", "", "Bench"],
      "days": [
        {
          "dayNumber": 99,
          "dayLabel": "Random",
          "focus": "",
          "durationMinutes": 400,
          "exercises": [
            {
              "name": "",
              "sets": 99,
              "reps": "",
              "restSeconds": 999
            }
          ]
        }
      ]
    }`);

    await service.generateAndSaveWorkoutPlan(userId, {
      weight: '80 kg',
      goal: 'fat loss',
      experience: 'beginner',
      trainingDaysPerWeek: 3,
      equipment: 'dumbbells',
    });

    const savedPlan = mockWorkoutsService.createPlan.mock.calls[0][1];

    expect(savedPlan.title).toBe('fat loss Workout Plan');
    expect(savedPlan.goal).toBe('fat loss');
    expect(savedPlan.level).toBe('beginner');
    expect(savedPlan.days).toHaveLength(3);
    expect(savedPlan.days[0]).toEqual(
      expect.objectContaining({
        dayNumber: 1,
        dayLabel: 'Monday',
        focus: 'Training Day 1',
        durationMinutes: 240,
      }),
    );
    expect(savedPlan.days[0].exercises[0]).toEqual(
      expect.objectContaining({
        name: 'Exercise 1',
        sets: 12,
        reps: '8-12',
        restSeconds: 600,
      }),
    );
  });

  it('normalizes malformed structured diet output before saving', async () => {
    const generateTextSpy = jest.spyOn(service as any, 'generateText');
    generateTextSpy.mockResolvedValue(`{
      "title": "",
      "goal": "",
      "preference": "invalid",
      "targetCalories": 900,
      "days": [
        {
          "dayLabel": "Whatever",
          "meals": [
            {
              "type": "unknown",
              "title": "",
              "calories": 3000
            }
          ]
        }
      ]
    }`);

    await service.generateAndSaveDietPlan(userId, {
      goal: 'fat loss',
      currentWeightKg: 80,
      targetWeightKg: 72,
      timelineWeeks: 12,
      preference: 'veg',
      cuisineRegion: 'mixed-indian',
      budget: 'medium',
    } as any);

    const savedPlan = mockDietService.createPlan.mock.calls[0][1];
    const firstDayMealTypes = savedPlan.days[0].meals.map((meal: { type: string }) => meal.type);

    expect(savedPlan.title).toBe('fat loss Diet Plan');
    expect(savedPlan.goal).toBe('fat loss');
    expect(savedPlan.preference).toBe('veg');
    expect(savedPlan.days).toHaveLength(7);
    expect(savedPlan.days[0].dayLabel).toBe('Monday');
    expect(firstDayMealTypes).toEqual(
      expect.arrayContaining(['breakfast', 'lunch', 'evening-snack', 'dinner']),
    );
    expect(savedPlan.days[0].meals[0].title).toBeTruthy();
  });

  it('normalizes calorie estimates with safe fallbacks', async () => {
    const generateTextSpy = jest.spyOn(service as any, 'generateText');
    generateTextSpy.mockResolvedValue(`{
      "title": "",
      "mealType": "mystery-meal",
      "confidence": 4,
      "calories": 8000,
      "proteinGrams": -5,
      "carbsGrams": 900,
      "fatsGrams": 500,
      "parsedItems": []
    }`);

    const result = await service.estimateCalorieLog(userId, {
      loggedDate: '2026-03-27',
      mealType: 'dinner',
      rawInput: '2 rotis and paneer curry',
    });

    expect(result.estimate).toEqual(
      expect.objectContaining({
        mealType: 'dinner',
        title: '2 rotis and paneer curry',
        source: 'ai',
        confidence: 1,
        calories: 4000,
        proteinGrams: 0,
        carbsGrams: 400,
        fatsGrams: 400,
      }),
    );
    expect(result.estimate.parsedItems).toHaveLength(1);
  });

  it('hydrates recent coach history into the prompt context', async () => {
    mockAiInteractionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              promptPayload: { message: 'I felt tired all week.' },
              outputText: 'Reduce volume and sleep more.',
            },
          ]),
        }),
      }),
    });
    const generateTextSpy = jest.spyOn(service as any, 'generateText');
    generateTextSpy.mockResolvedValue('Keep the next two sessions lighter.');

    const result = await service.coachChat(userId, {
      message: 'How should I train tomorrow?',
    });

    expect(generateTextSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('I felt tired all week.'),
    );
    expect(generateTextSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('Reduce volume and sleep more.'),
    );
    expect(mockAiInteractionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AiInteractionType.COACH_CHAT,
      }),
    );
    expect(result.reply).toBe('Keep the next two sessions lighter.');
  });
});
