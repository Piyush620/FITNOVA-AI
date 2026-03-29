import { expect, test, type Page, type Route } from '@playwright/test';

type SubscriptionSummary = {
  tier: 'free' | 'premium';
  plan: 'free' | 'monthly' | 'yearly';
  status: 'inactive' | 'active';
  hasPremiumAccess: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type UserProfile = {
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  goal: string;
  activityLevel: string;
};

type User = {
  id: string;
  email: string;
  roles: Array<'user' | 'admin'>;
  profile: UserProfile;
  subscription: SubscriptionSummary;
  createdAt: string;
  updatedAt: string;
};

type WorkoutPlan = {
  id: string;
  userId: string;
  title: string;
  goal: string;
  level: string;
  equipment: string[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  isAiGenerated: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  progress: {
    completedDays: number;
    totalDays: number;
  };
  createdAt: string;
  updatedAt: string;
  days: Array<{
    dayNumber: number;
    dayLabel: string;
    focus: string;
    durationMinutes?: number;
    completedAt?: string;
    exercises: Array<{
      name: string;
      muscleGroup?: string;
      sets: number;
      reps: string;
      restSeconds?: number;
      equipment?: string;
      notes?: string;
    }>;
  }>;
};

type DietPlan = {
  id: string;
  userId: string;
  title: string;
  goal: string;
  preference: 'veg' | 'non-veg' | 'eggetarian';
  targetCalories?: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  isAiGenerated: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  progress: {
    completedMeals: number;
    totalMeals: number;
  };
  createdAt: string;
  updatedAt: string;
  days: Array<{
    dayNumber: number;
    dayLabel: string;
    theme?: string;
    targetCalories?: number;
    meals: Array<{
      type: 'breakfast' | 'mid-morning' | 'lunch' | 'evening-snack' | 'dinner' | 'post-workout';
      title: string;
      description?: string;
      items?: string[];
      calories?: number;
      proteinGrams?: number;
      carbsGrams?: number;
      fatsGrams?: number;
      completedAt?: string;
    }>;
  }>;
};

type CalorieLog = {
  id: string;
  userId: string;
  loggedDate: string;
  mealType:
    | 'breakfast'
    | 'mid-morning'
    | 'lunch'
    | 'evening-snack'
    | 'dinner'
    | 'post-workout'
    | 'other';
  title: string;
  source: 'manual' | 'ai';
  rawInput?: string | null;
  calories: number;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatsGrams?: number | null;
  notes?: string | null;
  confidence?: number | null;
  parsedItems?: Array<{
    name: string;
    quantity?: string;
    estimatedCalories?: number;
  }> | null;
  createdAt: string;
  updatedAt: string;
};

type AppState = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  workoutPlans: WorkoutPlan[];
  dietPlans: DietPlan[];
  calorieLogs: CalorieLog[];
};

const apiBase = 'http://localhost:4000/api/v1';

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthKey = (value: string) => value.slice(0, 7);

const createState = (): AppState => {
  const createdAt = `${today()}T08:00:00.000Z`;
  const subscription: SubscriptionSummary = {
    tier: 'premium',
    plan: 'monthly',
    status: 'active',
    hasPremiumAccess: true,
    stripeCustomerId: 'cus_mock_123',
    stripeSubscriptionId: 'sub_mock_123',
    currentPeriodStart: createdAt,
    currentPeriodEnd: createdAt,
    cancelAtPeriodEnd: false,
  };

  return {
    user: {
      id: 'user-1',
      email: 'vaishnavi@example.com',
      roles: ['user'],
      profile: {
        fullName: 'Vaishnavi Upadhyay',
        age: 24,
        gender: 'female',
        heightCm: 160,
        weightKg: 58,
        goal: 'Fat loss',
        activityLevel: 'moderate',
      },
      subscription,
      createdAt,
      updatedAt: createdAt,
    },
    tokens: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    },
    workoutPlans: [],
    dietPlans: [],
    calorieLogs: [],
  };
};

