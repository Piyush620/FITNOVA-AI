import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ThemeProvider } from '../../hooks/useTheme';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

const LocationDisplay = () => {
  const location = useLocation();
  return <div>{location.pathname}</div>;
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to profile when the authenticated user block is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'vaishnavi@example.com',
        roles: ['user'],
        profile: {
          fullName: 'Vaishnavi Upadhyay',
          goal: 'Fat loss',
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

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <Header />
                  <LocationDisplay />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Vaishnavi Upadhyay'));

    expect(screen.getByText('/profile')).toBeInTheDocument();
  });

  it('toggles the theme from the header control', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isLoading: false,
      hasHydrated: true,
      error: null,
      isAuthenticated: false,
      hasSession: false,
      login: vi.fn(),
      register: vi.fn(),
      verifyEmailOtp: vi.fn(),
      resendEmailOtp: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: vi.fn(),
      setTokens: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
