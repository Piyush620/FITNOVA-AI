import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Button, Card, Input, Select, Textarea } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage, usersAPI } from '../services/api';
import { formatAbsoluteDateLabel } from '../utils/calendar';
import { toastError, toastSuccess } from '../utils/toast';
import type { DashboardSummary } from '../types';

type ApiErrorResponse = {
  message?: string | string[];
};

type ProfileFormState = {
  fullName: string;
  avatarUrl: string;
  age: string;
  gender: string;
  heightCm: string;
  weightKg: string;
  goal: string;
  activityLevel: string;
};

const createFormState = (user: ReturnType<typeof useAuth>['user']): ProfileFormState => ({
  fullName: user?.profile?.fullName ?? '',
  avatarUrl: user?.profile?.avatarUrl ?? '',
  age: user?.profile?.age?.toString() ?? '',
  gender: user?.profile?.gender ?? 'other',
  heightCm: user?.profile?.heightCm?.toString() ?? '',
  weightKg: user?.profile?.weightKg?.toString() ?? user?.profile?.weight?.toString() ?? '',
  goal: user?.profile?.goal ?? '',
  activityLevel: user?.profile?.activityLevel ?? 'moderate',
});

const formatMetric = (value: number | null | undefined, suffix = '') => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return `${value}${suffix}`;
};

const getInitials = (name?: string, email?: string) => {
  const source = name?.trim() || email || 'F';
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'F';
};

