import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './Header';

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
        email: 'vaishnavi@example.com',
        profile: {
          fullName: 'Vaishnavi Upadhyay',
          goal: 'Fat loss',
        },
      },
      logout: vi.fn(),
      isAuthenticated: true,
      hasHydrated: true,
      hasSession: true,
    });

    render(
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
    );

    fireEvent.click(screen.getByText('Vaishnavi Upadhyay'));

    expect(screen.getByText('/profile')).toBeInTheDocument();
  });
});
