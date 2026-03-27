import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { CaloriesPage } from './Calories';

vi.mock('../components/Layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    caloriesAPI: {
      getDaily: vi.fn(),
      getMonthlySummary: vi.fn(),
      createLog: vi.fn(),
      updateLog: vi.fn(),
      deleteLog: vi.fn(),
    },
    aiAPI: {
      getCalorieInsights: vi.fn(),
    },
  };
});

vi.mock('../utils/toast', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

import { aiAPI, caloriesAPI } from '../services/api';

describe('CaloriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (caloriesAPI.getDaily as any).mockResolvedValue({
      data: {
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
      },
    });

    (caloriesAPI.getMonthlySummary as any).mockResolvedValue({
      data: {
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
      },
    });

    (caloriesAPI.createLog as any).mockResolvedValue({
      data: { id: 'entry-2' },
    });

    (aiAPI.getCalorieInsights as any).mockResolvedValue({
      data: {
        content: 'Your intake is drifting higher on weekends. Tighten two meals first.',
      },
    });
  });

  it('renders daily and monthly calorie data', async () => {
    render(
      <MemoryRouter>
        <CaloriesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Live Calorie Tracking')).toBeInTheDocument();
    });

    expect(screen.getByText('Oats bowl')).toBeInTheDocument();
    expect(screen.getByText('Keep protein steady on weekdays.')).toBeInTheDocument();
    expect(screen.getByText('22000')).toBeInTheDocument();
  });

  it('creates a calorie entry from the form', async () => {
    render(
      <MemoryRouter>
        <CaloriesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Log a meal or snack')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Paneer wrap, oats bowl, whey shake...'), {
      target: { value: 'Chicken wrap' },
    });
    fireEvent.change(screen.getByPlaceholderText('450'), {
      target: { value: '540' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Entry' }));

    await waitFor(() => {
      expect(caloriesAPI.createLog).toHaveBeenCalledWith(
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
      expect(screen.getByText('AI Calorie Insight')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'AI Review' }));

    await waitFor(() => {
      expect(aiAPI.getCalorieInsights).toHaveBeenCalledWith('2026-03');
    });

    expect(
      await screen.findByText('Your intake is drifting higher on weekends. Tighten two meals first.'),
    ).toBeInTheDocument();
  });
});
