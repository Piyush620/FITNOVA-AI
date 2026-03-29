import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { SignupPage } from './Signup';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/Layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('SignupPage', () => {
  const register = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    register.mockResolvedValue({
      email: 'piyush@example.com',
      verificationRequired: true,
      message: 'Account created. Enter the OTP sent to your email to verify your account.',
    });

    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isLoading: false,
      hasHydrated: true,
      error: null,
      isAuthenticated: false,
      hasSession: false,
      login: vi.fn(),
      register,
      verifyEmailOtp: vi.fn(),
      resendEmailOtp: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: vi.fn(),
      setTokens: vi.fn(),
    });
  });

  it('submits registration details and navigates to the verify otp page', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<div>Verify OTP Route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Vaishnavi Upadhyay' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'vaishnavi@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/age/i), {
      target: { value: '24' },
    });
    fireEvent.change(screen.getByLabelText(/height \(cm\)/i), {
      target: { value: '160' },
    });
    fireEvent.change(screen.getByLabelText(/weight \(kg\)/i), {
      target: { value: '58' },
    });
    fireEvent.change(screen.getByLabelText(/primary goal/i), {
      target: { value: 'Fat loss' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'vaishnavi@example.com',
          fullName: 'Vaishnavi Upadhyay',
          age: 24,
          heightCm: 160,
          weightKg: 58,
          goal: 'Fat loss',
        }),
      );
    });

    expect(await screen.findByText('Verify OTP Route')).toBeInTheDocument();
  });
});