const formatPlanStatus = (status?: string) => {
  if (!status) return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatSubscriptionPlan = (plan?: string | null) => {
  switch (plan) {
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return 'Free';
  }
};

const formatSubscriptionTier = (hasPremiumAccess?: boolean) =>
  hasPremiumAccess ? 'Premium' : 'Free';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isAuthenticated, user, getCurrentUser } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [formData, setFormData] = useState<ProfileFormState>(() => createFormState(user));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(createFormState(user));
  }, [user]);

  useEffect(() => {
    const loadProfilePage = async () => {
      setIsLoading(true);
      setError('');

      try {
        const dashboardResponse = await usersAPI.getDashboard();
        setDashboard(dashboardResponse.data);
      } catch (loadError) {
        const message = axios.isAxiosError<ApiErrorResponse>(loadError)
          ? getApiErrorMessage(loadError.response?.data?.message)
          : undefined;
        setError(message || 'Failed to load your profile page.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      void loadProfilePage();
    }

    let refreshTimeout: number | null = null;
    const scheduleProfileRefresh = () => {
      if (!isAuthenticated) {
        return;
      }

      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      refreshTimeout = window.setTimeout(() => {
        refreshTimeout = null;
        void loadProfilePage();
      }, 80);
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === 'fitnova-calories-sync' ||
        event.key === 'fitnova-diet-sync' ||
        event.key === 'fitnova-workout-sync'
      ) {
        scheduleProfileRefresh();
      }
    };

    const handleCaloriesSync = () => {
      scheduleProfileRefresh();
    };
    const handleDietSync = () => {
      scheduleProfileRefresh();
    };
    const handleWorkoutSync = () => {
      scheduleProfileRefresh();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fitnova:calories-sync', handleCaloriesSync);
    window.addEventListener('fitnova:diet-sync', handleDietSync);
    window.addEventListener('fitnova:workout-sync', handleWorkoutSync);

    return () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fitnova:calories-sync', handleCaloriesSync);
      window.removeEventListener('fitnova:diet-sync', handleDietSync);
      window.removeEventListener('fitnova:workout-sync', handleWorkoutSync);
    };
  }, [isAuthenticated]);

  const avatarPreview = formData.avatarUrl || '';
  const completionRate = useMemo(() => {
    if (!dashboard) {
      return 0;
    }

    return Math.round(
      ((dashboard.completedWorkoutsThisWeek + dashboard.completedMeals) /
        Math.max(dashboard.completedWorkoutsThisWeek + dashboard.totalMeals, 1)) *
        100,
    );
  }, [dashboard]);

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toastError('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData((current) => ({ ...current, avatarUrl: result }));
      toastSuccess('Profile photo ready to save.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((current) => ({ ...current, avatarUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toastSuccess('Profile photo removed. Save profile to apply the change.');
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const age = Number(formData.age);
    const heightCm = Number(formData.heightCm);
    const weightKg = Number(formData.weightKg);

    if (!formData.fullName.trim() || !formData.goal.trim()) {
      setError('Full name and primary goal are required.');
      return;
    }

    if (Number.isNaN(age) || age < 13 || age > 100) {
      setError('Age must be between 13 and 100.');
      return;
    }

    if (Number.isNaN(heightCm) || heightCm < 100 || heightCm > 250) {
      setError('Height must be between 100 cm and 250 cm.');
      return;
    }

    if (Number.isNaN(weightKg) || weightKg < 30 || weightKg > 300) {
      setError('Weight must be between 30 kg and 300 kg.');
      return;
    }

    setIsSaving(true);

    try {
      await usersAPI.updateProfile({
        fullName: formData.fullName.trim(),
        avatarUrl: formData.avatarUrl.trim() ? formData.avatarUrl.trim() : null,
        age,
        gender: formData.gender,
        heightCm,
        weightKg,
        goal: formData.goal.trim(),
        activityLevel: formData.activityLevel,
      });
      await getCurrentUser();
      const dashboardResponse = await usersAPI.getDashboard();
      setDashboard(dashboardResponse.data);
      toastSuccess('Profile updated successfully.');
    } catch (saveError) {
      const message = axios.isAxiosError<ApiErrorResponse>(saveError)
        ? getApiErrorMessage(saveError.response?.data?.message)
        : undefined;
      const nextError = message || 'Failed to save your profile.';
      setError(nextError);
      toastError(nextError);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="w-full space-y-6">
          <Card variant="gradient" className="overflow-hidden p-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="h-24 w-24 animate-pulse rounded-3xl bg-[#11131d]" />
                  <div className="space-y-3">
                    <div className="h-4 w-32 animate-pulse rounded-full bg-[#1f2536]" />
                    <div className="h-12 w-80 animate-pulse rounded-2xl bg-[#1a2030]" />
                    <div className="h-5 w-96 animate-pulse rounded-xl bg-[#171c2a]" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-36 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
                  ))}
                </div>
              </div>
              <div className="h-[420px] animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
            </div>
          </Card>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[620px] animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
            <div className="space-y-6">
              <div className="h-64 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
              <div className="h-40 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full space-y-8">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={formData.fullName || 'Profile'}
                    className="h-24 w-24 rounded-3xl border border-[#2e303a] object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#11131d] text-2xl font-bold text-[#F7F7F7]">
                    {getInitials(formData.fullName, user?.email)}
                  </div>
                )}
                <div className="space-y-2">
                  <Breadcrumbs
                    items={[
                      { label: 'Dashboard', onClick: () => navigate('/dashboard') },
                      { label: 'Profile', isCurrent: true },
                    ]}
                    className="mb-1"
                  />
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">
                    Profile & Progress
                  </p>
                  <h1 className="text-3xl font-black leading-[1] text-[#F7F7F7] sm:text-4xl lg:text-[2.75rem]">{formData.fullName || user?.email}</h1>
                  <p className="max-w-2xl text-sm leading-7 text-gray-400">
                    Track your body stats, edit your details, and keep your AI plans aligned with your profile.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Weekly consistency</p>
                  <p className="text-3xl font-bold text-[#00FF88]">{dashboard?.weeklyConsistency ?? 0}%</p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Current weight</p>
                  <p className="text-3xl font-bold text-[#F7F7F7]">
                    {formatMetric(dashboard?.currentWeight, ' kg')}
                  </p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Meal target</p>
                  <p className="text-3xl font-bold text-[#F7F7F7]">{dashboard?.caloriesTarget ?? 0}</p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Adherence blend</p>
                  <p className="text-3xl font-bold text-[#F7F7F7]">{completionRate}%</p>
                </Card>
              </div>
            </div>

            <Card className="space-y-5 p-6">
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={formData.fullName || 'Profile'}
                    className="h-16 w-16 rounded-2xl border border-[#2e303a] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#11131d] text-xl font-bold text-[#F7F7F7]">
                    {getInitials(formData.fullName, user?.email)}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Identity Panel</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#F7F7F7]">{formData.fullName || user?.email}</h2>
                  <p className="mt-1 text-sm text-[#98a3b8]">{user?.email}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Goal</p>
                  <p className="mt-2 text-lg font-semibold capitalize text-[#F7F7F7]">
                    {dashboard?.goal || formData.goal || 'Not set'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Activity level</p>
                  <p className="mt-2 text-lg font-semibold capitalize text-[#F7F7F7]">
                    {dashboard?.activityLevel || formData.activityLevel}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Active workout</p>
                  <p className="mt-2 text-base font-semibold leading-7 text-[#F7F7F7]">
                    {dashboard?.activeWorkoutPlan?.title || 'No active workout'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Active diet</p>
                  <p className="mt-2 text-base font-semibold leading-7 text-[#F7F7F7]">
                    {dashboard?.activeDietPlan?.title || 'No active diet'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Subscription plan</p>
                    <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                      {formatSubscriptionPlan(user?.subscription?.plan)}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#9ff9ca]">
                    {formatSubscriptionTier(user?.subscription?.hasPremiumAccess)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#98a3b8]">
                  {user?.subscription?.currentPeriodEnd
                    ? `Renews on ${formatAbsoluteDateLabel(user.subscription.currentPeriodEnd)}.`
                    : 'No active renewal date yet.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="secondary" onClick={() => navigate('/workouts')}>
                  Workouts
                </Button>
                <Button variant="secondary" onClick={() => navigate('/diet')}>
                  Diet
                </Button>
              </div>
            </Card>
          </div>
        </Card>

        {error ? (
          <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#F7F7F7]">Edit Profile</h2>
                <p className="mt-1 text-gray-400">
                  Update the details your AI uses for workouts, nutrition, and recommendations.
                </p>
              </div>
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelected}
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Upload Photo
                </Button>
                {formData.avatarUrl ? (
                  <Button
                    variant="secondary"
                    onClick={handleRemovePhoto}
                  >
                    Remove Photo
                  </Button>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleFieldChange} />
                <Input
                  label="Age"
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleFieldChange}
                />
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={handleFieldChange}
                  name="gender"
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
                  value={formData.heightCm}
                  onChange={handleFieldChange}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  name="weightKg"
                  value={formData.weightKg}
                  onChange={handleFieldChange}
                />
                <Select
                  label="Activity Level"
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleFieldChange}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'active', label: 'Active' },
                    { value: 'athlete', label: 'Athlete' },
                  ]}
                />
              </div>

              <Input label="Primary Goal" name="goal" value={formData.goal} onChange={handleFieldChange} />

              <Textarea
                label="Profile Photo URL"
                name="avatarUrl"
                rows={3}
                value={formData.avatarUrl}
                onChange={handleFieldChange}
                placeholder="Paste an image URL or upload a photo above."
                helperText="Uploaded photos are stored directly in your profile for now, so keep the image reasonably small."
              />

              <Button type="submit" isLoading={isSaving}>
                Save Profile
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card variant="gradient" className="space-y-4">
              <h2 className="text-2xl font-bold text-[#F7F7F7]">Progress Snapshot</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-sm text-gray-400">Completed workouts</p>
                  <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                    {dashboard?.completedWorkoutsThisWeek ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-sm text-gray-400">Completed meals</p>
                  <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{dashboard?.completedMeals ?? 0}</p>
                </div>
                <div className="rounded-xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-sm text-gray-400">Weight change</p>
                  <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                    {formatMetric(dashboard?.progressSummary.weightChangeKg, ' kg')}
                  </p>
                </div>
                <div className="rounded-xl border border-[#2e303a] bg-[#11131d] p-4">
                  <p className="text-sm text-gray-400">Next check-in</p>
                  <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                    {formatAbsoluteDateLabel(dashboard?.nextCheckIn)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-5">
              <h2 className="text-2xl font-bold text-[#F7F7F7]">Selected Plans</h2>
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400">Workout plan</p>
                      <p className="mt-2 text-xl font-semibold text-[#F7F7F7]">
                        {dashboard?.activeWorkoutPlan?.title || 'No active workout'}
                      </p>
                    </div>
                    {dashboard?.activeWorkoutPlan ? (
                      <span className="rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ff9ca]">
                        {formatPlanStatus(dashboard.activeWorkoutPlan.status)}
                      </span>
                    ) : null}
                  </div>
                  {dashboard?.activeWorkoutPlan ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <p className="text-sm text-[#c6cede]">Goal: <span className="text-[#F7F7F7]">{dashboard.activeWorkoutPlan.goal}</span></p>
                      <p className="text-sm text-[#c6cede]">Level: <span className="text-[#F7F7F7]">{dashboard.activeWorkoutPlan.level}</span></p>
                      <p className="text-sm text-[#c6cede]">Days: <span className="text-[#F7F7F7]">{dashboard.activeWorkoutPlan.daysCount}</span></p>
                      <p className="text-sm text-[#c6cede]">Start: <span className="text-[#F7F7F7]">{formatAbsoluteDateLabel(dashboard.activeWorkoutPlan.startDate)}</span></p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[#98a3b8]">
                      Activate a workout plan and its selected details will appear here.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400">Diet plan</p>
                      <p className="mt-2 text-xl font-semibold text-[#F7F7F7]">
                        {dashboard?.activeDietPlan?.title || 'No active diet'}
                      </p>
                    </div>
                    {dashboard?.activeDietPlan ? (
                      <span className="rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ff9ca]">
                        {formatPlanStatus(dashboard.activeDietPlan.status)}
                      </span>
                    ) : null}
                  </div>
                  {dashboard?.activeDietPlan ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <p className="text-sm text-[#c6cede]">Goal: <span className="text-[#F7F7F7]">{dashboard.activeDietPlan.goal}</span></p>
                      <p className="text-sm text-[#c6cede]">Preference: <span className="text-[#F7F7F7]">{dashboard.activeDietPlan.preference}</span></p>
                      <p className="text-sm text-[#c6cede]">Days: <span className="text-[#F7F7F7]">{dashboard.activeDietPlan.daysCount}</span></p>
                      <p className="text-sm text-[#c6cede]">Target: <span className="text-[#F7F7F7]">{dashboard.activeDietPlan.targetCalories ?? 'N/A'} kcal</span></p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[#98a3b8]">
                      Activate a diet plan and its selected details will appear here.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <h2 className="text-2xl font-bold text-[#F7F7F7]">AI Personalization Inputs</h2>
              <div className="space-y-3 text-sm text-gray-300">
                <p>Age, gender, activity level, weight, and goal from this page are used to shape your AI plans.</p>
                <p>Update them here whenever your body stats or goal changes so new workout and diet plans stay relevant.</p>
                <p>
                  Current billing plan: <span className="font-semibold text-[#F7F7F7]">{formatSubscriptionPlan(user?.subscription?.plan)}</span>
                  {' '}({formatSubscriptionTier(user?.subscription?.hasPremiumAccess)}).
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
