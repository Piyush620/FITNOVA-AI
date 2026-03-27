import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Button, Input, Card } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';
import heroImage from '../assets/hero.png';

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
            <div className="relative aspect-[16/10]">
              <img src={heroImage} alt="Training visual" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.88)_0%,rgba(8,8,8,0.28)_100%)]" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="max-w-md space-y-3">
                  <div className="inline-flex rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88] backdrop-blur">
                    Locked in
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Your next session is one login away.</h2>
                  <p className="text-sm leading-7 text-[#d5d9e3]">
                    Jump back into plans, streaks, coach support, and the weekly system you already started building.
                  </p>
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
