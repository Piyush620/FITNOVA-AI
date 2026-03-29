import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AxiosHeaders } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { CaloriesPage } from './Calories';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/Layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    dietAPI: {
      getActivePlan: vi.fn(),
    },
    caloriesAPI: {
      getDaily: vi.fn(),
      getMonthlySummary: vi.fn(),
      createLog: vi.fn(),
      updateLog: vi.fn(),
      deleteLog: vi.fn(),
    },
    aiAPI: {
      getCalorieInsights: vi.fn(),
      estimateCalorieLog: vi.fn(),
    },
  };
});

vi.mock('../utils/toast', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

import { aiAPI, caloriesAPI, dietAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);
const mockGetActivePlan = vi.mocked(dietAPI.getActivePlan);
const mockGetDaily = vi.mocked(caloriesAPI.getDaily);
const mockGetMonthlySummary = vi.mocked(caloriesAPI.getMonthlySummary);
const mockCreateLog = vi.mocked(caloriesAPI.createLog);
const mockGetCalorieInsights = vi.mocked(aiAPI.getCalorieInsights);

const createAxiosResponse = <T,>(data: T, status = 200, statusText = 'OK'): AxiosResponse<T> => ({
  data,
  status,
  statusText,
  headers: {},
  config: {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig,
});

describe('CaloriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
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
        subscription: {
          tier: 'premium',
          plan: 'monthly',
          status: 'active',
          hasPremiumAccess: true,
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          currentPeriodStart: '2026-03-01T00:00:00.000Z',
          currentPeriodEnd: '2026-04-01T00:00:00.000Z',
          cancelAtPeriodEnd: false,
        },
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      accessToken: 'token',
      isLoading: false,
      hasHydrated: true,
      error: null,
      isAuthenticated: true,
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

    mockGetDaily.mockResolvedValue({
      ...createAxiosResponse({
        date: '2026-03-27',
        targetCalories: 2200,
        totals: {
          calories: 900,
          proteinGrams: 55,
          carbsGrams: 90,
          fatsGrams: 20,
        },
        entries: [
          {
            id: 'entry-1',
            userId: 'user-1',
            loggedDate: '2026-03-27',
            mealType: 'breakfast',
            title: 'Oats bowl',
            calories: 450,
            proteinGrams: 20,
            carbsGrams: 55,
            fatsGrams: 10,
            createdAt: '2026-03-27T08:00:00.000Z',
          },
        ],
      }),
    });

    mockGetMonthlySummary.mockResolvedValue({
      ...createAxiosResponse({
        month: '2026-03',
        targetCalories: 2200,
        totalCalories: 22000,
        averageDailyCalories: 710,
        averageLoggedDayCalories: 2000,
        averageProteinGrams: 120,
        averageCarbsGrams: 190,
        averageFatsGrams: 55,
        daysLogged: 11,
        daysInMonth: 31,
        entriesCount: 27,
        dailyBreakdown: [
          {
            date: '2026-03-27',
            calories: 900,
            proteinGrams: 55,
            carbsGrams: 90,
            fatsGrams: 20,
            entryCount: 1,
          },
        ],
        recommendations: ['Keep protein steady on weekdays.'],
      }),
    });

    mockCreateLog.mockResolvedValue({
      ...createAxiosResponse({
        id: 'entry-2',
        userId: 'user-1',
        loggedDate: '2026-03-27',
        mealType: 'lunch',
        title: 'Chicken wrap',
        source: 'manual',
        calories: 540,
        proteinGrams: 45,
        carbsGrams: 50,
        fatsGrams: 20,
        createdAt: '2026-03-27T12:00:00.000Z',
      }, 201, 'Created'),
    })

    mockGetCalorieInsights.mockResolvedValue({
      ...createAxiosResponse({
        type: 'calorie-insights',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        month: '2026-03',
        content: 'Your intake is drifting higher on weekends. Tighten two meals first.',
        generatedAt: '2026-03-27T00:00:00.000Z',
      }),
    });

    mockGetActivePlan.mockResolvedValue({
      ...createAxiosResponse({
        id: 'diet-1',
        userId: 'user-1',
        title: 'Cut Phase',
        goal: 'Fat loss',
        preference: 'veg',
        targetCalories: 2200,
        status: 'active',
        isAiGenerated: true,
        startDate: '2026-03-27T00:00:00.000Z',
        endDate: '2026-04-02T00:00:00.000Z',
        createdAt: '2026-03-27T00:00:00.000Z',
        updatedAt: '2026-03-27T00:00:00.000Z',
        days: [
          {
            dayNumber: 1,
            dayLabel: 'Day 1',
            theme: 'High-protein reset',
            targetCalories: 2200,
            meals: [
              {
                type: 'lunch',
                title: 'Paneer bowl',
                description: 'Paneer, rice, and vegetables',
                items: ['Paneer', 'Rice', 'Vegetables'],
                calories: 540,
                proteinGrams: 35,
                carbsGrams: 55,
                fatsGrams: 18,
              },
            ],
          },
        ],
      }),
    });
  });

  it('renders daily and monthly calorie data', async () => {
    render(
      <MemoryRouter>
        <CaloriesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Describe the meal.')).toBeInTheDocument();
    });

    expect(screen.getByText('Oats bowl')).toBeInTheDocument();
    expect(screen.getByText('Keep protein steady on weekdays.')).toBeInTheDocument();
    expect(screen.getByText('1300')).toBeInTheDocument();
    expect(screen.getByText('Diet-linked quick log')).toBeInTheDocument();
  });

  it('creates a calorie entry from the form', async () => {
    render(
      <MemoryRouter>
        <CaloriesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('What did you eat?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Manual' }));

    fireEvent.click(screen.getByRole('button', { name: 'Use In Manual Logger' }));

    fireEvent.change(screen.getByLabelText(/Meal title/i), {
      target: { value: 'Chicken wrap' },
    });
    fireEvent.change(screen.getByLabelText(/^Calories$/i), {
      target: { value: '540' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Manual Entry' }));

    await waitFor(() => {
      expect(mockCreateLog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Chicken wrap',
          calories: 540,
        }),
      );
    });
  });

  it('generates AI calorie insights', async () => {
    render(
      <MemoryRouter>
        <CaloriesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'AI Review' }));

    await waitFor(() => {
      expect(mockGetCalorieInsights).toHaveBeenCalledWith('2026-03');
    });

    expect(
      await screen.findByText('Your intake is drifting higher on weekends. Tighten two meals first.'),
    ).toBeInTheDocument();
  });
});
