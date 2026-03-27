import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../Common';

const getInitials = (name?: string, email?: string) => {
  const source = name?.trim() || email || 'F';
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'F';
};

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, hasHydrated, hasSession } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isAuthPending = !hasHydrated || (hasSession && !isAuthenticated);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Workouts', path: '/workouts' },
    { label: 'Diet', path: '/diet' },
    { label: 'Calories', path: '/calories' },
    { label: 'AI Coach', path: '/coach' },
  ];

  const isActivePath = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,0.92)_0%,rgba(8,10,18,0.82)_100%)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-white/30 bg-[linear-gradient(135deg,#fff7fb_0%,#ffe4f1_45%,#d9d0ff_100%)] text-base font-bold text-[#151628] shadow-[0_12px_28px_rgba(255,181,211,0.22)]">
              F
            </div>
            <h1 className="bg-[linear-gradient(90deg,#ffffff_0%,#dff8ee_35%,#ffe4f1_100%)] bg-clip-text text-xl font-bold text-transparent">FitNova</h1>
          </button>

          <nav className="hidden items-center gap-3 md:flex">
            {isAuthPending ? (
              <div className="h-10 w-48 animate-pulse rounded-xl border border-[#2e303a] bg-[#11131d]" />
            ) : isAuthenticated ? (
              <>
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                      isActivePath(item.path)
                        ? 'border border-white/20 bg-[linear-gradient(135deg,#fff5fb_0%,#ffe2ef_40%,#d4c9ff_100%)] text-[#151628] shadow-[0_12px_28px_rgba(255,181,211,0.22)]'
                        : 'text-[#F7F7F7] hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(28,32,56,0.92)_0%,rgba(20,24,42,0.92)_100%)] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="ml-3 flex items-center gap-3 border-l border-white/10 pl-3">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 rounded-[1rem] px-2 py-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(24,28,49,0.94)_0%,rgba(17,20,35,0.94)_100%)]"
                  >
                    {user?.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt={user.profile.fullName || 'Profile'}
                        className="h-10 w-10 rounded-full border border-white/15 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d223c_0%,#181b30_100%)] text-sm font-semibold text-[#F7F7F7]">
                        {getInitials(user?.profile?.fullName, user?.email)}
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-gray-300">{user?.profile?.fullName || user?.email}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8f97ab]">
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
            className="text-[#F7F7F7] hover:text-white md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen ? (
          <div className="space-y-3 border-t border-[#2e303a] py-4 md:hidden">
            {isAuthPending ? (
              <div className="h-24 animate-pulse rounded-xl border border-[#2e303a] bg-[#11131d]" />
            ) : isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#2e303a] bg-[#11131d] p-3 text-left"
                >
                  {user?.profile?.avatarUrl ? (
                    <img
                      src={user.profile.avatarUrl}
                      alt={user.profile.fullName || 'Profile'}
                      className="h-12 w-12 rounded-full border border-[#2e303a] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0B0B] text-sm font-semibold text-[#F7F7F7]">
                      {getInitials(user?.profile?.fullName, user?.email)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#F7F7F7]">{user?.profile?.fullName || user?.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8f97ab]">
                      {user?.profile?.goal || 'Member'}
                    </p>
                  </div>
                </button>
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left transition-all duration-300 ${
                      isActivePath(item.path)
                        ? 'border border-white/20 bg-[linear-gradient(135deg,#fff5fb_0%,#ffe2ef_40%,#d4c9ff_100%)] text-[#151628]'
                        : 'text-[#F7F7F7] hover:bg-[linear-gradient(135deg,rgba(28,32,56,0.92)_0%,rgba(20,24,42,0.92)_100%)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <Button fullWidth variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
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