const json = async (route: Route, status: number, body: unknown) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const buildDashboard = (state: AppState) => {
  const activeWorkoutPlan = state.workoutPlans.find((plan) => plan.status === 'active') ?? null;
  const activeDietPlan = state.dietPlans.find((plan) => plan.status === 'active') ?? null;
  const todayLogs = state.calorieLogs.filter((entry) => entry.loggedDate === today());
  const todaysCalories = todayLogs.reduce((sum, entry) => sum + entry.calories, 0);
  const totalMeals =
    activeDietPlan?.progress.totalMeals ??
    activeDietPlan?.days.reduce((sum, day) => sum + day.meals.length, 0) ??
    0;
  const completedMeals =
    activeDietPlan?.progress.completedMeals ??
    activeDietPlan?.days.reduce(
      (sum, day) => sum + day.meals.filter((meal) => !!meal.completedAt).length,
      0,
    ) ??
    0;
  const caloriesTarget =
    activeDietPlan?.targetCalories ??
    activeDietPlan?.days.find((day) => typeof day.targetCalories === 'number')?.targetCalories ??
    1900;

  return {
    greeting: `Welcome back, ${state.user.profile.fullName.split(' ')[0]}`,
    currentWeight: state.user.profile.weightKg,
    startingWeight: state.user.profile.weightKg + 2,
    targetWeight: 54,
    goal: state.user.profile.goal.toLowerCase(),
    activityLevel: state.user.profile.activityLevel,
    weeklyConsistency: activeWorkoutPlan || activeDietPlan ? 78 : 0,
    caloriesTarget,
    todaysCalories,
    remainingCalories: caloriesTarget - todaysCalories,
    monthlyAverageCalories: state.calorieLogs.length ? 1840 : 0,
    monthlyLoggedDays: new Set(state.calorieLogs.map((entry) => entry.loggedDate)).size,
    completedWorkoutsThisWeek: activeWorkoutPlan?.progress.completedDays ?? 0,
    completedMeals,
    totalMeals,
    activeWorkoutPlan: activeWorkoutPlan
      ? {
          id: activeWorkoutPlan.id,
          title: activeWorkoutPlan.title,
          status: activeWorkoutPlan.status,
        }
      : null,
    activeDietPlan: activeDietPlan
      ? {
          id: activeDietPlan.id,
          title: activeDietPlan.title,
          status: activeDietPlan.status,
        }
      : null,
    progressSummary: {
      totalCheckIns: 2,
      latestEnergyLevel: 8,
      latestMoodScore: 8,
      latestSleepQuality: 7,
      weightChangeKg: -2,
    },
    nextCheckIn: `${today()}T08:00:00.000Z`,
  };
};

const buildDailyCalories = (state: AppState, date: string) => {
  const activeDietPlan = state.dietPlans.find((plan) => plan.status === 'active') ?? null;
  const entries = state.calorieLogs.filter((entry) => entry.loggedDate === date);
  const totals = entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      proteinGrams: sum.proteinGrams + (entry.proteinGrams ?? 0),
      carbsGrams: sum.carbsGrams + (entry.carbsGrams ?? 0),
      fatsGrams: sum.fatsGrams + (entry.fatsGrams ?? 0),
    }),
    { calories: 0, proteinGrams: 0, carbsGrams: 0, fatsGrams: 0 },
  );
  const plannedNutritionDay = activeDietPlan?.days[0]
    ? {
        dayLabel: activeDietPlan.days[0].dayLabel,
        theme: activeDietPlan.days[0].theme,
        targetCalories: activeDietPlan.days[0].targetCalories ?? activeDietPlan.targetCalories ?? 1900,
      }
    : null;

  return {
    date,
    targetCalories: plannedNutritionDay?.targetCalories ?? 1900,
    targetSource: plannedNutritionDay ? 'active-diet-day' : 'goal-estimate',
    plannedNutritionDay,
    activeWorkoutDay: state.workoutPlans.find((plan) => plan.status === 'active')
      ? {
          dayLabel: 'Monday',
          focus: 'Upper body strength',
          durationMinutes: 55,
          isTrainingDay: true,
        }
      : null,
    totals,
    entries,
  };
};

