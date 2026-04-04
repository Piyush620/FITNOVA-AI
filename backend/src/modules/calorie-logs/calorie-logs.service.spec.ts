import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../auth/schemas/user.schema';
import { DietPlan } from '../diet/schemas/diet-plan.schema';
import { WorkoutPlan } from '../workouts/schemas/workout-plan.schema';
import { CalorieLogsService } from './calorie-logs.service';
import { CalorieLog } from './schemas/calorie-log.schema';

describe('CalorieLogsService', () => {
  let service: CalorieLogsService;
  let mockCalorieLogModel: any;
  let mockUserModel: any;
  let mockDietPlanModel: any;
  let mockWorkoutPlanModel: any;

  beforeEach(async () => {
    mockCalorieLogModel = {
      create: jest.fn(),
      exists: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndDelete: jest.fn(),
    };
    mockUserModel = {
      findById: jest.fn(),
    };
    mockDietPlanModel = {
      findOne: jest.fn(),
    };
    mockWorkoutPlanModel = {
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalorieLogsService,
        { provide: getModelToken(CalorieLog.name), useValue: mockCalorieLogModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(DietPlan.name), useValue: mockDietPlanModel },
        { provide: getModelToken(WorkoutPlan.name), useValue: mockWorkoutPlanModel },
      ],
    }).compile();

    service = module.get<CalorieLogsService>(CalorieLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns daily totals and entries for a specific date', async () => {
    mockCalorieLogModel.find.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => 'log-1' },
          userId: { toString: () => 'user-1' },
          loggedDate: '2026-03-27',
          mealType: 'breakfast',
          title: 'Oats bowl',
          calories: 420,
          proteinGrams: 22,
          carbsGrams: 54,
          fatsGrams: 11,
          createdAt: new Date('2026-03-27T07:00:00.000Z'),
        },
        {
          _id: { toString: () => 'log-2' },
          userId: { toString: () => 'user-1' },
          loggedDate: '2026-03-27',
          mealType: 'lunch',
          title: 'Rice and chicken',
          calories: 700,
          proteinGrams: 40,
          carbsGrams: 78,
          fatsGrams: 18,
          createdAt: new Date('2026-03-27T13:00:00.000Z'),
        },
      ]),
    });
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        profile: { weightKg: 78, goal: 'fat loss' },
      }),
    });
    mockDietPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        targetCalories: 2100,
      }),
    });

    const result = await service.getDailyLogs('507f1f77bcf86cd799439011', '2026-03-27');

    expect(result.targetCalories).toBe(2100);
    expect(result.totals).toEqual({
      calories: 1120,
      proteinGrams: 62,
      carbsGrams: 132,
      fatsGrams: 29,
    });
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].title).toBe('Oats bowl');
  });

  it('returns monthly summary metrics and recommendations', async () => {
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        profile: { weightKg: 80, goal: 'fat loss', activityLevel: 'moderate' },
      }),
    });
    mockDietPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        targetCalories: 2200,
      }),
    });
    mockCalorieLogModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => 'log-1' },
          userId: { toString: () => 'user-1' },
          loggedDate: '2026-03-01',
          mealType: 'breakfast',
          title: 'Meal 1',
          calories: 1200,
          proteinGrams: 40,
          carbsGrams: 100,
          fatsGrams: 30,
        },
        {
          _id: { toString: () => 'log-2' },
          userId: { toString: () => 'user-1' },
          loggedDate: '2026-03-01',
          mealType: 'dinner',
          title: 'Meal 2',
          calories: 1300,
          proteinGrams: 35,
          carbsGrams: 120,
          fatsGrams: 35,
        },
        {
          _id: { toString: () => 'log-3' },
          userId: { toString: () => 'user-1' },
          loggedDate: '2026-03-02',
          mealType: 'lunch',
          title: 'Meal 3',
          calories: 2400,
          proteinGrams: 55,
          carbsGrams: 200,
          fatsGrams: 40,
        },
      ]),
    });

    const result = await service.getMonthlySummary('507f1f77bcf86cd799439011', '2026-03');

    expect(result.month).toBe('2026-03');
    expect(result.totalCalories).toBe(4900);
    expect(result.daysLogged).toBe(2);
    expect(result.averageLoggedDayCalories).toBe(2450);
    expect(result.dailyBreakdown).toHaveLength(2);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('falls back to a lower target for fat-loss users when no active diet target exists', async () => {
    mockCalorieLogModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        profile: {
          age: 24,
          gender: 'female',
          heightCm: 165,
          weightKg: 68,
          activityLevel: 'moderate',
          goal: 'fat loss',
        },
      }),
    });
    mockDietPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const result = await service.getDailyLogs('507f1f77bcf86cd799439011', '2026-03-27');

    expect(result.targetCalories).toBe(1750);
  });

  it('uses the active diet target directly when one exists', async () => {
    mockCalorieLogModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        profile: {
          age: 26,
          gender: 'male',
          heightCm: 176,
          weightKg: 84,
          activityLevel: 'moderate',
          goal: 'fat loss',
        },
      }),
    });
    mockDietPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        targetCalories: 3325,
      }),
    });

    const result = await service.getDailyLogs('507f1f77bcf86cd799439011', '2026-03-27');

    expect(result.targetCalories).toBe(3325);
  });

  it('maps selected dates to plan days from the active plan start date instead of weekday label reuse', async () => {
    mockCalorieLogModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        profile: {
          age: 29,
          gender: 'male',
          heightCm: 178,
          weightKg: 82,
          activityLevel: 'moderate',
          goal: 'fat loss',
        },
      }),
    });
    mockDietPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        startDate: new Date('2026-04-01T12:00:00.000Z'),
        targetCalories: 2200,
        days: [
          { dayNumber: 1, dayLabel: 'Monday', theme: 'Lift', targetCalories: 2200, meals: [] },
          { dayNumber: 2, dayLabel: 'Tuesday', theme: 'Push', targetCalories: 2350, meals: [] },
          { dayNumber: 3, dayLabel: 'Wednesday', theme: 'Pull', targetCalories: 2500, meals: [] },
        ],
      }),
    });
    mockWorkoutPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        startDate: new Date('2026-04-01T12:00:00.000Z'),
        days: [
          {
            dayNumber: 1,
            dayLabel: 'Monday',
            focus: 'Lower Body',
            durationMinutes: 55,
            completedAt: undefined,
          },
          {
            dayNumber: 2,
            dayLabel: 'Tuesday',
            focus: 'Push Strength',
            durationMinutes: 65,
            completedAt: undefined,
          },
          {
            dayNumber: 3,
            dayLabel: 'Wednesday',
            focus: 'Pull Strength',
            durationMinutes: 70,
            completedAt: new Date('2026-04-03T12:00:00.000Z'),
          },
        ],
      }),
    });

    const result = await service.getDailyLogs('507f1f77bcf86cd799439011', '2026-04-03');

    expect(result.targetCalories).toBe(2500);
    expect(result.targetSource).toBe('active-diet-day');
    expect(result.plannedNutritionDay).toEqual({
      dayLabel: 'Wednesday',
      theme: 'Pull',
      targetCalories: 2500,
    });
    expect(result.activeWorkoutDay).toEqual({
      dayLabel: 'Wednesday',
      focus: 'Pull Strength',
      durationMinutes: 70,
      isTrainingDay: true,
      completedAt: new Date('2026-04-03T12:00:00.000Z'),
      isCompleted: true,
    });
  });

  it('does not reuse an old weekday match once the selected date falls outside the active plan timeline', async () => {
    mockCalorieLogModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    mockUserModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        profile: {
          age: 29,
          gender: 'male',
          heightCm: 178,
          weightKg: 82,
          activityLevel: 'moderate',
          goal: 'fat loss',
        },
      }),
    });
    mockDietPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        startDate: new Date('2026-04-01T12:00:00.000Z'),
        targetCalories: 2200,
        days: [
          { dayNumber: 1, dayLabel: 'Monday', theme: 'Lift', targetCalories: 2200, meals: [] },
          { dayNumber: 2, dayLabel: 'Tuesday', theme: 'Push', targetCalories: 2350, meals: [] },
          { dayNumber: 3, dayLabel: 'Wednesday', theme: 'Pull', targetCalories: 2500, meals: [] },
        ],
      }),
    });
    mockWorkoutPlanModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        startDate: new Date('2026-04-01T12:00:00.000Z'),
        days: [
          {
            dayNumber: 1,
            dayLabel: 'Monday',
            focus: 'Lower Body',
            durationMinutes: 55,
            completedAt: undefined,
          },
          {
            dayNumber: 2,
            dayLabel: 'Tuesday',
            focus: 'Push Strength',
            durationMinutes: 65,
            completedAt: undefined,
          },
          {
            dayNumber: 3,
            dayLabel: 'Wednesday',
            focus: 'Pull Strength',
            durationMinutes: 70,
            completedAt: undefined,
          },
        ],
      }),
    });

    const result = await service.getDailyLogs('507f1f77bcf86cd799439011', '2026-04-15');

    expect(result.targetCalories).toBe(2200);
    expect(result.targetSource).toBe('active-diet-plan');
    expect(result.plannedNutritionDay).toBeNull();
    expect(result.activeWorkoutDay).toBeNull();
  });

  it('syncs calorie-log meal completion to the correct diet day based on the plan timeline', async () => {
    const savePlan = jest.fn().mockResolvedValue(undefined);
    const mondayMeal = { type: 'breakfast', title: 'Monday Oats', completedAt: undefined };
    const fridayMeal = { type: 'breakfast', title: 'Friday Oats', completedAt: undefined };
    const activeDietPlan = {
      status: 'active',
      startDate: new Date('2026-04-01T12:00:00.000Z'),
      days: [
        { dayNumber: 1, dayLabel: 'Monday', meals: [mondayMeal] },
        { dayNumber: 3, dayLabel: 'Friday', meals: [fridayMeal] },
      ],
      save: savePlan,
    };

    mockCalorieLogModel.create.mockResolvedValue({
      _id: { toString: () => 'log-1' },
      userId: { toString: () => '507f1f77bcf86cd799439011' },
      loggedDate: '2026-04-03',
      mealType: 'breakfast',
      title: 'Friday Oats',
      source: 'manual',
    });
    mockCalorieLogModel.exists.mockResolvedValue(true);
    mockDietPlanModel.findOne.mockResolvedValue(activeDietPlan);

    await service.createLog('507f1f77bcf86cd799439011', {
      loggedDate: '2026-04-03',
      mealType: 'breakfast',
      title: 'Friday Oats',
      calories: 420,
      source: 'manual',
    });

    expect(fridayMeal.completedAt).toEqual(new Date('2026-04-03T12:00:00.000Z'));
    expect(mondayMeal.completedAt).toBeUndefined();
    expect(savePlan).toHaveBeenCalled();
  });
});
