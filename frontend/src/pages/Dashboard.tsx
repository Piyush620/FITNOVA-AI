import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Button, Card } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage, usersAPI } from '../services/api';
import { estimateGoalCalories } from '../utils/calorieTarget';
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
  const [heroImageSrc, setHeroImageSrc] = useState(heroImage);

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

  useEffect(() => {
    const avatarUrl = user?.profile?.avatarUrl?.trim();
    setHeroImageSrc(avatarUrl ? avatarUrl : heroImage);
  }, [user?.profile?.avatarUrl]);

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
  const effectiveCalorieTarget =
    dashboard?.caloriesTarget && dashboard.caloriesTarget > 0
      ? dashboard.caloriesTarget
      : estimateGoalCalories(user?.profile);
  const remainingCalories = dashboard ? effectiveCalorieTarget - dashboard.todaysCalories : 0;

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

            <Card className="overflow-hidden border-white/10 p-0 lg:min-h-[620px] lg:self-start">
              <div className="relative min-h-[520px] lg:min-h-[620px]">
                <img
                  src={heroImageSrc}
                  alt="Dashboard energy"
                  className="h-full w-full object-cover"
                  onError={() => setHeroImageSrc(heroImage)}
                />
                <div className="theme-media-overlay absolute inset-0" />
                <div className="absolute inset-0 flex flex-col gap-5 p-6">
                  <div>
                    <div className="theme-media-chip inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                      This week
                    </div>
                    <h2 className="theme-media-heading mt-4 text-2xl font-bold leading-tight">{firstName}&apos;s momentum snapshot</h2>
                    <p className="theme-media-copy mt-2 max-w-sm text-sm leading-6">
                      Stay locked into the signals that matter: completed work, calorie adherence, and recovery rhythm.
                    </p>
                  </div>

                  <div className="mt-auto space-y-4 pt-2">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                        <p className="theme-media-copy text-sm">Workouts completed</p>
                        <p className="theme-media-heading mt-2 text-2xl font-bold">{dashboard?.completedWorkoutsThisWeek ?? 0}</p>
                      </div>
                      <div className="theme-media-panel theme-media-panel-accent rounded-2xl border p-4 backdrop-blur">
                        <p className="theme-media-copy text-sm">Today&apos;s calories</p>
                        <p className="theme-media-heading mt-2 text-2xl font-bold">{dashboard?.todaysCalories ?? 0}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#00FF88]">
                          Target {effectiveCalorieTarget} kcal
                        </p>
                      </div>
                      <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                        <p className="theme-media-copy text-sm">Goal</p>
                        <p className="theme-media-heading mt-2 text-lg font-semibold capitalize">{dashboard?.goal ?? 'General fitness'}</p>
                      </div>
                      <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                        <p className="theme-media-copy text-sm">Calories left</p>
                        <p className={`mt-2 text-lg font-semibold ${remainingCalories >= 0 ? 'text-[#00FF88]' : 'text-[#FF6B00]'}`}>
                          {dashboard ? `${remainingCalories}` : 'N/A'}
                        </p>
                        <div className="theme-progress-track mt-3 h-2 overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#00FF88_0%,#c4ffd8_100%)]"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  dashboard && effectiveCalorieTarget > 0
                                    ? (dashboard.todaysCalories / effectiveCalorieTarget) * 100
                                    : 0,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button fullWidth size="sm" variant="secondary" onClick={() => navigate('/workouts')}>
                        View Workouts
                      </Button>
                      <Button fullWidth size="sm" variant="secondary" onClick={() => navigate('/diet')}>
                        View Diet Plans
                      </Button>
                      <Button fullWidth size="sm" variant="secondary" onClick={() => navigate('/calories')}>
                        Log Calories
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
                        <p className="mt-1 font-semibold text-[#F7F7F7]">{effectiveCalorieTarget} kcal</p>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
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
              <Card className="space-y-2">
                <p className="text-sm text-gray-400">Avg logged calories</p>
                <p className="text-xl font-semibold text-[#F7F7F7]">
                  {dashboard.monthlyAverageCalories} kcal
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[#8f97ab]">
                  {dashboard.monthlyLoggedDays} days tracked
                </p>
              </Card>
            </div>

            <Card variant="gradient" className="overflow-hidden p-0">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_24%)]" />
                <div className="relative flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">
                    Calorie Tracking
                  </p>
                  <h2 className="text-2xl font-bold text-[#F7F7F7]">
                    Stay on top of real intake, not just the plan.
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-[#98a3b8]">
                    You&apos;ve logged {dashboard.monthlyLoggedDays} days this month with an average of{' '}
                    {dashboard.monthlyAverageCalories} kcal on logged days. Use the tracker to tighten consistency and catch drift faster.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
                  <div className="theme-subtle-panel rounded-2xl border p-4 backdrop-blur">
                    <p className="text-sm text-gray-400">Target</p>
                    <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{effectiveCalorieTarget}</p>
                  </div>
                  <div className="theme-subtle-panel rounded-2xl border p-4 backdrop-blur">
                    <p className="text-sm text-gray-400">Today</p>
                    <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{dashboard.todaysCalories}</p>
                  </div>
                  <div className="theme-subtle-panel rounded-2xl border p-4 backdrop-blur">
                    <p className="text-sm text-gray-400">Remaining</p>
                    <p className={`mt-2 text-2xl font-bold ${remainingCalories >= 0 ? 'text-[#00FF88]' : 'text-[#FF6B00]'}`}>
                      {remainingCalories}
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-between border-t border-white/10 px-6 py-4 lg:px-7">
                <p className="text-sm text-[#9da8bf]">
                  Daily intake is now part of your core progress loop.
                </p>
                <Button variant="accent" onClick={() => navigate('/calories')}>
                  Open Calorie Tracker
                </Button>
              </div>
              </div>
            </Card>
          </>
        ) : null}

        <div>
          <h2 className="mb-4 text-2xl font-bold text-[#F7F7F7]">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Button fullWidth variant="secondary" onClick={() => navigate('/workouts')}>
              View Workouts
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate('/diet')}>
              View Diet Plans
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate('/calories')}>
              Track Calories
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