const buildMonthlyCalories = (state: AppState, month: string) => {
  const entries = state.calorieLogs.filter((entry) => monthKey(entry.loggedDate) === month);
  const grouped = new Map<string, CalorieLog[]>();

  for (const entry of entries) {
    const bucket = grouped.get(entry.loggedDate) ?? [];
    bucket.push(entry);
    grouped.set(entry.loggedDate, bucket);
  }

  const dailyBreakdown = Array.from(grouped.entries()).map(([date, logs]) => ({
    date,
    calories: logs.reduce((sum, entry) => sum + entry.calories, 0),
    proteinGrams: logs.reduce((sum, entry) => sum + (entry.proteinGrams ?? 0), 0),
    carbsGrams: logs.reduce((sum, entry) => sum + (entry.carbsGrams ?? 0), 0),
    fatsGrams: logs.reduce((sum, entry) => sum + (entry.fatsGrams ?? 0), 0),
    entryCount: logs.length,
  }));

  return {
    month,
    targetCalories: 1900,
    totalCalories: dailyBreakdown.reduce((sum, day) => sum + day.calories, 0),
    averageDailyCalories: dailyBreakdown.length ? Math.round(dailyBreakdown.reduce((sum, day) => sum + day.calories, 0) / dailyBreakdown.length) : 0,
    averageLoggedDayCalories: dailyBreakdown.length ? Math.round(dailyBreakdown.reduce((sum, day) => sum + day.calories, 0) / dailyBreakdown.length) : 0,
    averageProteinGrams: dailyBreakdown.length ? 128 : 0,
    averageCarbsGrams: dailyBreakdown.length ? 170 : 0,
    averageFatsGrams: dailyBreakdown.length ? 52 : 0,
    daysLogged: dailyBreakdown.length,
    daysInMonth: 31,
    entriesCount: entries.length,
    dailyBreakdown,
    recommendations: ['Keep lunch protein high and stay close to your active diet target.'],
  };
};

const createWorkoutPlan = (state: AppState) => {
  const now = `${today()}T10:00:00.000Z`;
  const plan: WorkoutPlan = {
    id: 'workout-1',
    userId: state.user.id,
    title: 'Fat Loss Strength Split',
    goal: 'Fat loss',
    level: 'intermediate',
    equipment: ['Dumbbells', 'Bench'],
    status: 'active',
    isAiGenerated: true,
    startDate: `${today()}T00:00:00.000Z`,
    endDate: undefined,
    notes: 'Keep rest times crisp and focus on quality reps.',
    progress: {
      completedDays: 0,
      totalDays: 4,
    },
    createdAt: now,
    updatedAt: now,
    days: [
      {
        dayNumber: 1,
        dayLabel: 'Monday',
        focus: 'Upper body strength',
        durationMinutes: 55,
        exercises: [
          {
            name: 'Incline dumbbell press',
            muscleGroup: 'Chest',
            sets: 4,
            reps: '8-10',
            restSeconds: 90,
            equipment: 'Dumbbells',
          },
        ],
      },
      {
        dayNumber: 2,
        dayLabel: 'Tuesday',
        focus: 'Lower body strength',
        durationMinutes: 55,
        exercises: [
          {
            name: 'Goblet squat',
            muscleGroup: 'Legs',
            sets: 4,
            reps: '10-12',
            restSeconds: 90,
            equipment: 'Dumbbells',
          },
        ],
      },
      {
        dayNumber: 3,
        dayLabel: 'Thursday',
        focus: 'Back and shoulders',
        durationMinutes: 50,
        exercises: [
          {
            name: 'One-arm row',
            muscleGroup: 'Back',
            sets: 4,
            reps: '10-12',
            restSeconds: 75,
            equipment: 'Dumbbells',
          },
        ],
      },
      {
        dayNumber: 4,
        dayLabel: 'Saturday',
        focus: 'Conditioning and core',
        durationMinutes: 40,
        exercises: [
          {
            name: 'Farmer carry',
            muscleGroup: 'Core',
            sets: 4,
            reps: '40m',
            restSeconds: 60,
            equipment: 'Dumbbells',
          },
        ],
      },
    ],
  };

  state.workoutPlans = [plan];
  return plan;
};

