import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { CalorieLog } from '../calorie-logs/schemas/calorie-log.schema';
import { WorkoutsService } from './workouts.service';
import { WorkoutPlan, WorkoutPlanStatus } from './schemas/workout-plan.schema';

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let mockWorkoutPlanModel: any;
  let mockCalorieLogModel: any;

  const userId = '507f1f77bcf86cd799439011';
  const planId = '507f1f77bcf86cd799439012';

  beforeEach(async () => {
    mockWorkoutPlanModel = {
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
        WorkoutsService,
        { provide: getModelToken(WorkoutPlan.name), useValue: mockWorkoutPlanModel },
        { provide: getModelToken(CalorieLog.name), useValue: mockCalorieLogModel },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('completes a workout day on the provided date and creates a workout calorie log', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const workoutDay = {
      dayNumber: 2,
      dayLabel: 'Tuesday',
      focus: 'Upper Body',
      durationMinutes: 60,
      exercises: [{ name: 'Bench Press' }, { name: 'Rows' }],
      completedAt: undefined as Date | undefined,
    };
    const plan = {
      id: planId,
      userId: { toString: () => userId },
      title: 'Strength Builder',
      goal: 'strength',
      level: 'beginner',
      equipment: [],
      status: WorkoutPlanStatus.ACTIVE,
      startDate: undefined,
      endDate: undefined,
      isAiGenerated: false,
      notes: undefined,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      days: [
        { dayNumber: 1, dayLabel: 'Monday', focus: 'Lower Body', exercises: [], completedAt: undefined },
        workoutDay,
      ],
      save,
    };

    mockWorkoutPlanModel.findOne.mockResolvedValue(plan);
    mockCalorieLogModel.findOne.mockResolvedValue(null);

    const result = await service.completeSession(userId, planId, 2, '2026-03-31');

    expect((workoutDay.completedAt as Date | undefined)?.toISOString()).toBe('2026-03-31T12:00:00.000Z');
    expect(mockCalorieLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        loggedDate: '2026-03-31',
        mealType: 'other',
        source: 'workout-plan',
        title: 'Workout completed: Upper Body',
        calories: 0,
        notes: 'Strength Builder | Tuesday | 60 min',
        rawInput: 'Bench Press, Rows',
      }),
    );
    expect(save).toHaveBeenCalled();
    expect(result.progress).toEqual({
      completedDays: 1,
      totalDays: 2,
    });
  });

  it('updates an existing workout calorie log instead of creating a duplicate', async () => {
    const savePlan = jest.fn().mockResolvedValue(undefined);
    const saveLog = jest.fn().mockResolvedValue(undefined);
    const workoutDay = {
      dayNumber: 1,
      dayLabel: 'Monday',
      focus: 'Conditioning',
      durationMinutes: 45,
      exercises: [{ name: 'Bike Intervals' }],
      completedAt: undefined as Date | undefined,
    };
    const plan = {
      id: planId,
      userId: { toString: () => userId },
      title: 'Conditioning Reset',
      goal: 'endurance',
      level: 'intermediate',
      equipment: [],
      status: WorkoutPlanStatus.ACTIVE,
      startDate: new Date('2026-03-24T12:00:00.000Z'),
      endDate: undefined,
      isAiGenerated: false,
      notes: undefined,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      days: [workoutDay],
      save: savePlan,
    };
    const existingLog = {
      calories: 150,
      notes: '',
      rawInput: '',
      save: saveLog,
    };

    mockWorkoutPlanModel.findOne.mockResolvedValue(plan);
    mockCalorieLogModel.findOne.mockResolvedValue(existingLog);

    await service.completeSession(userId, planId, 1, '2026-03-24');

    expect(mockCalorieLogModel.create).not.toHaveBeenCalled();
    expect(existingLog.calories).toBe(0);
    expect(existingLog.notes).toBe('Conditioning Reset | Monday | 45 min');
    expect(existingLog.rawInput).toBe('Bike Intervals');
    expect(saveLog).toHaveBeenCalled();
    expect(plan.status).toBe(WorkoutPlanStatus.COMPLETED);
  });

  it('rejects completion when the selected date maps to a different workout day', async () => {
    const plan = {
      id: planId,
      userId: { toString: () => userId },
      title: 'Strength Builder',
      goal: 'strength',
      level: 'beginner',
      equipment: [],
      status: WorkoutPlanStatus.ACTIVE,
      startDate: new Date('2026-04-01T12:00:00.000Z'),
      endDate: undefined,
      isAiGenerated: false,
      notes: undefined,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      days: [
        { dayNumber: 1, dayLabel: 'Monday', focus: 'Lower Body', exercises: [], completedAt: undefined },
        { dayNumber: 2, dayLabel: 'Tuesday', focus: 'Upper Body', exercises: [], completedAt: undefined },
      ],
      save: jest.fn(),
    };

    mockWorkoutPlanModel.findOne.mockResolvedValue(plan);

    await expect(service.completeSession(userId, planId, 2, '2026-04-01')).rejects.toThrow(
      'The selected calendar date does not match this workout day.',
    );
  });
});
