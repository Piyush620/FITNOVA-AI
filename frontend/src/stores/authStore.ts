import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User, AuthTokens, PendingVerificationResponse } from '../types';
import { authAPI, getApiErrorMessage } from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';

type ApiErrorResponse = {
  message?: string | string[];
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;

  // Actions
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    heightCm?: number;
    weightKg?: number;
    goal?: string;
    activityLevel?: string;
  }) => Promise<PendingVerificationResponse>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  resendEmailOtp: (email: string) => Promise<PendingVerificationResponse>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (value: boolean) => void;
}

let getCurrentUserRequest: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      hasHydrated: false,
      error: null,

      setTokens: (tokens: AuthTokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
        });
        if (tokens.accessToken) {
          localStorage.setItem('accessToken', tokens.accessToken);
        }
        if (tokens.refreshToken) {
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
      },

      setUser: (user: User) => set({ user }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          const {
            user,
            tokens: { accessToken, refreshToken },
          } = response.data;

          set({
            user,
            accessToken,
            refreshToken: refreshToken || null,
            isLoading: false,
          });

          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          toastSuccess('Welcome back!');
        } catch (error) {
          const message = axios.isAxiosError<ApiErrorResponse>(error)
            ? getApiErrorMessage(error.response?.data?.message)
            : undefined;
          const errorMsg = message || 'Login failed';
          set({
            error: errorMsg,
            isLoading: false,
          });
          toastError(errorMsg);
          throw error;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(payload);
          set({ isLoading: false });
          toastSuccess('Account created. Check your email for the verification OTP.');
          return response.data;
        } catch (error) {
          const message = axios.isAxiosError<ApiErrorResponse>(error)
            ? getApiErrorMessage(error.response?.data?.message)
            : undefined;
          const errorMsg = message || 'Registration failed';
          set({
            error: errorMsg,
            isLoading: false,
          });
          toastError(errorMsg);
          throw error;
        }
      },

      verifyEmailOtp: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.verifyEmail({ email, otp });
          const {
            user,
            tokens: { accessToken, refreshToken },
          } = response.data;

          set({
            user,
            accessToken,
            refreshToken: refreshToken || null,
            isLoading: false,
          });

          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          toastSuccess('Email verified. Welcome to FitNova.');
        } catch (error) {
          const message = axios.isAxiosError<ApiErrorResponse>(error)
            ? getApiErrorMessage(error.response?.data?.message)
            : undefined;
          const errorMsg = message || 'Verification failed';
          set({
            error: errorMsg,
            isLoading: false,
          });
          toastError(errorMsg);
          throw error;
        }
      },

      resendEmailOtp: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.resendEmailOtp(email);
          set({ isLoading: false });
          toastSuccess('A fresh OTP has been sent to your email.');
          return response.data;
        } catch (error) {
          const message = axios.isAxiosError<ApiErrorResponse>(error)
            ? getApiErrorMessage(error.response?.data?.message)
            : undefined;
          const errorMsg = message || 'Could not resend OTP';
          set({
            error: errorMsg,
            isLoading: false,
          });
          toastError(errorMsg);
          throw error;
        }
      },

      logout: () => {
        getCurrentUserRequest = null;
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        toastSuccess('Logged out successfully');
      },

      getCurrentUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          getCurrentUserRequest = null;
          set({ user: null });
          return;
        }

        if (getCurrentUserRequest) {
          return getCurrentUserRequest;
        }

        set({ isLoading: true });
        getCurrentUserRequest = (async () => {
          try {
            const response = await authAPI.getCurrentUser();
            set({ user: response.data, isLoading: false });
          } catch {
            set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          } finally {
            getCurrentUserRequest = null;
          }
        })();

        return getCurrentUserRequest;
      },

      clearError: () => set({ error: null }),
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
