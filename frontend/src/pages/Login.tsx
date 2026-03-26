import React, { useState } from 'react';
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
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

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
            <h1 className="text-4xl font-bold text-[#F7F7F7] sm:text-5xl">
              Get back into your training flow.
            </h1>
            <p className="max-w-xl text-base text-gray-400 sm:text-lg">
              Review your plans, track completed sessions, and keep the momentum going with AI coaching that stays close to your goals.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-2">
              <p className="text-sm font-semibold text-[#F7F7F7]">Workout consistency</p>
              <p className="text-sm text-gray-400">Pick up right where you left off and mark progress in real time.</p>
            </Card>
            <Card className="space-y-2">
              <p className="text-sm font-semibold text-[#F7F7F7]">Coach guidance</p>
              <p className="text-sm text-gray-400">Use the AI coach for quick adjustments, motivation, and recovery help.</p>
            </Card>
          </div>
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
