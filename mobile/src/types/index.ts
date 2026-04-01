export interface SubscriptionSummary {
  tier: 'free' | 'premium';
  plan: 'free' | 'monthly' | 'yearly';
  status:
    | 'inactive'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'incomplete'
    | 'incomplete_expired'
    | 'paused';
  hasPremiumAccess: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionConfigStatus {
  stripeConfigured: boolean;
  persistenceConfigured: boolean;
  persistenceProvider: 'mongodb';
  monthlyPriceConfigured: boolean;
  yearlyPriceConfigured: boolean;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string | null;
  userId: string;
  requestedPlan: 'monthly' | 'yearly';
  priceId: string;
  stripeCustomerId: string;
}

export interface User {
  id: string;
  email: string;
  roles: Array<'user' | 'admin'>;
  subscription?: SubscriptionSummary;
  profile: {
    fullName?: string;
    avatarUrl?: string;
    age?: number;
    gender?: string;
    goal?: string;
    activityLevel?: string;
    heightCm?: number;
    weightKg?: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  activityLevel?: string;
}

export interface PendingVerificationResponse {
  email: string;
  verificationRequired: boolean;
  message: string;
}

export interface VerifyEmailOtpPayload {
  email: string;
  otp: string;
}

export interface DashboardSummary {
  greeting: string;
  currentWeight: number | null;
  startingWeight: number | null;
  targetWeight: number | null;
  goal: string;
  activityLevel: string;
  weeklyConsistency: number;
  caloriesTarget: number;
  todaysCalories: number;
  remainingCalories: number;
  monthlyAverageCalories: number;
  monthlyLoggedDays: number;
  completedWorkoutsThisWeek: number;
  completedMeals: number;
  totalMeals: number;
  nextCheckIn: string;
}

export interface WorkoutExercise {
  name: string;
  muscleGroup?: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  equipment?: string;
  notes?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  dayLabel: string;
  focus: string;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  completedAt?: string;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  title: string;
  goal: string;
  level: string;
  equipment: string[];
  days: WorkoutDay[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  isAiGenerated: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  progress?: {
    completedDays: number;
    totalDays: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Meal {
  type: 'breakfast' | 'mid-morning' | 'lunch' | 'evening-snack' | 'dinner' | 'post-workout';
  title: string;
  description?: string;
  items?: string[];
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  completedAt?: string;
}

export interface DietDay {
  dayNumber: number;
  dayLabel: string;
  theme?: string;
  targetCalories?: number;
  meals: Meal[];
}

export interface DietPlan {
  id: string;
  userId: string;
  title: string;
  goal: string;
  preference: 'veg' | 'non-veg' | 'eggetarian';
  targetCalories?: number;
  days: DietDay[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  isAiGenerated: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  progress?: {
    completedMeals: number;
    totalMeals: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalorieLog {
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
  source?: 'manual' | 'ai' | 'diet-plan' | 'workout-plan';
  rawInput?: string;
  calories: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  notes?: string;
  confidence?: number;
  parsedItems?: Array<{
    name: string;
    quantity?: string;
    estimatedCalories?: number;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyCalorieLogResponse {
  date: string;
  targetCalories: number;
  targetSource?: 'active-diet-day' | 'active-diet-plan' | 'workout-adjusted-estimate' | 'goal-estimate';
  plannedNutritionDay?: {
    dayLabel: string;
    theme?: string;
    targetCalories: number;
  } | null;
  activeWorkoutDay?: {
    dayLabel: string;
    focus: string;
    durationMinutes?: number;
    isTrainingDay: boolean;
    completedAt?: string | null;
    isCompleted?: boolean;
  } | null;
  totals: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
  entries: CalorieLog[];
}

export interface MonthlyCalorieSummary {
  month: string;
  targetCalories: number;
  totalCalories: number;
  averageDailyCalories: number;
  averageLoggedDayCalories: number;
  averageProteinGrams: number;
  averageCarbsGrams: number;
  averageFatsGrams: number;
  daysLogged: number;
  daysInMonth: number;
  entriesCount: number;
  dailyBreakdown: Array<{
    date: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
    entryCount: number;
  }>;
  recommendations: string[];
}

export interface CalorieEstimateItem {
  name: string;
  quantity?: string;
  estimatedCalories: number;
}

export interface CalorieEstimate {
  loggedDate: string;
  mealType: CalorieLog['mealType'];
  title: string;
  rawInput: string;
  source: 'ai';
  confidence: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  notes?: string;
  parsedItems: CalorieEstimateItem[];
}

export interface CalorieInsightsResponse {
  type: 'calorie-insights';
  provider: 'gemini' | 'openai';
  model: string;
  month: string;
  content: string;
  generatedAt: string;
}

export interface AiInteraction {
  id: string;
  type:
    | 'workout-plan'
    | 'diet-plan'
    | 'coach-chat'
    | 'calorie-insights'
    | 'calorie-estimate';
  provider: 'gemini' | 'openai';
  model: string;
  promptPayload: Record<string, unknown>;
  outputText: string;
  createdAt: string;
}
