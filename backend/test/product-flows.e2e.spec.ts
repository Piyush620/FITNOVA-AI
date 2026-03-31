import { CalorieLogsController } from 'src/modules/calorie-logs/calorie-logs.controller';
import { CalorieLogsService } from 'src/modules/calorie-logs/calorie-logs.service';
import { DietController } from 'src/modules/diet/diet.controller';
import { DietService } from 'src/modules/diet/diet.service';
import { ProgressController } from 'src/modules/progress/progress.controller';
import { ProgressService } from 'src/modules/progress/progress.service';
import { UsersController } from 'src/modules/users/users.controller';
import { UsersService } from 'src/modules/users/users.service';
import { WorkoutsController } from 'src/modules/workouts/workouts.controller';
import { WorkoutsService } from 'src/modules/workouts/workouts.service';

import { authHeaders, createTestApp } from './support/test-app';

describe('Core product HTTP flows', () => {
  const usersService = {
    getCurrentUser: jest.fn(),
    updateCurrentUser: jest.fn(),
    getDashboardSnapshot: jest.fn(),
  };

  const workoutsService = {
    createPlan: jest.fn(),
    listPlans: jest.fn(),
    getActivePlan: jest.fn(),
    getPlanById: jest.fn(),
    activatePlan: jest.fn(),
    restartPlan: jest.fn(),
    deletePlan: jest.fn(),
    completeSession: jest.fn(),
  };

  const dietService = {
    createPlan: jest.fn(),
    listPlans: jest.fn(),
    getActivePlan: jest.fn(),
    getPlanById: jest.fn(),
    activatePlan: jest.fn(),
    restartPlan: jest.fn(),
    deletePlan: jest.fn(),
    completeMeal: jest.fn(),
  };

  const calorieLogsService = {
    createLog: jest.fn(),
    updateLog: jest.fn(),
    deleteLog: jest.fn(),
    getDailyLogs: jest.fn(),
    getMonthlySummary: jest.fn(),
  };

  const progressService = {
    createCheckIn: jest.fn(),
    getHistory: jest.fn(),
    getSummary: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects protected routes without authentication', async () => {
    const { app } = await createTestApp({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it('updates the current user profile through the HTTP layer', async () => {
    usersService.updateCurrentUser.mockResolvedValue({
      id: 'user-free',
      profile: {
        fullName: 'Updated User',
      },
    });

    const { app } = await createTestApp({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
      ],
    });

    const payload = {
      fullName: 'Updated User',
      goal: 'muscle gain',
      activityLevel: 'active',
    };

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: authHeaders('free-token'),
      payload,
    });

    expect(response.statusCode).toBe(200);
    expect(usersService.updateCurrentUser).toHaveBeenCalledWith('user-free', payload);

    await app.close();
  });

  it('validates workout plan payloads and completes workout sessions with parsed params', async () => {
    workoutsService.createPlan.mockResolvedValue({ id: 'plan-1' });
    workoutsService.completeSession.mockResolvedValue({ id: 'plan-1', completedDayNumbers: [2] });

    const { app } = await createTestApp({
      controllers: [WorkoutsController],
      providers: [
        { provide: WorkoutsService, useValue: workoutsService },
      ],
    });

    const invalidResponse = await app.inject({
      method: 'POST',
      url: '/workouts/plans',
      headers: authHeaders('free-token'),
      payload: {
        goal: 'strength',
        level: 'beginner',
        days: [],
      },
    });

    expect(invalidResponse.statusCode).toBe(400);
    expect(workoutsService.createPlan).not.toHaveBeenCalled();

    const payload = {
      title: 'Strength Builder',
      goal: 'strength',
      level: 'beginner',
      activateNow: true,
      days: [
        {
          dayNumber: 1,
          dayLabel: 'Day 1',
          focus: 'Upper body',
          durationMinutes: 60,
          exercises: [
            {
              name: 'Bench Press',
              sets: 4,
              reps: '8-10',
            },
          ],
        },
      ],
    };

    const createResponse = await app.inject({
      method: 'POST',
      url: '/workouts/plans',
      headers: authHeaders('free-token'),
      payload,
    });

    expect(createResponse.statusCode).toBe(201);
    expect(workoutsService.createPlan).toHaveBeenCalledWith('user-free', payload);

    const completeResponse = await app.inject({
      method: 'POST',
      url: '/workouts/plans/plan-1/sessions/2/complete',
      headers: authHeaders('free-token'),
    });

    expect(completeResponse.statusCode).toBe(201);
    expect(workoutsService.completeSession).toHaveBeenCalledWith('user-free', 'plan-1', 2);

    await app.close();
  });

  it('creates diet plans and completes meals with typed route params', async () => {
    dietService.createPlan.mockResolvedValue({ id: 'diet-1' });
    dietService.completeMeal.mockResolvedValue({ id: 'diet-1' });

    const { app } = await createTestApp({
      controllers: [DietController],
      providers: [
        { provide: DietService, useValue: dietService },
      ],
    });

    const payload = {
      title: 'Lean Cut',
      goal: 'fat loss',
      preference: 'veg',
      targetCalories: 2100,
      days: [
        {
          dayNumber: 1,
          dayLabel: 'Monday',
          meals: [
            {
              type: 'breakfast',
              title: 'Oats bowl',
              calories: 450,
            },
          ],
        },
      ],
    };

    const createResponse = await app.inject({
      method: 'POST',
      url: '/diet/plans',
      headers: authHeaders('free-token'),
      payload,
    });

    expect(createResponse.statusCode).toBe(201);
    expect(dietService.createPlan).toHaveBeenCalledWith('user-free', payload);

    const completeResponse = await app.inject({
      method: 'POST',
      url: '/diet/plans/diet-1/days/3/meals/lunch/complete',
      headers: authHeaders('free-token'),
    });

    expect(completeResponse.statusCode).toBe(201);
    expect(dietService.completeMeal).toHaveBeenCalledWith('user-free', 'diet-1', 3, 'lunch');

    await app.close();
  });

  it('creates calorie logs, returns monthly summaries, and records progress check-ins', async () => {
    calorieLogsService.createLog.mockResolvedValue({ id: 'log-1' });
    calorieLogsService.getMonthlySummary.mockResolvedValue({ month: '2026-03' });
    progressService.createCheckIn.mockResolvedValue({ id: 'check-in-1' });

    const { app } = await createTestApp({
      controllers: [CalorieLogsController, ProgressController],
      providers: [
        { provide: CalorieLogsService, useValue: calorieLogsService },
        { provide: ProgressService, useValue: progressService },
      ],
    });

    const caloriePayload = {
      loggedDate: '2026-03-29',
      mealType: 'lunch',
      title: 'Chicken rice bowl',
      source: 'ai',
      rawInput: 'chicken rice bowl with veggies',
      calories: 620,
      proteinGrams: 35,
      carbsGrams: 68,
      fatsGrams: 18,
    };

    const createLogResponse = await app.inject({
      method: 'POST',
      url: '/calorie-logs',
      headers: authHeaders('free-token'),
      payload: caloriePayload,
    });

    expect(createLogResponse.statusCode).toBe(201);
    expect(calorieLogsService.createLog).toHaveBeenCalledWith('user-free', caloriePayload);

    const monthlyResponse = await app.inject({
      method: 'GET',
      url: '/calorie-logs/monthly-summary?month=2026-03',
      headers: authHeaders('free-token'),
    });

    expect(monthlyResponse.statusCode).toBe(200);
    expect(calorieLogsService.getMonthlySummary).toHaveBeenCalledWith('user-free', '2026-03');

    const progressPayload = {
      weightKg: 78.4,
      energyLevel: 8,
      sleepQuality: 7,
      moodScore: 8,
      notes: 'Strong training week.',
    };

    const progressResponse = await app.inject({
      method: 'POST',
      url: '/progress/check-ins',
      headers: authHeaders('free-token'),
      payload: progressPayload,
    });

    expect(progressResponse.statusCode).toBe(201);
    expect(progressService.createCheckIn).toHaveBeenCalledWith('user-free', progressPayload);

    await app.close();
  });
});
