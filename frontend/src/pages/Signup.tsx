import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Button, Input, Card, Select } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';

type ApiErrorResponse = {
  message?: string | string[];
};

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated, hasHydrated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'other',
    heightCm: '',
    weightKg: '',
    goal: '',
    activityLevel: 'moderate',
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.age ||
      !formData.heightCm ||
      !formData.weightKg ||
      !formData.goal
    ) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return;
    }

    const age = Number(formData.age);
    const heightCm = Number(formData.heightCm);
    const weightKg = Number(formData.weightKg);

    if (age < 13 || age > 100) {
      setLocalError('Age must be between 13 and 100');
      return;
    }

    if (heightCm < 100 || heightCm > 250) {
      setLocalError('Height must be between 100 cm and 250 cm');
      return;
    }

    if (weightKg < 30 || weightKg > 300) {
      setLocalError('Weight must be between 30 kg and 300 kg');
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.name,
        age,
        gender: formData.gender as 'male' | 'female' | 'other',
        heightCm,
        weightKg,
        goal: formData.goal,
        activityLevel: formData.activityLevel,
      });
      navigate('/dashboard');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      setLocalError(message || 'Registration failed. Please try again.');
    }
  };

  return (
    <MainLayout>
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="flex justify-center lg:justify-start">
          <Card variant="gradient" className="w-full max-w-md space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-[#F7F7F7]">Create Account</h2>
              <p className="text-gray-400">Set up your profile and start building smarter plans.</p>
            </div>

            {(error || localError) ? (
              <div className="rounded-xl border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-sm text-[#FF6B00]">
                {error || localError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Age"
                  type="number"
                  name="age"
                  placeholder="24"
                  value={formData.age}
                  onChange={handleChange}
                />
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((current) => ({ ...current, gender: e.target.value }))
                  }
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  name="heightCm"
                  placeholder="175"
                  value={formData.heightCm}
                  onChange={handleChange}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  name="weightKg"
                  placeholder="70"
                  value={formData.weightKg}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Primary Goal"
                type="text"
                name="goal"
                placeholder="Fat loss, muscle gain, maintenance..."
                value={formData.goal}
                onChange={handleChange}
              />

              <div className="w-full space-y-2">
                <label className="block text-sm font-medium text-[#F7F7F7]">Activity Level</label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={(e) =>
                    setFormData((current) => ({ ...current, activityLevel: e.target.value }))
                  }
                  className="flex h-11 w-full rounded-xl border border-[#2e303a] bg-[#11131d] px-4 py-2.5 text-[#F7F7F7] transition-colors duration-200 focus:border-[#00FF88] focus:outline-none focus:ring-2 focus:ring-[#00FF88]/20"
                >
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="athlete">Athlete</option>
                </select>
              </div>

              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                helperText="At least 8 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="********"
                value={formData.confirmPassword}
                onChange={handleChange}
              />

              <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
                Create Account
              </Button>
            </form>

            <div className="border-t border-[#2e303a] pt-4 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-white transition-colors hover:text-[#00FF88]"
                >
                  Sign in
                </button>
              </p>
            </div>
          </Card>
        </section>

        <section className="space-y-6 py-6 lg:py-0">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">
              Join FitNova
            </p>
            <h1 className="text-4xl font-bold text-[#F7F7F7] sm:text-5xl">
              Build your training system in one place.
            </h1>
            <p className="max-w-xl text-base text-gray-400 sm:text-lg">
              Create personalized workout and diet plans, track adherence, and use AI support without juggling multiple apps.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-2">
              <p className="text-sm font-semibold text-[#F7F7F7]">Personalized plans</p>
              <p className="text-sm text-gray-400">Generate plans that match your goal, body metrics, and available equipment.</p>
            </Card>
            <Card className="space-y-2">
              <p className="text-sm font-semibold text-[#F7F7F7]">Track adherence</p>
              <p className="text-sm text-gray-400">Mark sessions and meals complete and keep your dashboard up to date.</p>
            </Card>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
