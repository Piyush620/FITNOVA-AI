import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../Common';
import { useTheme } from '../../hooks/useTheme';
import { preloadRoute } from '../../App';

const getInitials = (name?: string, email?: string) => {
  const source = name?.trim() || email || 'F';
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'F';
};

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, hasHydrated, hasSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isAuthPending = !hasHydrated || (hasSession && !isAuthenticated);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Workouts', path: '/workouts' },
    { label: 'Diet', path: '/diet' },
    { label: 'Calories', path: '/calories' },
    { label: 'AI Coach', path: '/coach' },
    { label: 'Billing', path: '/billing' },
  ];

  const isActivePath = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const themeButtonLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const navLinkClass = (path: string) =>
    isActivePath(path) ? 'theme-nav-link theme-nav-link-active' : 'theme-nav-link';

  const warmRoute = (path: string) => {
    void preloadRoute(path);
  };

  return (
    <header className="theme-header sticky top-0 z-50 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <div className="theme-brand-badge flex h-10 w-10 items-center justify-center rounded-[1rem] border text-base font-bold shadow-[0_12px_28px_rgba(255,181,211,0.22)]">
              F
            </div>
            <h1 className="theme-brand-wordmark text-xl font-bold">FitNova</h1>
          </button>

          <nav className="hidden items-center gap-3 md:flex">
            {isAuthPending ? (
              <div className="theme-skeleton h-10 w-48 animate-pulse rounded-xl border" />
            ) : isAuthenticated ? (
              <>
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onMouseEnter={() => warmRoute(item.path)}
                    onFocus={() => warmRoute(item.path)}
                    onClick={() => navigate(item.path)}
                    className={navLinkClass(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label={themeButtonLabel}
                  onClick={toggleTheme}
                  className="theme-toggle-button inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
                <div className="theme-header-divider ml-3 flex items-center gap-3 pl-3">
                  <button
                    type="button"
                    onMouseEnter={() => warmRoute('/profile')}
                    onFocus={() => warmRoute('/profile')}
                    onClick={() => navigate('/profile')}
                    className="theme-profile-chip flex items-center gap-3 rounded-[1rem] px-2 py-1.5 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {user?.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt={user.profile.fullName || 'Profile'}
                        className="theme-profile-avatar h-10 w-10 rounded-full border object-cover"
                      />
                    ) : (
                      <div className="theme-profile-avatar flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                        {getInitials(user?.profile?.fullName, user?.email)}
                      </div>
                    )}
                    <div className="text-right">
                      <p className="theme-profile-name text-sm">{user?.profile?.fullName || user?.email}</p>
                      <p className="theme-profile-meta text-xs uppercase tracking-[0.2em]">
                        {user?.profile?.goal || 'Member'}
                      </p>
                    </div>
                  </button>
                  <Button size="sm" variant="secondary" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label={themeButtonLabel}
                  onClick={toggleTheme}
                  className="theme-toggle-button inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
                <Button variant="secondary" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </nav>

          <button
            type="button"
            className="theme-header-icon md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen ? (
          <div className="theme-mobile-panel space-y-3 border-t py-4 md:hidden">
            {isAuthPending ? (
              <div className="theme-skeleton h-24 animate-pulse rounded-xl border" />
            ) : isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    setIsMenuOpen(false);
                  }}
                  className="theme-mobile-user flex w-full items-center gap-3 rounded-xl border p-3 text-left"
                >
                  {user?.profile?.avatarUrl ? (
                    <img
                      src={user.profile.avatarUrl}
                      alt={user.profile.fullName || 'Profile'}
                      className="theme-profile-avatar h-12 w-12 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="theme-profile-avatar flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold">
                      {getInitials(user?.profile?.fullName, user?.email)}
                    </div>
                  )}
                  <div>
                    <p className="theme-profile-name text-sm font-medium">{user?.profile?.fullName || user?.email}</p>
                    <p className="theme-profile-meta mt-1 text-xs uppercase tracking-[0.2em]">
                      {user?.profile?.goal || 'Member'}
                    </p>
                  </div>
                </button>
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onMouseEnter={() => warmRoute(item.path)}
                    onFocus={() => warmRoute(item.path)}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`${navLinkClass(item.path)} block w-full text-left`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label={themeButtonLabel}
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="theme-toggle-button block w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-all duration-300"
                >
                  {themeButtonLabel}
                </button>
                <Button fullWidth variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label={themeButtonLabel}
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="theme-toggle-button block w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-all duration-300"
                >
                  {themeButtonLabel}
                </button>
                <Button fullWidth variant="secondary" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button fullWidth onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};
