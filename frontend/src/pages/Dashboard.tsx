import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Button, Card } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage, usersAPI } from '../services/api';
import type { DashboardSummary } from '../types';
import heroImage from '../assets/hero.png';

type ApiErrorResponse = {
  message?: string | string[];
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await usersAPI.getDashboard();
        setDashboard(response.data);
      } catch (error) {
        const message = axios.isAxiosError<ApiErrorResponse>(error)
          ? getApiErrorMessage(error.response?.data?.message)
          : undefined;
        setError(message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboard();
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="w-full space-y-6">
          <Card variant="gradient" className="overflow-hidden p-8">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="h-4 w-32 animate-pulse rounded-full bg-[#1f2536]" />
                <div className="h-14 w-full max-w-xl animate-pulse rounded-3xl bg-[#1a2030]" />
                <div className="h-6 w-full max-w-2xl animate-pulse rounded-xl bg-[#171c2a]" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-36 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
                  ))}
                </div>
              </div>
              <div className="h-[420px] animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
            </div>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
            <div className="h-72 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const completedMeals = dashboard?.completedMeals ?? 0;
  const totalMeals = dashboard?.totalMeals ?? 0;
  const mealCompletionRate = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;
  const weightChange = dashboard?.progressSummary.weightChangeKg ?? null;
  const firstName = user?.profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete';

  return (
    <MainLayout>
      <div className="space-y-8">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div className="space-y-3">
                <Breadcrumbs
                  items={[
                    { label: 'Home', onClick: () => navigate('/') },
                    { label: 'Dashboard', isCurrent: true },
                  ]}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Performance Hub</p>
                <h1 className="text-3xl font-black leading-[1] text-[#F7F7F7] sm:text-4xl lg:text-5xl">
                  {dashboard?.greeting || `Welcome back, ${user?.profile?.fullName || user?.email}!`}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                  Keep your training, nutrition, and recovery aligned from one place. This dashboard tracks the signals that matter most week to week.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Weekly consistency</p>
                  <p className="text-3xl font-bold text-[#00FF88]">{dashboard?.weeklyConsistency ?? 0}%</p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Meal completion</p>
                  <p className="text-3xl font-bold text-[#F7F7F7]">{mealCompletionRate}%</p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Current weight</p>
                  <p className="text-3xl font-bold text-[#F7F7F7]">
                    {dashboard?.currentWeight != null ? `${dashboard.currentWeight.toFixed(1)} kg` : 'N/A'}
                  </p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Weight change</p>
                  <p
                    className={`text-3xl font-bold ${
                      weightChange !== null && weightChange < 0 ? 'text-[#00FF88]' : 'text-[#FF6B00]'
                    }`}
                  >
                    {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'N/A'}
                  </p>
                </Card>
              </div>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="relative min-h-full">
                <img
                  src={user?.profile?.avatarUrl || heroImage}
                  alt="Dashboard energy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.18)_0%,rgba(6,6,6,0.52)_44%,rgba(6,6,6,0.94)_100%)]" />
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <div>
                    <div className="inline-flex rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FF88] backdrop-blur">
                      This week
                    </div>
                    <h2 className="mt-4 text-2xl font-bold leading-tight text-[#F7F7F7]">{firstName}&apos;s momentum snapshot</h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#d8dce6]">
                      Stay locked into the signals that matter: completed work, calorie adherence, and recovery rhythm.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <p className="text-sm text-[#cbd1de]">Workouts completed</p>
                        <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{dashboard?.completedWorkoutsThisWeek ?? 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <p className="text-sm text-[#cbd1de]">Meals checked off</p>
                        <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{completedMeals}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <p className="text-sm text-[#cbd1de]">Goal</p>
                        <p className="mt-2 text-lg font-semibold capitalize text-[#F7F7F7]">{dashboard?.goal ?? 'General fitness'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <p className="text-sm text-[#cbd1de]">Next check-in</p>
                        <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                          {dashboard?.nextCheckIn ? new Date(dashboard.nextCheckIn).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button fullWidth variant="secondary" onClick={() => navigate('/workouts')}>
                        View Workouts
                      </Button>
                      <Button fullWidth variant="secondary" onClick={() => navigate('/diet')}>
                        View Diet Plans
                      </Button>
                      <Button fullWidth variant="secondary" onClick={() => navigate('/profile')}>
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {error ? (
          <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
            {error}
          </div>
        ) : null}

        {dashboard ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card variant="gradient">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F7F7F7]">Active Workout</h2>
                  <span className="rounded-full border border-[#2e303a] px-3 py-1 text-xs uppercase tracking-[0.16em] text-gray-300">
                    Training
                  </span>
                </div>
                {dashboard.activeWorkoutPlan ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-sm text-gray-400">Title</p>
                      <p className="mt-1 font-semibold text-[#F7F7F7]">{dashboard.activeWorkoutPlan.title}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                        <p className="text-sm text-gray-400">Status</p>
                        <p className="mt-1 font-semibold capitalize text-[#F7F7F7]">{dashboard.activeWorkoutPlan.status}</p>
                      </div>
                      <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                        <p className="text-sm text-gray-400">Completed This Week</p>
                        <p className="mt-1 font-semibold text-[#F7F7F7]">{dashboard.completedWorkoutsThisWeek}</p>
                      </div>
                    </div>
                    <Button fullWidth variant="primary" onClick={() => navigate(`/workouts/${dashboard.activeWorkoutPlan!.id}`)}>
                      View Details
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-dashed border-[#2e303a] bg-[#0F1320] p-5">
                    <p className="text-lg font-semibold text-[#F7F7F7]">No active workout plan yet</p>
                    <p className="text-sm leading-6 text-gray-400">
                      Start with an AI plan based on your goal, training days, and equipment so the dashboard can begin tracking real momentum.
                    </p>
                    <Button fullWidth onClick={() => navigate('/workouts')}>
                      Create Workout Plan
                    </Button>
                  </div>
                )}
              </Card>

              <Card variant="gradient">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#F7F7F7]">Active Diet</h2>
                  <span className="rounded-full border border-[#2e303a] px-3 py-1 text-xs uppercase tracking-[0.16em] text-gray-300">
                    Nutrition
                  </span>
                </div>
                {dashboard.activeDietPlan ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-sm text-gray-400">Title</p>
                      <p className="mt-1 font-semibold text-[#F7F7F7]">{dashboard.activeDietPlan.title}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                        <p className="text-sm text-gray-400">Status</p>
                        <p className="mt-1 font-semibold capitalize text-[#F7F7F7]">{dashboard.activeDietPlan.status}</p>
                      </div>
                      <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                        <p className="text-sm text-gray-400">Target Calories</p>
                        <p className="mt-1 font-semibold text-[#F7F7F7]">{dashboard.caloriesTarget} kcal</p>
                      </div>
                    </div>
                    <Button fullWidth variant="primary" onClick={() => navigate(`/diet/${dashboard.activeDietPlan!.id}`)}>
                      View Details
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-dashed border-[#2e303a] bg-[#0F1320] p-5">
                    <p className="text-lg font-semibold text-[#F7F7F7]">No active diet plan yet</p>
                    <p className="text-sm leading-6 text-gray-400">
                      Build a guided meal week with your cuisine style, food preference, and target timeline so your nutrition progress becomes visible here.
                    </p>
                    <Button fullWidth onClick={() => navigate('/diet')}>
                      Create Diet Plan
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="space-y-2">
                <p className="text-sm text-gray-400">Goal</p>
                <p className="text-xl font-semibold capitalize text-[#F7F7F7]">{dashboard.goal}</p>
              </Card>
              <Card className="space-y-2">
                <p className="text-sm text-gray-400">Activity Level</p>
                <p className="text-xl font-semibold capitalize text-[#F7F7F7]">{dashboard.activityLevel}</p>
              </Card>
              <Card className="space-y-2">
                <p className="text-sm text-gray-400">Next Check-in</p>
                <p className="text-xl font-semibold text-[#F7F7F7]">
                  {new Date(dashboard.nextCheckIn).toLocaleDateString()}
                </p>
              </Card>
            </div>
          </>
        ) : null}

        <div>
          <h2 className="mb-4 text-2xl font-bold text-[#F7F7F7]">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button fullWidth variant="secondary" onClick={() => navigate('/workouts')}>
              View Workouts
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate('/diet')}>
              View Diet Plans
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate('/coach')}>
              AI Coach Chat
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