const createDietPlan = (state: AppState) => {
  const now = `${today()}T10:05:00.000Z`;
  const plan: DietPlan = {
    id: 'diet-1',
    userId: state.user.id,
    title: 'Fat Loss Recovery Menu',
    goal: 'Fat loss',
    preference: 'veg',
    targetCalories: 1900,
    status: 'active',
    isAiGenerated: true,
    startDate: `${today()}T00:00:00.000Z`,
    endDate: undefined,
    notes: 'Fuel training days a little higher and keep evenings lighter.',
    progress: {
      completedMeals: 0,
      totalMeals: 5,
    },
    createdAt: now,
    updatedAt: now,
    days: [
      {
        dayNumber: 1,
        dayLabel: 'Monday',
        theme: 'Upper body fuel',
        targetCalories: 1900,
        meals: [
          {
            type: 'breakfast',
            title: 'Protein oats bowl',
            description: 'Oats, curd, berries, and seeds.',
            items: ['Oats', 'Curd', 'Berries'],
            calories: 420,
            proteinGrams: 28,
            carbsGrams: 48,
            fatsGrams: 11,
          },
          {
            type: 'lunch',
            title: 'Paneer rice bowl',
            description: 'Paneer, rice, vegetables, and chutney.',
            items: ['Paneer', 'Rice', 'Vegetables'],
            calories: 560,
            proteinGrams: 34,
            carbsGrams: 58,
            fatsGrams: 18,
          },
          {
            type: 'evening-snack',
            title: 'Fruit and yogurt',
            calories: 210,
            proteinGrams: 12,
            carbsGrams: 26,
            fatsGrams: 5,
          },
          {
            type: 'dinner',
            title: 'Dal roti plate',
            calories: 490,
            proteinGrams: 24,
            carbsGrams: 54,
            fatsGrams: 12,
          },
          {
            type: 'post-workout',
            title: 'Recovery shake',
            calories: 220,
            proteinGrams: 24,
            carbsGrams: 18,
            fatsGrams: 4,
          },
        ],
      },
    ],
  };

  state.dietPlans = [plan];
  return plan;
};

