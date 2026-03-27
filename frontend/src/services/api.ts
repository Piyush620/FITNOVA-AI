import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  User,
  LoginPayload,
  RegisterPayload,
  WorkoutPlan,
  DietPlan,
  ProgressCheckIn,
  AiInteraction,
  DashboardSummary,
  GenerateWorkoutPlanPayload,
  GenerateDietPlanPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

type ApiErrorResponse = {
  message?: string | string[];
};

type AuthResponse = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

type PaginatedResponse<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages?: number };
};

type PlanMutationPayload = Record<string, unknown>;
type AiStatusResponse = Record<string, unknown>;
type AiGenerationResponse = Record<string, unknown>;
type CoachChatResponse = {
  type: 'coach-chat';
  provider: 'gemini' | 'openai';
  model: string;
  reply: string;
  generatedAt: string;
};

type UpdateUserProfilePayload = {
  fullName?: string;
  avatarUrl?: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  activityLevel?: string;
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

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.tokens;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload),

  getCurrentUser: () => apiClient.get<User>('/auth/me'),
};

export const usersAPI = {
  getProfile: () => apiClient.get<User>('/users/me'),

  getDashboard: () => apiClient.get<DashboardSummary>('/users/me/dashboard'),

  updateProfile: (payload: UpdateUserProfilePayload) =>
    apiClient.patch<User>('/users/me', payload),
};

export const workoutsAPI = {
  listPlans: (page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<WorkoutPlan>>('/workouts/plans', { params: { page, limit } }),

  getActivePlan: () => apiClient.get<WorkoutPlan>('/workouts/plans/active'),

  getPlan: (planId: string) => apiClient.get<WorkoutPlan>(`/workouts/plans/${planId}`),

  createPlan: (payload: PlanMutationPayload) => apiClient.post<WorkoutPlan>('/workouts/plans', payload),

  activatePlan: (planId: string) => apiClient.post<WorkoutPlan>(`/workouts/plans/${planId}/activate`, {}),

  restartPlan: (planId: string) => apiClient.post<WorkoutPlan>(`/workouts/plans/${planId}/restart`, {}),

  deletePlan: (planId: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/workouts/plans/${planId}`),

  completeSession: (planId: string, dayNumber: number) =>
    apiClient.post<WorkoutPlan>(`/workouts/plans/${planId}/sessions/${dayNumber}/complete`, {}),
};

export const dietAPI = {
  listPlans: (page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<DietPlan>>('/diet/plans', { params: { page, limit } }),

  getActivePlan: () => apiClient.get<DietPlan>('/diet/plans/active'),

  getPlan: (planId: string) => apiClient.get<DietPlan>(`/diet/plans/${planId}`),

  createPlan: (payload: PlanMutationPayload) => apiClient.post<DietPlan>('/diet/plans', payload),

  activatePlan: (planId: string) => apiClient.post<DietPlan>(`/diet/plans/${planId}/activate`, {}),

  restartPlan: (planId: string) => apiClient.post<DietPlan>(`/diet/plans/${planId}/restart`, {}),

  deletePlan: (planId: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/diet/plans/${planId}`),

  completeMeal: (planId: string, dayNumber: number, mealType: string) =>
    apiClient.post<DietPlan>(`/diet/plans/${planId}/days/${dayNumber}/meals/${mealType}/complete`, {}),
};

export const progressAPI = {
  logCheckIn: (payload: Omit<ProgressCheckIn, 'id' | 'userId' | 'createdAt'>) =>
    apiClient.post<ProgressCheckIn>('/progress', payload),

  getHistory: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<ProgressCheckIn>>('/progress', { params: { page, limit } }),
};

export const aiAPI = {
  getStatus: () => apiClient.get<AiStatusResponse>('/ai/status'),

  getHistory: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<AiInteraction>>('/ai/history', { params: { page, limit } }),

  generateWorkoutPlan: (payload: GenerateWorkoutPlanPayload) =>
    apiClient.post<AiGenerationResponse>('/ai/workout-plan', payload),

  generateAndSaveWorkoutPlan: (payload: GenerateWorkoutPlanPayload) =>
    apiClient.post<AiGenerationResponse>('/ai/workout-plan/save', payload),

  generateDietPlan: (payload: GenerateDietPlanPayload) =>
    apiClient.post<AiGenerationResponse>('/ai/diet-plan', payload),

  generateAndSaveDietPlan: (payload: GenerateDietPlanPayload) =>
    apiClient.post<AiGenerationResponse>('/ai/diet-plan/save', payload),

  coachChat: (message: string) => apiClient.post<CoachChatResponse>('/ai/coach-chat', { message }),

  getAdaptivePlan: (focusArea?: string) =>
    apiClient.post<AiGenerationResponse>('/ai/adaptive-plan', { focusArea }),
};

export default apiClient;
