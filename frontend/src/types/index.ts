export interface User {
  id: string;
  email: string;
  roles: Array<'user' | 'admin'>;
  profile: {
    fullName?: string;
    age?: number;
    gender?: string;
    goal?: string;
    level?: string;
    activityLevel?: string;
    heightCm?: number;
    weight?: number;
    weightKg?: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  activityLevel?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
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

export interface WorkoutDay {
  dayNumber: number;
  dayLabel: string;
  focus: string;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  completedAt?: string;
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

export interface DietDay {
  dayNumber: number;
  dayLabel: string;
  theme?: string;
  targetCalories?: number;
  meals: Meal[];
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

export interface ProgressCheckIn {
  id: string;
  userId: string;
  weightKg: number;
  energyLevel: number;
  sleepQuality: number;
  moodScore: number;
  notes?: string;
  createdAt: string;
}

export interface AiInteraction {
  id: string;
  type: 'WORKOUT_PLAN' | 'DIET_PLAN' | 'COACH_CHAT';
  provider: 'gemini' | 'openai';
  model: string;
  promptPayload: Record<string, unknown>;
  outputText: string;
  createdAt: string;
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
  completedWorkoutsThisWeek: number;
  completedMeals: number;
  totalMeals: number;
  activeWorkoutPlan: {
    id: string;
    title: string;
    status: WorkoutPlan['status'];
  } | null;
  activeDietPlan: {
    id: string;
    title: string;
    status: DietPlan['status'];
  } | null;
  progressSummary: {
    totalCheckIns: number;
    latestEnergyLevel: number | null;
    latestMoodScore: number | null;
    latestSleepQuality: number | null;
    weightChangeKg: number | null;
  };
  nextCheckIn: string;
}

export interface GenerateWorkoutPlanPayload {
  weight: string;
  goal: string;
  experience: string;
  equipment: string;
}

export interface GenerateDietPlanPayload {
  goal: string;
  calories: number;
  preference: 'veg' | 'non-veg';
  budget: 'low' | 'medium' | 'high';
}
