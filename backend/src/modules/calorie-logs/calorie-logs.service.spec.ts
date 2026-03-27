import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../auth/schemas/user.schema';
import { DietPlan } from '../diet/schemas/diet-plan.schema';
import { CalorieLogsService } from './calorie-logs.service';
import { CalorieLog } from './schemas/calorie-log.schema';

describe('CalorieLogsService', () => {
  let service: CalorieLogsService;
  let mockCalorieLogModel: any;
  let mockUserModel: any;
  let mockDietPlanModel: any;

  beforeEach(async () => {
    mockCalorieLogModel = {
      create: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalorieLogsService,
        { provide: getModelToken(CalorieLog.name), useValue: mockCalorieLogModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(DietPlan.name), useValue: mockDietPlanModel },
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
});
