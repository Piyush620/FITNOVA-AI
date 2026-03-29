import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosHeaders } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { BillingPage } from './Billing';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/Layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../utils/toast', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    subscriptionsAPI: {
      getStatus: vi.fn(),
      getCurrent: vi.fn(),
      confirmCheckoutSession: vi.fn(),
      createCheckoutSession: vi.fn(),
    },
  };
});

import { useAuth } from '../hooks/useAuth';
import { subscriptionsAPI } from '../services/api';

const mockUseAuth = vi.mocked(useAuth);
const mockGetStatus = vi.mocked(subscriptionsAPI.getStatus);
const mockGetCurrent = vi.mocked(subscriptionsAPI.getCurrent);
const mockConfirmCheckoutSession = vi.mocked(subscriptionsAPI.confirmCheckoutSession);

const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig,
});

describe('BillingPage', () => {
  const getCurrentUser = vi.fn();

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
        },
        subscription: {
          tier: 'free',
          plan: 'free',
          status: 'inactive',
          hasPremiumAccess: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
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
      getCurrentUser,
      clearError: vi.fn(),
      setTokens: vi.fn(),
    });

    mockGetStatus.mockResolvedValue(
      createAxiosResponse({
        stripeConfigured: true,
        persistenceConfigured: true,
        persistenceProvider: 'mongodb',
        monthlyPriceConfigured: true,
        yearlyPriceConfigured: true,
      }),
    );

    mockGetCurrent
      .mockResolvedValueOnce(
        createAxiosResponse({
          tier: 'free',
          plan: 'free',
          status: 'inactive',
          hasPremiumAccess: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        }),
      )
      .mockResolvedValue(
        createAxiosResponse({
          tier: 'premium',
          plan: 'monthly',
          status: 'active',
          hasPremiumAccess: true,
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          currentPeriodStart: '2026-03-01T00:00:00.000Z',
          currentPeriodEnd: '2026-04-01T00:00:00.000Z',
          cancelAtPeriodEnd: false,
        }),
      );

    mockConfirmCheckoutSession.mockResolvedValue(
      createAxiosResponse({
        tier: 'premium',
        plan: 'monthly',
        status: 'active',
        hasPremiumAccess: true,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        currentPeriodStart: '2026-03-01T00:00:00.000Z',
        currentPeriodEnd: '2026-04-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      }),
    );
  });

  it('confirms a successful checkout return and shows active premium state', async () => {
    render(
      <MemoryRouter initialEntries={['/billing?checkout=success&session_id=cs_test_123']}>
        <Routes>
          <Route path="/billing" element={<BillingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockConfirmCheckoutSession).toHaveBeenCalledWith('cs_test_123');
    });

    expect(
      await screen.findByText('Checkout completed successfully. Your premium access is active.'),
    ).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalled();
  });
});