const installApiMocks = async (page: Page, state: AppState) => {
  await page.route(`${apiBase}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();

    if (method === 'POST' && path === '/auth/register') {
      const payload = request.postDataJSON() as {
        email: string;
        fullName: string;
        age: number;
        gender: 'male' | 'female' | 'other';
        heightCm: number;
        weightKg: number;
        goal: string;
        activityLevel: string;
      };

      state.user = {
        ...state.user,
        email: payload.email,
        profile: {
          fullName: payload.fullName,
          age: payload.age,
          gender: payload.gender,
          heightCm: payload.heightCm,
          weightKg: payload.weightKg,
          goal: payload.goal,
          activityLevel: payload.activityLevel,
        },
      };

      await json(route, 201, {
        user: state.user,
        tokens: state.tokens,
      });
      return;
    }

    if (method === 'POST' && path === '/auth/login') {
      await json(route, 200, {
        user: state.user,
        tokens: state.tokens,
      });
      return;
    }

    if (method === 'GET' && path === '/auth/me') {
      await json(route, 200, state.user);
      return;
    }

    if (method === 'GET' && path === '/users/me/dashboard') {
      await json(route, 200, buildDashboard(state));
      return;
    }

    if (method === 'GET' && path === '/workouts/plans') {
      await json(route, 200, {
        items: state.workoutPlans,
        pagination: {
          page: 1,
          limit: 6,
          total: state.workoutPlans.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (method === 'GET' && path === '/workouts/plans/active') {
      const plan = state.workoutPlans.find((entry) => entry.status === 'active');
      if (!plan) {
        await json(route, 404, {
          statusCode: 404,
          message: 'No active workout plan found.',
        });
        return;
      }

      await json(route, 200, plan);
      return;
    }

    if (method === 'POST' && path === '/ai/workout-plan/save') {
      const plan = createWorkoutPlan(state);
      await json(route, 200, {
        type: 'workout-plan',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        saved: true,
        plan,
        generatedAt: `${today()}T10:00:00.000Z`,
      });
      return;
    }

    if (method === 'GET' && path === '/diet/plans') {
      await json(route, 200, {
        items: state.dietPlans,
        pagination: {
          page: 1,
          limit: 6,
          total: state.dietPlans.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (method === 'GET' && path === '/diet/plans/active') {
      const plan = state.dietPlans.find((entry) => entry.status === 'active');
      if (!plan) {
        await json(route, 404, {
          statusCode: 404,
          message: 'No active diet plan found.',
        });
        return;
      }

      await json(route, 200, plan);
      return;
    }

    if (method === 'POST' && path === '/ai/diet-plan/save') {
      const plan = createDietPlan(state);
      await json(route, 200, {
        type: 'diet-plan',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        saved: true,
        plan,
        generatedAt: `${today()}T10:05:00.000Z`,
      });
      return;
    }

    if (method === 'GET' && path === '/calorie-logs/daily') {
      await json(route, 200, buildDailyCalories(state, url.searchParams.get('date') ?? today()));
      return;
    }

    if (method === 'GET' && path === '/calorie-logs/monthly-summary') {
      await json(route, 200, buildMonthlyCalories(state, url.searchParams.get('month') ?? monthKey(today())));
      return;
    }

    if (method === 'POST' && path === '/calorie-logs') {
      const payload = request.postDataJSON() as Omit<CalorieLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
      const entry: CalorieLog = {
        id: `log-${state.calorieLogs.length + 1}`,
        userId: state.user.id,
        createdAt: `${payload.loggedDate}T12:00:00.000Z`,
        updatedAt: `${payload.loggedDate}T12:00:00.000Z`,
        ...payload,
      };

      state.calorieLogs.push(entry);
      await json(route, 201, entry);
      return;
    }

    if (method === 'GET' && path === '/subscriptions/status') {
      await json(route, 200, {
        stripeConfigured: true,
        persistenceConfigured: true,
        persistenceProvider: 'mongodb',
        monthlyPriceConfigured: true,
        yearlyPriceConfigured: true,
      });
      return;
    }

    if (method === 'GET' && path === '/subscriptions/me') {
      await json(route, 200, state.user.subscription);
      return;
    }

    await route.abort();
  });
};

test('user can sign up and complete the main mocked premium web journey', async ({ page }) => {
  const state = createState();
  await installApiMocks(page, state);

  await page.goto('/signup');

  await page.getByLabel('Full Name').fill('Vaishnavi Upadhyay');
  await page.getByLabel('Email').fill('vaishnavi@example.com');
  await page.getByLabel('Age').fill('24');
  await page.getByLabel('Height (cm)').fill('160');
  await page.getByLabel('Weight (kg)').fill('58');
  await page.getByLabel('Primary Goal').fill('Fat loss');
  await page.getByLabel('Password', { exact: true }).fill('SecurePass123');
  await page.getByLabel('Confirm Password', { exact: true }).fill('SecurePass123');
  await page.getByRole('button', { name: 'Create Account' }).click({ force: true });

  await expect(page.getByRole('heading', { name: /welcome back, vaishnavi/i })).toBeVisible();
  await expect(page.getByText('No active workout plan yet')).toBeVisible();

  await page.locator('header').getByRole('button', { name: 'Workouts', exact: true }).click({ force: true });
  await expect(page.getByRole('heading', { name: /build your/i })).toBeVisible();

  await page.getByRole('button', { name: 'AI Generate & Save' }).click({ force: true });
  await page.getByLabel('Experience').selectOption('intermediate');
  await page.getByLabel('Equipment').fill('Dumbbells, Bench');
  await page.getByRole('button', { name: 'Generate And Save Plan' }).click({ force: true });

  await expect(page.getByRole('heading', { name: 'Fat Loss Strength Split' }).last()).toBeVisible();
  await expect(page.getByText('Upper body strength')).toBeVisible();

  await page.goto('/diet');
  await expect(page).toHaveURL(/\/diet$/);

  await page.getByRole('button', { name: 'AI Generate & Save' }).click({ force: true });
  await page.getByLabel('Target Weight (kg)').fill('54');
  await page.getByRole('button', { name: 'Generate And Save Plan' }).click({ force: true });

  await expect(page.getByRole('heading', { name: 'Fat Loss Recovery Menu' }).last()).toBeVisible();
  await expect(page.getByText('Upper body fuel')).toBeVisible();

  await page.locator('header').getByRole('button', { name: 'Calories', exact: true }).click({ force: true });
  await expect(page.getByText('Diet-linked quick log')).toBeVisible();
  await expect(page.getByText('The calorie logger is following your next active diet meal')).toBeVisible();

  await page.getByRole('button', { name: 'Use In Manual Logger' }).click({ force: true });
  await page.getByRole('button', { name: 'Add Manual Entry' }).click({ force: true });

  await expect(page.getByRole('heading', { name: 'Protein oats bowl' })).toBeVisible();
  await expect(page.getByText('Using workout-synced diet day')).toBeVisible();
});
