import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

import { mobileAppConfig } from '@/config/app';
import { storage, storageKeys } from '@/lib/storage';
import type {
  AiInteraction,
  AuthTokens,
  CalorieEstimate,
  CalorieInsightsResponse,
  CalorieLog,
  CheckoutSessionResponse,
  DailyCalorieLogResponse,
  DietPlan,
  DashboardSummary,
  LoginPayload,
  MonthlyCalorieSummary,
  PendingVerificationResponse,
  RegisterPayload,
  SubscriptionConfigStatus,
  SubscriptionSummary,
  User,
  VerifyEmailOtpPayload,
  WorkoutPlan,
} from '@/types';

const API_BASE_URL = mobileAppConfig.apiBaseUrl;

type ApiErrorResponse = {
  message?: string | string[];
};

type AuthResponse = {
  user: User;
  tokens: AuthTokens;
};

type PaginatedResponse<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages?: number };
};

type CoachChatResponse = {
  type: 'coach-chat';
  provider: 'gemini' | 'openai';
  model: string;
  reply: string;
  generatedAt: string;
};
type CalorieEstimateResponse = {
  type: 'calorie-estimate';
  provider: 'gemini' | 'openai';
  model: string;
  estimate: CalorieEstimate;
  generatedAt: string;
};
type GeneratedWorkoutPlanResponse = {
  type: 'workout-plan';
  provider: 'gemini' | 'openai';
  model: string;
  saved: true;
  plan: WorkoutPlan;
  generatedAt: string;
};
type GeneratedDietPlanResponse = {
  type: 'diet-plan';
  provider: 'gemini' | 'openai';
  model: string;
  saved: true;
  plan: DietPlan;
  generatedAt: string;
};

type RetryableRequestConfig = {
  _retry?: boolean;
  headers?: {
    Authorization?: string;
  };
};

export const getApiErrorMessage = (message?: string | string[]) => {
  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItem(storageKeys.accessToken);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem(storageKeys.refreshToken);

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: nextRefreshToken } = response.data.tokens;

        await storage.setItem(storageKeys.accessToken, accessToken);

        if (nextRefreshToken) {
          await storage.setItem(storageKeys.refreshToken, nextRefreshToken);
        }

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return apiClient(originalRequest);
      } catch {
        await storage.multiRemove([storageKeys.accessToken, storageKeys.refreshToken]);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', payload),
  register: (payload: RegisterPayload) =>
    apiClient.post<PendingVerificationResponse>('/auth/register', payload),
  verifyEmail: (payload: VerifyEmailOtpPayload) =>
    apiClient.post<AuthResponse>('/auth/verify-email', payload),
  resendEmailOtp: (email: string) =>
    apiClient.post<PendingVerificationResponse>('/auth/resend-email-otp', { email }),
  getCurrentUser: () => apiClient.get<User>('/auth/me'),
};

export const usersAPI = {
  getDashboard: () => apiClient.get<DashboardSummary>('/users/me/dashboard'),
  getProfile: () => apiClient.get<User>('/users/me'),
  updateProfile: (payload: {
    fullName?: string;
    avatarUrl?: string | null;
    age?: number;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
    goal?: string;
    activityLevel?: string;
  }) => apiClient.patch<User>('/users/me', payload),
};

