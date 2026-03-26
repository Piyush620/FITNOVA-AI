import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      getCurrentUser: vi.fn(),
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
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      getCurrentUser: vi.fn(),
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
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      getCurrentUser: vi.fn(),
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

  it('should call getCurrentUser if not authenticated and not loading', () => {
    const mockGetCurrentUser = vi.fn();
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      getCurrentUser: mockGetCurrentUser,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    expect(mockGetCurrentUser).toHaveBeenCalled();
  });
});
