import { render, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import DashboardScreen from './dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { usersAPI } from '@/services/api';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  usersAPI: {
    getDashboard: jest.fn(),
  },
}));

jest.mock('@/components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => {
    const { View: MockView } = require('react-native');
    return <MockView>{children}</MockView>;
  },
}));

jest.mock('@/components/Panel', () => ({
  Panel: ({ children }: { children: React.ReactNode }) => {
    const { View: MockView } = require('react-native');
    return <MockView>{children}</MockView>;
  },
}));

jest.mock('@/components/SectionHeader', () => ({
  SectionHeader: ({ title, subtitle }: { title: string; subtitle: string }) => {
    const { View: MockView, Text: MockText } = require('react-native');
    return (
      <MockView>
        <MockText>{title}</MockText>
        <MockText>{subtitle}</MockText>
      </MockView>
    );
  },
}));

jest.mock('@/components/AppText', () => ({
  AppText: ({ children }: { children: React.ReactNode }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{children}</MockText>;
  },
}));

jest.mock('@/components/StatCard', () => ({
  StatCard: ({ label, value, caption }: { label: string; value: string | number; caption: string }) => {
    const { View: MockView, Text: MockText } = require('react-native');
    return (
      <MockView>
        <MockText>{label}</MockText>
        <MockText>{String(value)}</MockText>
        <MockText>{caption}</MockText>
      </MockView>
    );
  },
}));

jest.mock('@/components/AppButton', () => ({
  AppButton: ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => {
    const { TouchableOpacity: MockTouchableOpacity, Text: MockText } = require('react-native');
    return <MockTouchableOpacity onPress={onPress}><MockText>{children}</MockText></MockTouchableOpacity>;
  },
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseToast = jest.mocked(useToast);
const mockedUsersApi = jest.mocked(usersAPI);

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'demo@fitnova.ai',
        roles: ['user'],
        subscription: {
          tier: 'premium',
          plan: 'monthly',
          status: 'active',
          hasPremiumAccess: true,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
        profile: {},
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    } as ReturnType<typeof useAuth>);
    mockedUseToast.mockReturnValue({
      showToast: jest.fn(),
      hideToast: jest.fn(),
    });
  });

  it('loads and renders the dashboard summary', async () => {
    mockedUsersApi.getDashboard.mockResolvedValueOnce({
      data: {
        greeting: 'Welcome back, Demo',
        currentWeight: 76,
        startingWeight: 82,
        targetWeight: 72,
        goal: 'Fat loss',
        activityLevel: 'moderate',
        weeklyConsistency: 84,
        caloriesTarget: 2200,
        todaysCalories: 1450,
        remainingCalories: 750,
        monthlyAverageCalories: 2100,
        monthlyLoggedDays: 15,
        completedWorkoutsThisWeek: 3,
        completedMeals: 8,
        totalMeals: 12,
        nextCheckIn: 'Friday',
      },
    } as never);

    const screen = render(<DashboardScreen />);

    await waitFor(() => {
      expect(mockedUsersApi.getDashboard).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Welcome back, Demo')).toBeTruthy();
      expect(screen.getByText('750')).toBeTruthy();
      expect(screen.getByText('84%')).toBeTruthy();
      expect(screen.getByText('Premium coach unlocked')).toBeTruthy();
    });
  });

  it('shows the offline fallback message when the dashboard request fails', async () => {
    mockedUsersApi.getDashboard.mockRejectedValueOnce(new Error('Network down'));

    const screen = render(<DashboardScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Dashboard sync will appear here once the API is reachable from your device.',
        ),
      ).toBeTruthy();
    });
  });
});
