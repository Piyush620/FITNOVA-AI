import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Card, Button, FormattedAiText, LiveCalendar, Pagination, PremiumFeatureGate } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { useSharedCalendar } from '../hooks/useSharedCalendar';
import { aiAPI, getApiErrorMessage, workoutsAPI } from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';
import type { GenerateWorkoutPlanPayload, WorkoutDay, WorkoutPlan } from '../types';
import { notifyWorkoutChanged } from '../utils/appSync';
import { formatDateLabel } from '../utils/calendar';
import { resolvePlanDayByDate } from '../utils/planSchedule';

type ApiErrorResponse = {
  message?: string | string[];
};

const formatDate = (value?: string) => {
  if (!value) return 'Not scheduled';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getCompletionLabel = (plan: WorkoutPlan) => {
  const completedDays = plan.progress?.completedDays ?? plan.days.filter((day) => !!day.completedAt).length;
  const totalDays = plan.progress?.totalDays ?? plan.days.length;

  return `${completedDays}/${totalDays} days completed`;
};

const getStatusClasses = (status: WorkoutPlan['status']) => {
  switch (status) {
    case 'active':
      return 'bg-[#00FF88] text-black';
    case 'completed':
      return 'bg-[#1f3a2c] text-[#7fffc1]';
    case 'archived':
      return 'bg-[#2d2f3a] text-[#c3c7d1]';
    default:
      return 'bg-[#3a2d1f] text-[#ffd19a]';
  }
};

const getWorkoutDurationSummary = (plan: WorkoutPlan) => {
  const durations = plan.days.map((day) => day.durationMinutes).filter((value): value is number => typeof value === 'number');
  if (durations.length === 0) {
    return 'Flexible';
  }

  return `${Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)} min avg`;
};

const toIsoDate = (value?: string | Date | null) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
};

const isCompletedOnDate = (completedAt: string | Date | undefined, selectedDate: string) =>
  toIsoDate(completedAt) === selectedDate;

const defaultGeneratorState: GenerateWorkoutPlanPayload = {
  weight: '',
  goal: '',
  experience: '',
  trainingDaysPerWeek: 4,
  equipment: '',
};

const WorkoutGeneratorPanel = lazy(() =>
  import('./sections/WorkoutGeneratorPanel').then((module) => ({ default: module.WorkoutGeneratorPanel })),
);

