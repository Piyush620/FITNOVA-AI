import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button, Card, Input } from '../components/Common';
import { MainLayout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';

type ApiErrorResponse = {
  message?: string | string[];
};

export const VerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams]);
  const { verifyEmailOtp, resendEmailOtp, isLoading, error, clearError, isAuthenticated, hasHydrated } = useAuth();
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState(email ? `We sent a 6-digit OTP to ${email}.` : '');

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email) {
      setLocalError('Missing email for verification. Please sign up again.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setLocalError('Enter the 6-digit OTP from your email.');
      return;
    }

    try {
      await verifyEmailOtp(email, otp);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      setLocalError(message || 'Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    setLocalError('');
    clearError();

    if (!email) {
      setLocalError('Missing email for verification. Please sign up again.');
      return;
    }

    try {
      const result = await resendEmailOtp(email);
      setInfoMessage(result.message);
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      setLocalError(message || 'Could not resend OTP.');
    }
  };

  return (
    <MainLayout>
      <div className="grid min-h-[calc(100vh-12rem)] place-items-center py-8">
        <Card variant="gradient" className="w-full max-w-md space-y-6 p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">Email verification</p>
            <h1 className="theme-heading text-3xl font-bold">Enter your OTP</h1>
            <p className="theme-copy-muted text-sm">
              {infoMessage || 'Enter the 6-digit verification code sent to your email to activate your account.'}
            </p>
          </div>

          {(error || localError) ? (
            <div className="rounded-xl border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-sm text-[#FF6B00]">
              {error || localError}
            </div>
          ) : null}

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              readOnly
            />
            <Input
              label="Verification code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              helperText="The code expires in a few minutes."
            />
            <Button type="submit" fullWidth isLoading={isLoading}>
              Verify account
            </Button>
          </form>

          <div className="theme-divider border-t pt-4 text-center text-sm">
            <p className="theme-copy-muted">
              Didn’t get the code?{' '}
              <button type="button" onClick={() => void handleResend()} className="theme-inline-link font-semibold">
                Resend OTP
              </button>
            </p>
            <p className="mt-3 theme-copy-muted">
              Wrong email?{' '}
              <button type="button" onClick={() => navigate('/signup')} className="theme-inline-link font-semibold">
                Go back to sign up
              </button>
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
