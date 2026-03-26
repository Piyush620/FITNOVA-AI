import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Button, Card } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage, usersAPI } from '../services/api';
import type { DashboardSummary } from '../types';

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
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin">
            <div className="h-12 w-12 rounded-full border-4 border-[#00FF88] border-t-transparent"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const completedMeals = dashboard?.completedMeals ?? 0;
  const totalMeals = dashboard?.totalMeals ?? 0;
  const mealCompletionRate = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;
  const weightChange = dashboard?.progressSummary.weightChangeKg ?? null;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-[#F7F7F7]">
            {dashboard?.greeting || `Welcome back, ${user?.profile?.fullName || user?.email}!`}
          </h1>
          <p className="text-gray-400">Here&apos;s your fitness overview.</p>
        </div>

        {error ? (
          <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
            {error}
          </div>
        ) : null}

        {dashboard ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <div className="text-center">
                  <p className="mb-2 text-sm text-gray-400">Weekly Consistency</p>
                  <p className="text-3xl font-bold text-[#00FF88]">{dashboard.weeklyConsistency}%</p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <p className="mb-2 text-sm text-gray-400">Meal Completion</p>
                  <p className="text-3xl font-bold text-[#00FF88]">{mealCompletionRate}%</p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <p className="mb-2 text-sm text-gray-400">Current Weight</p>
                  <p className="text-3xl font-bold text-[#00FF88]">
                    {dashboard.currentWeight !== null ? `${dashboard.currentWeight.toFixed(1)} kg` : 'N/A'}
                  </p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <p className="mb-2 text-sm text-gray-400">Weight Change</p>
                  <p
                    className={`text-3xl font-bold ${
                      weightChange !== null && weightChange < 0 ? 'text-[#00FF88]' : 'text-[#FF6B00]'
                    }`}
                  >
                    {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'N/A'}
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card variant="gradient">
                <h2 className="mb-4 text-2xl font-bold text-[#F7F7F7]">Active Workout</h2>
                {dashboard.activeWorkoutPlan ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Title</p>
                      <p className="font-semibold text-[#F7F7F7]">{dashboard.activeWorkoutPlan.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="font-semibold capitalize text-[#F7F7F7]">{dashboard.activeWorkoutPlan.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Completed This Week</p>
                      <p className="font-semibold text-[#F7F7F7]">{dashboard.completedWorkoutsThisWeek}</p>
                    </div>
                    <Button fullWidth variant="primary" onClick={() => navigate(`/workouts/${dashboard.activeWorkoutPlan!.id}`)}>
                      View Details
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="mb-4 text-gray-400">No active workout plan</p>
                    <Button fullWidth onClick={() => navigate('/workouts')}>
                      Create Plan
                    </Button>
                  </div>
                )}
              </Card>

              <Card variant="gradient">
                <h2 className="mb-4 text-2xl font-bold text-[#F7F7F7]">Active Diet</h2>
                {dashboard.activeDietPlan ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Title</p>
                      <p className="font-semibold text-[#F7F7F7]">{dashboard.activeDietPlan.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="font-semibold capitalize text-[#F7F7F7]">{dashboard.activeDietPlan.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Target Calories</p>
                      <p className="font-semibold text-[#F7F7F7]">{dashboard.caloriesTarget} kcal</p>
                    </div>
                    <Button fullWidth variant="primary" onClick={() => navigate(`/diet/${dashboard.activeDietPlan!.id}`)}>
                      View Details
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="mb-4 text-gray-400">No active diet plan</p>
                    <Button fullWidth onClick={() => navigate('/diet')}>
                      Create Plan
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
