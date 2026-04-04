import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AxiosHeaders } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ProfilePage } from './Profile';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    usersAPI: {
      getDashboard: vi.fn(),
      updateProfile: vi.fn(),
    },
  };
});

import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../services/api';

const mockUseAuth = vi.mocked(useAuth);
const mockGetDashboard = vi.mocked(usersAPI.getDashboard);

const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig,
});

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 'user-1',
        email: 'vaishnavi@example.com',
        roles: ['user'],
        profile: {
          fullName: 'Vaishnavi Upadhyay',
          goal: 'Fat loss',
          activityLevel: 'moderate',
          age: 24,
          gender: 'female',
          heightCm: 160,
          weightKg: 58,
        },
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      accessToken: 'token',
      isLoading: false,
      hasHydrated: true,
      error: null,
      hasSession: true,
      login: vi.fn(),
      register: vi.fn(),
      verifyEmailOtp: vi.fn(),
      resendEmailOtp: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: vi.fn(),
      setTokens: vi.fn(),
    });

    mockGetDashboard.mockResolvedValue({
      ...createAxiosResponse({
        greeting: 'Welcome back, Vaishnavi',
        currentWeight: 58,
        startingWeight: 61,
        targetWeight: 54,
        goal: 'fat loss',
        activityLevel: 'moderate',
        weeklyConsistency: 82,
        caloriesTarget: 1850,
        todaysCalories: 1600,
        remainingCalories: 250,
        monthlyAverageCalories: 1780,
        monthlyLoggedDays: 12,
        completedWorkoutsThisWeek: 4,
        completedMeals: 18,
        totalMeals: 28,
        activeWorkoutPlan: {
          id: 'w1',
          title: 'Lean Split',
          goal: 'fat loss',
          level: 'intermediate',
          status: 'active',
          startDate: '2026-03-01',
          endDate: '2026-05-24',
          daysCount: 4,
        },
        activeDietPlan: {
          id: 'd1',
          title: 'Cut Phase',
          goal: 'fat loss',
          preference: 'veg',
          status: 'active',
          targetCalories: 1850,
          startDate: '2026-03-01',
          endDate: '2026-05-24',
          daysCount: 7,
        },
        progressSummary: {
          totalCheckIns: 4,
          latestEnergyLevel: 8,
          latestMoodScore: 7,
          latestSleepQuality: 8,
          weightChangeKg: -3,
        },
        nextCheckIn: new Date().toISOString(),
      }),
    });
  });

  it('renders profile progress details from the dashboard API', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile & Progress')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('heading', { name: 'Vaishnavi Upadhyay' }).length).toBeGreaterThan(0);
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('1850')).toBeInTheDocument();
    expect(screen.getByText('Selected Plans')).toBeInTheDocument();
    expect(screen.getAllByText('Lean Split').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cut Phase').length).toBeGreaterThan(0);
    expect(screen.getByText('AI Personalization Inputs')).toBeInTheDocument();
  });
});