export const workoutsAPI = {
  listPlans: (page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<WorkoutPlan>>('/workouts/plans', { params: { page, limit } }),
  getActivePlan: () => apiClient.get<WorkoutPlan>('/workouts/plans/active'),
  activatePlan: (planId: string) => apiClient.post<WorkoutPlan>(`/workouts/plans/${planId}/activate`, {}),
  restartPlan: (planId: string) => apiClient.post<WorkoutPlan>(`/workouts/plans/${planId}/restart`, {}),
  deletePlan: (planId: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/workouts/plans/${planId}`),
  completeSession: (planId: string, dayNumber: number, completedDate?: string) =>
    apiClient.post<WorkoutPlan>(`/workouts/plans/${planId}/sessions/${dayNumber}/complete`, { completedDate }),
};

export const dietAPI = {
  listPlans: (page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<DietPlan>>('/diet/plans', { params: { page, limit } }),
  getActivePlan: () => apiClient.get<DietPlan>('/diet/plans/active'),
  activatePlan: (planId: string) => apiClient.post<DietPlan>(`/diet/plans/${planId}/activate`, {}),
  restartPlan: (planId: string) => apiClient.post<DietPlan>(`/diet/plans/${planId}/restart`, {}),
  deletePlan: (planId: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/diet/plans/${planId}`),
  completeMeal: (planId: string, dayNumber: number, mealType: string, completedDate?: string) =>
    apiClient.post<DietPlan>(`/diet/plans/${planId}/days/${dayNumber}/meals/${mealType}/complete`, { completedDate }),
};

export const caloriesAPI = {
  getDaily: (date?: string) =>
    apiClient.get<DailyCalorieLogResponse>('/calorie-logs/daily', { params: { date } }),
  getMonthlySummary: (month?: string) =>
    apiClient.get<MonthlyCalorieSummary>('/calorie-logs/monthly-summary', { params: { month } }),
  createLog: (payload: {
    loggedDate: string;
    mealType: CalorieLog['mealType'];
    title: string;
    source?: 'manual' | 'ai' | 'diet-plan' | 'workout-plan';
    calories: number;
    proteinGrams?: number | null;
    carbsGrams?: number | null;
    fatsGrams?: number | null;
    notes?: string | null;
  }) => apiClient.post<CalorieLog>('/calorie-logs', payload),
  deleteLog: (logId: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/calorie-logs/${logId}`),
};

export const aiAPI = {
  getHistory: (page = 1, limit = 20, type?: AiInteraction['type']) =>
    apiClient.get<PaginatedResponse<AiInteraction>>('/ai/history', {
      params: { page, limit, type },
    }),
  coachChat: (message: string) => apiClient.post<CoachChatResponse>('/ai/coach-chat', { message }),
  estimateCalories: (payload: {
    loggedDate: string;
    mealType: CalorieLog['mealType'];
    rawInput: string;
  }) => apiClient.post<CalorieEstimateResponse>('/ai/calorie-estimate', payload),
  getCalorieInsights: (month?: string) =>
    apiClient.post<CalorieInsightsResponse>('/ai/calorie-insights', { month }),
  generateAndSaveWorkoutPlan: (payload: {
    weight: string;
    goal: string;
    experience: string;
    trainingDaysPerWeek: number;
    equipment: string;
  }) => apiClient.post<GeneratedWorkoutPlanResponse>('/ai/workout-plan/save', payload),
  generateAndSaveDietPlan: (payload: {
    goal: string;
    currentWeightKg: number;
    targetWeightKg: number;
    timelineWeeks: number;
    preference: 'veg' | 'non-veg' | 'eggetarian';
    cuisineRegion: 'north-indian' | 'south-indian' | 'east-indian' | 'west-indian' | 'mixed-indian';
    budget: 'low' | 'medium' | 'high';
  }) => apiClient.post<GeneratedDietPlanResponse>('/ai/diet-plan/save', payload),
};

export const subscriptionsAPI = {
  getStatus: () => apiClient.get<SubscriptionConfigStatus>('/subscriptions/status'),
  getCurrent: () => apiClient.get<SubscriptionSummary>('/subscriptions/me'),
  confirmCheckoutSession: (sessionId: string) =>
    apiClient.post<SubscriptionSummary>('/subscriptions/checkout-session/confirm', { sessionId }),
  createCheckoutSession: (payload: {
    plan: 'monthly' | 'yearly';
    successUrl: string;
    cancelUrl: string;
  }) => apiClient.post<CheckoutSessionResponse>('/subscriptions/checkout-session', payload),
};

export default apiClient;
