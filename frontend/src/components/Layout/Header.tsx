import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../Common';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Workouts', path: '/workouts' },
    { label: 'Diet', path: '/diet' },
    { label: 'AI Coach', path: '/coach' },
  ];

  const isActivePath = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#2e303a] bg-[#0B0B0B]/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-bold text-black">
              F
            </div>
            <h1 className="text-xl font-bold text-[#F7F7F7]">FitNova</h1>
          </button>

          <nav className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-white text-black'
                        : 'text-[#F7F7F7] hover:bg-[#11131d] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="ml-3 flex items-center gap-3 border-l border-[#2e303a] pl-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-300">{user?.profile?.fullName || user?.email}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#8f97ab]">
                      {user?.profile?.goal || 'Member'}
                    </p>
                  </div>
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
            {isAuthenticated ? (
              <>
                <div className="rounded-xl border border-[#2e303a] bg-[#11131d] p-3">
                  <p className="text-sm font-medium text-[#F7F7F7]">{user?.profile?.fullName || user?.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8f97ab]">
                    {user?.profile?.goal || 'Member'}
                  </p>
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-white text-black'
                        : 'text-[#F7F7F7] hover:bg-[#11131d]'
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
