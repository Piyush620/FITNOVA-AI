import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
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

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        email: 'vaishnavi@example.com',
        profile: {
          fullName: 'Vaishnavi Upadhyay',
          goal: 'Fat loss',
          activityLevel: 'moderate',
          age: 24,
          gender: 'female',
          heightCm: 160,
          weightKg: 58,
        },
      },
      getCurrentUser: vi.fn(),
    });

    mockGetDashboard.mockResolvedValue({
      data: {
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
        activeWorkoutPlan: { id: 'w1', title: 'Lean Split', status: 'active' },
        activeDietPlan: { id: 'd1', title: 'Cut Phase', status: 'active' },
        progressSummary: {
          totalCheckIns: 4,
          latestEnergyLevel: 8,
          latestMoodScore: 7,
          latestSleepQuality: 8,
          weightChangeKg: -3,
        },
        nextCheckIn: new Date().toISOString(),
      },
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

    expect(screen.getByText('Vaishnavi Upadhyay')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('1850')).toBeInTheDocument();
    expect(screen.getByText('AI Personalization Inputs')).toBeInTheDocument();
  });
});
