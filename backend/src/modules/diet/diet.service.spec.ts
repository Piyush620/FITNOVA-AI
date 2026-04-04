import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { CalorieLog } from '../calorie-logs/schemas/calorie-log.schema';
import { DietService } from './diet.service';
import { DietPlan, DietPlanStatus } from './schemas/diet-plan.schema';

describe('DietService', () => {
  let service: DietService;
  let mockDietPlanModel: any;
  let mockCalorieLogModel: any;

  const userId = '507f1f77bcf86cd799439011';
  const planId = '507f1f77bcf86cd799439013';

  beforeEach(async () => {
    mockDietPlanModel = {
      findOne: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    };
    mockCalorieLogModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DietService,
        { provide: getModelToken(DietPlan.name), useValue: mockDietPlanModel },
        { provide: getModelToken(CalorieLog.name), useValue: mockCalorieLogModel },
      ],
    }).compile();

    service = module.get<DietService>(DietService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('completes a meal on the provided date and creates a synced diet calorie log', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const meal = {
      type: 'lunch',
      title: 'Chicken Rice Bowl',
      description: 'Lean protein with rice and vegetables.',
      items: ['Chicken', 'Rice', 'Vegetables'],
      calories: 620,
      proteinGrams: 42,
      carbsGrams: 65,
      fatsGrams: 14,
      completedAt: undefined as Date | undefined,
    };
    const plan = {
      id: planId,
      userId: { toString: () => userId },
      title: 'Lean Cut',
      goal: 'fat loss',
      preference: 'high-protein',
      targetCalories: 2100,
      status: DietPlanStatus.ACTIVE,
      startDate: undefined,
      endDate: undefined,
      isAiGenerated: false,
      notes: undefined,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      days: [
        { dayNumber: 1, dayLabel: 'Monday', meals: [{ type: 'breakfast', title: 'Oats', completedAt: undefined }] },
        { dayNumber: 2, dayLabel: 'Tuesday', meals: [meal] },
      ],
      save,
    };

    mockDietPlanModel.findOne.mockResolvedValue(plan);
    mockCalorieLogModel.findOne.mockResolvedValue(null);

    const result = await service.completeMeal(userId, planId, 2, 'lunch', '2026-03-31');

    expect((meal.completedAt as Date | undefined)?.toISOString()).toBe('2026-03-31T12:00:00.000Z');
    expect(mockCalorieLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        loggedDate: '2026-03-31',
        mealType: 'lunch',
        source: 'diet-plan',
        title: 'Chicken Rice Bowl',
        calories: 620,
        proteinGrams: 42,
        carbsGrams: 65,
        fatsGrams: 14,
        notes: 'Lean protein with rice and vegetables.',
        rawInput: 'Chicken, Rice, Vegetables',
      }),
    );
    expect(save).toHaveBeenCalled();
    expect(result.progress).toEqual({
      completedMeals: 1,
      totalMeals: 2,
    });
  });

  it('updates an existing synced calorie log for the meal instead of creating a duplicate', async () => {
    const savePlan = jest.fn().mockResolvedValue(undefined);
    const saveLog = jest.fn().mockResolvedValue(undefined);
    const meal = {
      type: 'dinner',
      title: 'Salmon Plate',
      description: 'Salmon, potatoes, and greens.',
      items: ['Salmon', 'Potatoes', 'Greens'],
      calories: 710,
      proteinGrams: 48,
      carbsGrams: 52,
      fatsGrams: 24,
      completedAt: undefined as Date | undefined,
    };
    const plan = {
      id: planId,
      userId: { toString: () => userId },
      title: 'Performance Cut',
      goal: 'fat loss',
      preference: 'balanced',
      targetCalories: 2200,
      status: DietPlanStatus.ACTIVE,
      startDate: new Date('2026-03-24T12:00:00.000Z'),
      endDate: undefined,
      isAiGenerated: false,
      notes: undefined,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      days: [{ dayNumber: 1, dayLabel: 'Monday', meals: [meal] }],
      save: savePlan,
    };
    const existingLog = {
      title: 'Old meal',
      calories: 100,
      proteinGrams: 5,
      carbsGrams: 8,
      fatsGrams: 2,
      notes: 'Old notes',
      rawInput: 'Old input',
      save: saveLog,
    };

    mockDietPlanModel.findOne.mockResolvedValue(plan);
    mockCalorieLogModel.findOne.mockResolvedValue(existingLog);

    await service.completeMeal(userId, planId, 1, 'dinner', '2026-03-24');

    expect(mockCalorieLogModel.create).not.toHaveBeenCalled();
    expect(existingLog.title).toBe('Salmon Plate');
    expect(existingLog.calories).toBe(710);
    expect(existingLog.proteinGrams).toBe(48);
    expect(existingLog.carbsGrams).toBe(52);
    expect(existingLog.fatsGrams).toBe(24);
    expect(existingLog.notes).toBe('Salmon, potatoes, and greens.');
    expect(existingLog.rawInput).toBe('Salmon, Potatoes, Greens');
    expect(saveLog).toHaveBeenCalled();
    expect(plan.status).toBe(DietPlanStatus.COMPLETED);
  });

  it('rejects completion when the selected date maps to a different diet day', async () => {
    const meal = {
      type: 'dinner',
      title: 'Salmon Plate',
      completedAt: undefined as Date | undefined,
    };
    const plan = {
      id: planId,
      userId: { toString: () => userId },
      title: 'Performance Cut',
      goal: 'fat loss',
      preference: 'balanced',
      targetCalories: 2200,
      status: DietPlanStatus.ACTIVE,
      startDate: new Date('2026-04-01T12:00:00.000Z'),
      endDate: undefined,
      isAiGenerated: false,
      notes: undefined,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      days: [{ dayNumber: 2, dayLabel: 'Tuesday', meals: [meal] }],
      save: jest.fn(),
    };

    mockDietPlanModel.findOne.mockResolvedValue(plan);

    await expect(service.completeMeal(userId, planId, 2, 'dinner', '2026-04-01')).rejects.toThrow(
      'The selected calendar date does not match this diet day.',
    );
  });
});
