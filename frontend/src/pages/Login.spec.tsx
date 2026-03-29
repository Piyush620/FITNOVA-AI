import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { LoginPage } from './Login';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/Layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('LoginPage', () => {
  const login = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    login.mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isLoading: false,
      hasHydrated: true,
      error: null,
      isAuthenticated: false,
      hasSession: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: vi.fn(),
      setTokens: vi.fn(),
    });
  });

  it('submits credentials and navigates to the dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard Route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'vaishnavi@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('vaishnavi@example.com', 'secret123');
    });

    expect(await screen.findByText('Dashboard Route')).toBeInTheDocument();
  });
});