const GeneratorPanelFallback = () => (
  <Card variant="gradient">
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-2xl bg-[#1a2030]" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-11 w-44 animate-pulse rounded-xl bg-[#11131d]" />
        <div className="h-11 w-32 animate-pulse rounded-xl bg-[#11131d]" />
      </div>
    </div>
  </Card>
);

export const WorkoutsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorState, setGeneratorState] = useState<GenerateWorkoutPlanPayload>(defaultGeneratorState);
  const [generatorError, setGeneratorError] = useState('');
  const [actionState, setActionState] = useState<
    { type: 'activate' | 'complete' | 'generate' | 'restart' | 'delete'; key: string } | null
  >(null);
  const [error, setError] = useState('');
  const { selectedDate, selectedMonth, setSelectedDate, setSelectedMonth, goToToday } = useSharedCalendar();

  useEffect(() => {
    setGeneratorState({
      weight: user?.profile?.weightKg?.toString() ?? user?.profile?.weight?.toString() ?? '',
      goal: user?.profile?.goal ?? '',
      experience: user?.profile?.activityLevel ?? user?.profile?.level ?? '',
      trainingDaysPerWeek: 4,
      equipment: '',
    });
  }, [user]);

  const loadPlans = useCallback(async (showInitialLoader = false, requestedPage = page) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    if (showInitialLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError('');

    try {
      const plansResponse = await workoutsAPI.listPlans(requestedPage, 6);
      const nextPlans = plansResponse.data.items;
      const derivedActivePlan = nextPlans.find((plan) => plan.status === 'active') ?? null;
      const routePlan = id ? nextPlans.find((plan) => plan.id === id) : null;

      if (plansResponse.status === 200) {
        setPlans(nextPlans);
        setPage(plansResponse.data.pagination.page);
        setTotalPages(plansResponse.data.pagination.totalPages ?? 1);
        setActivePlan(derivedActivePlan);
        setSelectedPlanId(id ?? routePlan?.id ?? derivedActivePlan?.id ?? nextPlans[0]?.id ?? null);
      }
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      setError(message || 'Failed to load workout plans.');
      setPlans([]);
      setActivePlan(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, isAuthenticated, page]);

  useEffect(() => {
    void loadPlans(true);
  }, [loadPlans]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let refreshTimeout: number | null = null;
    const refresh = () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      refreshTimeout = window.setTimeout(() => {
        refreshTimeout = null;
        void loadPlans(false, 1);
      }, 80);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'fitnova-calories-sync' || event.key === 'fitnova-workout-sync') {
        refresh();
      }
    };

    window.addEventListener('fitnova:calories-sync', refresh);
    window.addEventListener('fitnova:workout-sync', refresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
      window.removeEventListener('fitnova:calories-sync', refresh);
      window.removeEventListener('fitnova:workout-sync', refresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAuthenticated, loadPlans]);

  useEffect(() => {
    if (id) {
      setSelectedPlanId(id);
    }
  }, [id]);

  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) ??
    activePlan ??
    plans[0] ??
    null;
  const selectedDay = useMemo(
    () => resolvePlanDayByDate(selectedPlan, selectedDate),
    [selectedDate, selectedPlan],
  );
  const selectedPlanCompletedDays =
    selectedPlan?.progress?.completedDays ??
    selectedPlan?.days.filter((day) => !!day.completedAt).length ??
    0;
  const selectedPlanTotalDays =
    selectedPlan?.progress?.totalDays ??
    selectedPlan?.days.length ??
    0;
  const selectedPlanCompletionRate =
    selectedPlanTotalDays > 0 ? Math.round((selectedPlanCompletedDays / selectedPlanTotalDays) * 100) : 0;

  const handleActivatePlan = async (plan: WorkoutPlan) => {
    setActionState({ type: 'activate', key: plan.id });
    setError('');

    try {
      const hasProgress = (plan.progress?.completedDays ?? plan.days.filter((day) => !!day.completedAt).length) > 0;
      const response = hasProgress ? await workoutsAPI.restartPlan(plan.id) : await workoutsAPI.activatePlan(plan.id);
      const nextActivePlan = response.data;
      setActivePlan(nextActivePlan);
      setSelectedPlanId(nextActivePlan.id);
      notifyWorkoutChanged();
      navigate(`/workouts/${nextActivePlan.id}`);
      await loadPlans();
      toastSuccess(hasProgress ? 'Workout plan restored fresh.' : 'Workout plan activated!');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to activate workout plan.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleCompleteDay = async (planId: string, dayNumber: number) => {
    setActionState({ type: 'complete', key: `${planId}:${dayNumber}` });
    setError('');

    try {
      const response = await workoutsAPI.completeSession(planId, dayNumber, selectedDate);
      const updatedPlan = response.data;

      setPlans((current) =>
        current.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
      );
      setSelectedPlanId(updatedPlan.id);
      notifyWorkoutChanged();
      navigate(`/workouts/${updatedPlan.id}`);
      if (activePlan?.id === updatedPlan.id || updatedPlan.status === 'active' || updatedPlan.status === 'completed') {
        setActivePlan(updatedPlan.status === 'archived' ? null : updatedPlan);
      }
      await loadPlans();
      toastSuccess('Workout completed! Great job!');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to mark workout day as complete.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleRestartPlan = async (planId: string) => {
    setActionState({ type: 'restart', key: planId });
    setError('');

    try {
      const response = await workoutsAPI.restartPlan(planId);
      const restartedPlan = response.data;
      setActivePlan(restartedPlan);
      setSelectedPlanId(restartedPlan.id);
      notifyWorkoutChanged();
      navigate(`/workouts/${restartedPlan.id}`);
      await loadPlans(false, 1);
      toastSuccess('Workout week restarted. Fresh cycle ready!');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to restart workout plan.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const confirmed = window.confirm('Delete this workout plan permanently? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setActionState({ type: 'delete', key: planId });
    setError('');

    try {
      await workoutsAPI.deletePlan(planId);
      const remainingPlans = plans.filter((plan) => plan.id !== planId);
      const nextSelectedPlanId =
        selectedPlanId === planId ? (remainingPlans[0]?.id ?? null) : selectedPlanId;

      setPlans(remainingPlans);
      setSelectedPlanId(nextSelectedPlanId);
      if (activePlan?.id === planId) {
        setActivePlan(remainingPlans.find((plan) => plan.status === 'active') ?? null);
      }
      notifyWorkoutChanged();
      if (id === planId) {
        navigate('/workouts');
      }
      await loadPlans(false, 1);
      toastSuccess('Workout plan deleted.');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to delete workout plan.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleGeneratePlan = async () => {
    if (!hasPremiumAccess) {
      toastError('Premium subscription required to generate AI workout plans.');
      navigate('/billing');
      return;
    }

    if (
      !generatorState.weight ||
      !generatorState.goal ||
      !generatorState.experience ||
      !generatorState.equipment ||
      !generatorState.trainingDaysPerWeek
    ) {
      setGeneratorError('Fill in weight, goal, experience, training days, and equipment before generating a plan.');
      toastError('Please fill in all required fields');
      return;
    }

    setActionState({ type: 'generate', key: 'workout-ai-generate' });
    setGeneratorError('');
    setError('');

    try {
      const response = await aiAPI.generateAndSaveWorkoutPlan(generatorState);
      const generatedPlan = (response.data as { plan?: WorkoutPlan }).plan;

      if (!generatedPlan) {
        throw new Error('Workout plan was generated but no plan payload was returned.');
      }

      setShowGenerator(false);
      setPlans((current) => {
        const next = [generatedPlan, ...current.filter((plan) => plan.id !== generatedPlan.id)];
        return next;
      });
      setActivePlan(generatedPlan);
      setSelectedPlanId(generatedPlan.id);
      notifyWorkoutChanged();
      navigate(`/workouts/${generatedPlan.id}`);
      await loadPlans(false, 1);
      toastSuccess('AI workout plan generated and saved!');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : error instanceof Error
          ? error.message
          : undefined;
      const errorMsg = message || 'Failed to generate and save workout plan.';
      setGeneratorError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const renderDayCard = (planId: string, day: WorkoutDay) => {
    const isCompleted = isCompletedOnDate(day.completedAt, selectedDate);
    const isCompleting = actionState?.type === 'complete' && actionState.key === `${planId}:${day.dayNumber}`;
    const exerciseCount = day.exercises.length;

    return (
      <Card key={day.dayNumber} className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00FF88]">
                Day {day.dayNumber}
              </span>
              {isCompleted && (
                <span className="rounded-full bg-[#1f3a2c] px-3 py-1 text-xs font-semibold text-[#7fffc1]">
                  Completed
                </span>
              )}
            </div>
            <h3 className="mt-2 text-xl font-bold text-[#F7F7F7]">{day.dayLabel}</h3>
            <p className="mt-1 text-gray-400">{day.focus}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
              <span className="rounded-full border border-[#2e303a] px-3 py-1">
                {day.durationMinutes ? `${day.durationMinutes} min` : 'Flexible duration'}
              </span>
              <span className="rounded-full border border-[#2e303a] px-3 py-1">
                {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          {!isCompleted && selectedPlan?.status === 'active' && (
            <Button
              size="sm"
              variant="accent"
              className="min-w-[148px]"
              onClick={() => void handleCompleteDay(planId, day.dayNumber)}
              isLoading={isCompleting}
            >
              Mark Complete
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {day.exercises.map((exercise, index) => (
            <div
              key={`${exercise.name}-${index}`}
              className="rounded-lg border border-[#2e303a] bg-[#11131d] p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[#F7F7F7]">{exercise.name}</p>
                  <p className="text-sm text-gray-400">
                    {exercise.sets} sets x {exercise.reps}
                    {exercise.muscleGroup ? ` | ${exercise.muscleGroup}` : ''}
                    {exercise.equipment ? ` | ${exercise.equipment}` : ''}
                  </p>
                </div>
                {exercise.restSeconds ? (
                  <p className="text-sm text-gray-500">Rest {exercise.restSeconds}s</p>
                ) : null}
              </div>
              {exercise.notes ? (
                <FormattedAiText
                  text={exercise.notes}
                  className="mt-2 text-sm leading-6 text-gray-400"
                />
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const isGenerating = actionState?.type === 'generate';

  return (
    <MainLayout>
      <div className="space-y-8">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="space-y-3">
                <Breadcrumbs
                  items={[
                    { label: 'Dashboard', onClick: () => navigate('/dashboard') },
                    { label: 'Workouts', isCurrent: true },
                  ]}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Training Arsenal</p>
                <h1 className="text-3xl font-black leading-[1.02] text-[#F7F7F7] sm:text-4xl lg:text-[4.25rem]">
                  Build your
                  <span className="mt-1 block text-[#00FF88]">
                    strongest <span className="text-[#F7F7F7]">week.</span>
                  </span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                  Generate precise training splits, activate the right cycle, and turn completed sessions into visible momentum.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => void loadPlans()} isLoading={isRefreshing}>
                  Refresh
                </Button>
                {hasPremiumAccess ? (
                  <>
                    <Button variant="secondary" onClick={() => setShowGenerator(true)}>
                      Generate New Plan
                    </Button>
                    <Button variant="secondary" onClick={() => setShowGenerator((current) => !current)}>
                      {showGenerator ? 'Hide AI Generator' : 'AI Generate & Save'}
                    </Button>
                  </>
                ) : (
                  <Button variant="accent" onClick={() => navigate('/billing')}>
                    Unlock AI Generator
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Plans loaded</p>
                  <p className="text-3xl font-bold text-[#F7F7F7]">{plans.length}</p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Active cycle</p>
                  <p className="text-3xl font-bold text-[#00FF88]">{activePlan ? 'Live' : 'Idle'}</p>
                </Card>
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Completion</p>
                  <p className="text-3xl font-bold text-[#F7F7F7]">{selectedPlanCompletionRate}%</p>
                </Card>
              </div>
              <Card className="space-y-4 p-5">
                <LiveCalendar
                  selectedDate={selectedDate}
                  selectedMonth={selectedMonth}
                  onDateChange={setSelectedDate}
                  onMonthChange={setSelectedMonth}
                  onToday={goToToday}
                  subtitle={selectedPlan ? `${selectedPlan.title} on ${formatDateLabel(selectedDate)}` : 'Follow one workout day at a time'}
                  showMonthControls
                />
              </Card>
            </div>

            <Card className="theme-hero-surface overflow-hidden p-0">
              <div className="flex min-h-full flex-col justify-between gap-5 p-6">
                  <div className="theme-media-chip inline-flex self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                    Strength Mode
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h2 className="theme-media-heading text-2xl font-bold leading-tight">
                        {selectedPlan?.title || 'Focused performance split'}
                      </h2>
                      <p className="theme-media-copy mt-2 max-w-sm text-sm leading-6">
                        Lock into a split that matches your goal, your available equipment, and the number of days you can actually train.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="theme-media-panel rounded-2xl border p-4">
                        <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Days</p>
                        <p className="theme-media-heading mt-2 text-xl font-bold">{selectedPlan?.days.length ?? 0}</p>
                      </div>
                      <div className="theme-media-panel rounded-2xl border p-4">
                        <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Duration</p>
                        <p className="theme-media-heading mt-2 text-xl font-bold">
                          {selectedPlan ? getWorkoutDurationSummary(selectedPlan) : 'Flexible'}
                        </p>
                      </div>
                      <div className="theme-media-panel rounded-2xl border p-4">
                        <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Status</p>
                        <p className="theme-media-heading mt-2 text-xl font-bold capitalize">{selectedPlan?.status || 'draft'}</p>
                      </div>
                    </div>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {showGenerator && hasPremiumAccess ? (
          <Suspense fallback={<GeneratorPanelFallback />}>
            <WorkoutGeneratorPanel
              generatorError={generatorError}
              generatorState={generatorState}
              isGenerating={Boolean(isGenerating)}
              onGenerate={() => void handleGeneratePlan()}
              onReset={() => {
                setGeneratorState({
                  weight: user?.profile?.weightKg?.toString() ?? user?.profile?.weight?.toString() ?? '',
                  goal: user?.profile?.goal ?? '',
                  experience: user?.profile?.activityLevel ?? user?.profile?.level ?? '',
                  trainingDaysPerWeek: 4,
                  equipment: '',
                });
                setGeneratorError('');
              }}
              onStateChange={setGeneratorState}
            />
          </Suspense>
        ) : null}

        {showGenerator && !hasPremiumAccess ? (
          <PremiumFeatureGate
            eyebrow="Premium workouts"
            title="AI workout generation is part of FitNova Premium."
            description="Upgrade to create new AI workout plans, generate structured splits, and keep premium training tools unlocked."
          />
        ) : null}

        {error ? (
          <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <Card variant="gradient">
            <div className="space-y-5">
              <div className="h-8 w-56 animate-pulse rounded-2xl bg-[#1a2030]" />
              <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-48 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
                  ))}
                </div>
                <div className="h-[620px] animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
              </div>
            </div>
          </Card>
        ) : plans.length === 0 ? (
          <Card variant="gradient">
            <div className="space-y-4 py-12 text-center">
              <h2 className="text-2xl font-bold text-[#F7F7F7]">No workout plans yet</h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                Start with an AI split using your goal, experience level, training days, and equipment so your week feels realistic from day one.
              </p>
              <div className="flex justify-center">
                {hasPremiumAccess ? (
                  <Button variant="secondary" onClick={() => setShowGenerator(true)}>
                    Open AI Generator
                  </Button>
                ) : (
                  <Button variant="accent" onClick={() => navigate('/billing')}>
                    Unlock Premium
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isActivating = actionState?.type === 'activate' && actionState.key === plan.id;
                const isRestarting = actionState?.type === 'restart' && actionState.key === plan.id;
                const isDeleting = actionState?.type === 'delete' && actionState.key === plan.id;

                return (
                  <Card
                    key={plan.id}
                    variant={isSelected ? 'gradient' : 'default'}
                    className="space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-[#F7F7F7]">{plan.title}</h2>
                        <p className="mt-1 text-sm text-gray-400">{plan.goal}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusClasses(plan.status)}`}>
                        {plan.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">
                      <p>Level: <span className="text-[#F7F7F7]">{plan.level}</span></p>
                      <p>{getCompletionLabel(plan)}</p>
                      <p>Start: {formatDate(plan.startDate)}</p>
                    </div>

                    {plan.equipment.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {plan.equipment.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[#2e303a] px-3 py-1 text-xs text-gray-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        variant={isSelected ? 'primary' : 'secondary'}
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          navigate(`/workouts/${plan.id}`);
                        }}
                      >
                        View Details
                      </Button>
                      {plan.status === 'completed' ? (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => void handleRestartPlan(plan.id)}
                          isLoading={isRestarting}
                        >
                          Restart Week
                        </Button>
                      ) : plan.status !== 'active' ? (
                        <Button
                          size="sm"
                          onClick={() => void handleActivatePlan(plan)}
                          isLoading={isActivating}
                        >
                          {(plan.progress?.completedDays ?? plan.days.filter((day) => !!day.completedAt).length) > 0 ? 'Restore Fresh' : 'Activate'}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border-[#7a2f2f] text-[#ff9c9c] hover:border-[#ff6b6b] hover:bg-[#2a1111] hover:text-white"
                        onClick={() => void handleDeletePlan(plan.id)}
                        isLoading={isDeleting}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => void loadPlans(false, nextPage)}
                className="justify-start pt-2"
              />
            </div>

            {selectedPlan ? (
              <div className="space-y-6">
                <Card variant="gradient" className="overflow-hidden p-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_22%)]" />
                    <div className="relative space-y-5 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusClasses(selectedPlan.status)}`}>
                          {selectedPlan.status}
                        </span>
                        {selectedPlan.isAiGenerated ? (
                          <span className="rounded-full border border-[#00FF88] px-3 py-1 text-xs font-semibold text-[#00FF88]">
                            AI Generated
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-3xl font-bold text-[#F7F7F7]">{selectedPlan.title}</h2>
                      <p className="mt-2 text-gray-300">{selectedPlan.goal}</p>
                      <p className="mt-4 text-sm text-gray-400">{getCompletionLabel(selectedPlan)}</p>
                    </div>
                    <div className="grid gap-2 text-sm text-gray-400">
                      <p>Level: <span className="text-[#F7F7F7]">{selectedPlan.level}</span></p>
                      <p>Start: <span className="text-[#F7F7F7]">{formatDate(selectedPlan.startDate)}</span></p>
                      <p>End: <span className="text-[#F7F7F7]">{formatDate(selectedPlan.endDate)}</span></p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Plan completion</p>
                      <p className="mt-2 text-2xl font-bold text-[#00FF88]">{selectedPlanCompletionRate}%</p>
                    </div>
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Training days</p>
                      <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{selectedPlan.days.length}</p>
                    </div>
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Average session</p>
                      <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{getWorkoutDurationSummary(selectedPlan)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Equipment setup</p>
                      <p className="mt-2 text-base font-semibold text-[#F7F7F7]">
                        {selectedPlan.equipment.length > 0 ? selectedPlan.equipment.length : 'Bodyweight'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#00FF88]">Consistency tracker</p>
                        <p className="mt-2 text-sm text-gray-400">
                          Work through each day in order and use the completion actions to keep your weekly momentum visible.
                        </p>
                        <p className="mt-2 text-sm text-[#aeb7cb]">
                          Your active diet and calorie tracker can now follow this split's training demand day by day.
                        </p>
                      </div>
                      <div className="min-w-[220px]">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Days completed</span>
                          <span className="font-semibold text-[#F7F7F7]">
                            {selectedPlanCompletedDays}/{selectedPlanTotalDays}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1b1e2a]">
                          <div
                            className="h-full rounded-full bg-[#00FF88] transition-all"
                            style={{ width: `${selectedPlanCompletionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button variant="secondary" size="sm" onClick={() => navigate('/diet')}>
                        Build Matching Diet
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#00FF88]">Selected day</p>
                        <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                          {selectedDay ? `${selectedDay.dayLabel}, ${formatDateLabel(selectedDate)}` : formatDateLabel(selectedDate)}
                        </p>
                        <p className="mt-2 text-sm text-gray-400">
                          {selectedDay
                            ? 'Workouts now follow the shared live calendar, so training status lines up with calorie tracking.'
                            : 'No workout day is mapped to the selected date in this split.'}
                        </p>
                      </div>
                      {selectedDay ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${isCompletedOnDate(selectedDay.completedAt, selectedDate) ? 'bg-[#1f3a2c] text-[#7fffc1]' : 'bg-[#2d2f3a] text-[#c3c7d1]'}`}>
                          {isCompletedOnDate(selectedDay.completedAt, selectedDate) ? 'Done' : 'Pending'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {selectedPlan.notes ? (
                    <FormattedAiText
                      text={selectedPlan.notes}
                      className="rounded-lg border border-[#2e303a] bg-[#11131d] p-4 text-gray-300"
                    />
                  ) : null}

                  {selectedPlan.status === 'completed' ? (
                    <div className="flex flex-col gap-4 rounded-2xl border border-[#00FF88]/40 bg-[#00FF88]/10 p-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[#F7F7F7]">Week completed</p>
                        <p className="mt-1 text-sm text-gray-300">
                          Start the same split again with all days reset and a fresh active cycle.
                        </p>
                      </div>
                      <Button
                        variant="accent"
                        className="min-w-[168px]"
                        onClick={() => void handleRestartPlan(selectedPlan.id)}
                        isLoading={actionState?.type === 'restart' && actionState.key === selectedPlan.id}
                      >
                        Restart Week
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      className="border-[#7a2f2f] text-[#ff9c9c] hover:border-[#ff6b6b] hover:bg-[#2a1111] hover:text-white"
                      onClick={() => void handleDeletePlan(selectedPlan.id)}
                      isLoading={actionState?.type === 'delete' && actionState.key === selectedPlan.id}
                    >
                      Delete Plan
                    </Button>
                  </div>
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  {selectedDay ? (
                    renderDayCard(selectedPlan.id, selectedDay)
                  ) : (
                    <Card className="space-y-3 p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">No scheduled training</p>
                      <h3 className="text-xl font-bold text-[#F7F7F7]">{formatDateLabel(selectedDate)}</h3>
                      <p className="text-sm leading-7 text-gray-400">
                        This split does not have a workout day mapped to the selected live-calendar date. Move the calendar or choose another plan.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

