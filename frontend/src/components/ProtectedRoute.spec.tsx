import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['user'],
        profile: { fullName: 'Test User' },
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
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isLoading: true,
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

    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    const loadingDiv = container.querySelector('.animate-spin');
    expect(loadingDiv).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
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
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    // Content should not be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should keep showing loading state while a stored session is being resolved', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: 'token',
      isLoading: false,
      hasHydrated: true,
      error: null,
      isAuthenticated: false,
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

    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    const loadingDiv = container.querySelector('.animate-spin');
    expect(loadingDiv).toBeInTheDocument();
  });
});
