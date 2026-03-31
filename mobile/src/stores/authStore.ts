import { create } from 'zustand';

import { storage, storageKeys } from '@/lib/storage';
import { authAPI, getApiErrorMessage } from '@/services/api';
import type { PendingVerificationResponse, RegisterPayload, User } from '@/types';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<PendingVerificationResponse>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  resendEmailOtp: (email: string) => Promise<PendingVerificationResponse>;
  getCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

function extractApiMessage(error: unknown) {
  if (error instanceof Error && 'response' in error) {
    return getApiErrorMessage(
      (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message,
    );
  }

  return undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hasHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      storage.getItem(storageKeys.accessToken),
      storage.getItem(storageKeys.refreshToken),
    ]);

    set({
      accessToken,
      refreshToken,
      hasHydrated: true,
    });

    if (accessToken) {
      await get().getCurrentUser();
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authAPI.login({ email, password });
      const { user, tokens } = response.data;

      await storage.setItem(storageKeys.accessToken, tokens.accessToken);

      if (tokens.refreshToken) {
        await storage.setItem(storageKeys.refreshToken, tokens.refreshToken);
      }

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: extractApiMessage(error) || 'Login failed',
        isLoading: false,
      });

      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authAPI.register(payload);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: extractApiMessage(error) || 'Registration failed',
        isLoading: false,
      });

      throw error;
    }
  },

  verifyEmailOtp: async (email, otp) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authAPI.verifyEmail({ email, otp });
      const { user, tokens } = response.data;

      await storage.setItem(storageKeys.accessToken, tokens.accessToken);

      if (tokens.refreshToken) {
        await storage.setItem(storageKeys.refreshToken, tokens.refreshToken);
      }

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: extractApiMessage(error) || 'Verification failed',
        isLoading: false,
      });

      throw error;
    }
  },

  resendEmailOtp: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authAPI.resendEmailOtp(email);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: extractApiMessage(error) || 'Could not resend OTP',
        isLoading: false,
      });

      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await authAPI.getCurrentUser();
      set({ user: response.data, error: null });
    } catch {
      await get().logout();
    }
  },

  logout: async () => {
    await storage.multiRemove([storageKeys.accessToken, storageKeys.refreshToken]);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
