import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Button, Input, Card } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';

type ApiErrorResponse = {
  message?: string | string[];
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated, hasHydrated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      setLocalError(message || 'Login failed. Please try again.');
    }
  };

  return (
    <MainLayout>
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-6 py-6 lg:py-0">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">
              Welcome Back
            </p>
            <h1 className="text-4xl font-black leading-[0.95] text-[#F7F7F7] sm:text-6xl">
              Re-enter your
              <span className="block bg-[linear-gradient(90deg,#00FF88_0%,#F4FFF9_55%,#FF6B00_100%)] bg-clip-text text-transparent">
                performance zone.
              </span>
            </h1>
            <p className="max-w-xl text-base text-gray-400 sm:text-lg">
              Review your plans, track completed sessions, and keep the momentum sharp with a cleaner, more intense command-center feel.
            </p>
          </div>

          <Card variant="glass" className="overflow-hidden border-white/10 p-0">
            <div className="relative min-h-[420px] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.22),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(202,184,255,0.22),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.2),transparent_26%),linear-gradient(180deg,rgba(14,16,28,0.98)_0%,rgba(10,12,20,0.98)_100%)]" />
              <div className="noise-overlay absolute inset-0" />
              <div className="pointer-events-none absolute left-6 top-6 h-28 w-28 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute right-10 top-14 h-40 w-40 rounded-full border border-[#00FF88]/20 blur-[1px]" />
              <div className="pointer-events-none absolute bottom-[-3rem] left-[16%] h-36 w-36 rounded-full bg-[#00FF88]/10 blur-3xl" />
              <div className="pointer-events-none absolute right-[12%] top-[24%] h-44 w-44 rounded-full bg-[#cab8ff]/10 blur-3xl" />

              <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="theme-media-chip inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                    Locked in
                  </div>
                  <div className="rounded-full border border-[#00FF88]/25 bg-[#00FF88]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FF88]">
                    Session ready
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="theme-media-panel rounded-[1.6rem] border p-5 backdrop-blur-xl">
                    <p className="theme-media-copy text-xs font-semibold uppercase tracking-[0.2em]">Your next session</p>
                    <h2 className="theme-media-heading mt-3 max-w-sm text-2xl font-semibold leading-tight">
                      Your next session is one login away.
                    </h2>
                    <p className="theme-media-copy mt-3 max-w-md text-sm leading-7">
                      Jump back into plans, streaks, coach support, and the weekly system you already started building.
                    </p>
                  </div>

                  <div className="theme-media-panel theme-media-panel-accent rounded-[1.6rem] border p-5 backdrop-blur-xl">
                    <p className="theme-media-copy text-xs font-semibold uppercase tracking-[0.2em]">Focus cue</p>
                    <p className="theme-media-heading mt-3 text-3xl font-black">78%</p>
                    <p className="mt-2 text-sm leading-6 text-[#d9fce9]">
                      Weekly consistency stays strongest when today&apos;s plan starts on time.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                    <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Workouts</p>
                    <p className="theme-media-heading mt-2 text-xl font-semibold">Plan queue</p>
                    <p className="theme-media-copy mt-1 text-sm">Open your split and pick up where you left off.</p>
                  </div>
                  <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                    <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Nutrition</p>
                    <p className="theme-media-heading mt-2 text-xl font-semibold">Calorie log</p>
                    <p className="theme-media-copy mt-1 text-sm">Review targets, meals, and adherence without friction.</p>
                  </div>
                  <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                    <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Coach</p>
                    <p className="theme-media-heading mt-2 text-xl font-semibold">Support thread</p>
                    <p className="theme-media-copy mt-1 text-sm">Continue prompts, adjustments, and recovery notes.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="flex justify-center lg:justify-end">
          <Card variant="gradient" className="w-full max-w-md space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-[#F7F7F7]">Sign In</h2>
              <p className="text-gray-400">Enter your account details to continue.</p>
            </div>

            {(error || localError) ? (
              <div className="rounded-xl border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-sm text-[#FF6B00]">
                {error || localError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
                Sign In
              </Button>
            </form>

            <div className="border-t border-[#2e303a] pt-4 text-center">
              <p className="text-sm text-gray-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="font-semibold text-white transition-colors hover:text-[#00FF88]"
                >
                  Sign up
                </button>
              </p>
            </div>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
};
