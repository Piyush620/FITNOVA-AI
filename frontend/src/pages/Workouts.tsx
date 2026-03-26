import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Card, Button, Input, Pagination } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { aiAPI, getApiErrorMessage, workoutsAPI } from '../services/api';
import type { GenerateWorkoutPlanPayload, WorkoutDay, WorkoutPlan } from '../types';

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

const defaultGeneratorState: GenerateWorkoutPlanPayload = {
  weight: '',
  goal: '',
  experience: '',
  equipment: '',
};

export const WorkoutsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
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
    { type: 'activate' | 'complete' | 'generate'; key: string } | null
  >(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setGeneratorState({
      weight: user?.profile?.weightKg?.toString() ?? user?.profile?.weight?.toString() ?? '',
      goal: user?.profile?.goal ?? '',
      experience: user?.profile?.activityLevel ?? user?.profile?.level ?? '',
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
    if (id) {
      setSelectedPlanId(id);
    }
  }, [id]);

  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) ??
    activePlan ??
    plans[0] ??
    null;

  const handleActivatePlan = async (planId: string) => {
    setActionState({ type: 'activate', key: planId });
    setError('');

    try {
      const response = await workoutsAPI.activatePlan(planId);
      const nextActivePlan = response.data;
      setActivePlan(nextActivePlan);
      setSelectedPlanId(nextActivePlan.id);
      navigate(`/workouts/${nextActivePlan.id}`);
      await loadPlans();
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      setError(message || 'Failed to activate workout plan.');
    } finally {
      setActionState(null);
    }
  };

  const handleCompleteDay = async (planId: string, dayNumber: number) => {
    setActionState({ type: 'complete', key: `${planId}:${dayNumber}` });
    setError('');

    try {
      const response = await workoutsAPI.completeSession(planId, dayNumber);
      const updatedPlan = response.data;

      setPlans((current) =>
        current.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
      );
      setSelectedPlanId(updatedPlan.id);
      navigate(`/workouts/${updatedPlan.id}`);
      if (activePlan?.id === updatedPlan.id || updatedPlan.status === 'active' || updatedPlan.status === 'completed') {
        setActivePlan(updatedPlan.status === 'archived' ? null : updatedPlan);
      }
      await loadPlans();
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      setError(message || 'Failed to mark workout day as complete.');
    } finally {
      setActionState(null);
    }
  };

  const handleGeneratePlan = async () => {
    if (!generatorState.weight || !generatorState.goal || !generatorState.experience || !generatorState.equipment) {
      setGeneratorError('Fill in weight, goal, experience, and equipment before generating a plan.');
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
      navigate(`/workouts/${generatedPlan.id}`);
      await loadPlans(false, 1);
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : error instanceof Error
          ? error.message
          : undefined;
      setGeneratorError(message || 'Failed to generate and save workout plan.');
    } finally {
      setActionState(null);
    }
  };

  const renderDayCard = (planId: string, day: WorkoutDay) => {
    const isCompleted = !!day.completedAt;
    const isCompleting = actionState?.type === 'complete' && actionState.key === `${planId}:${day.dayNumber}`;

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
            <p className="mt-2 text-sm text-gray-500">
              {day.durationMinutes ? `${day.durationMinutes} min` : 'Flexible duration'}
            </p>
          </div>
          {!isCompleted && selectedPlan?.status === 'active' && (
            <Button
              size="sm"
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
                    {exercise.muscleGroup ? ` • ${exercise.muscleGroup}` : ''}
                    {exercise.equipment ? ` • ${exercise.equipment}` : ''}
                  </p>
                </div>
                {exercise.restSeconds ? (
                  <p className="text-sm text-gray-500">Rest {exercise.restSeconds}s</p>
                ) : null}
              </div>
              {exercise.notes ? <p className="mt-2 text-sm text-gray-400">{exercise.notes}</p> : null}
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
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#F7F7F7]">Workout Plans</h1>
            <p className="mt-2 text-gray-400">View your plans, activate a routine, and track completed sessions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void loadPlans()} isLoading={isRefreshing}>
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => setShowGenerator(true)}>
              Generate New Plan
            </Button>
            <Button variant="secondary" onClick={() => setShowGenerator((current) => !current)}>
              {showGenerator ? 'Hide AI Generator' : 'AI Generate & Save'}
            </Button>
          </div>
        </div>

        {showGenerator ? (
          <Card variant="gradient" className="space-y-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#F7F7F7]">AI Workout Generator</h2>
                <p className="mt-1 text-gray-400">
                  Generate a structured workout plan and save it directly into your plans.
                </p>
              </div>
              <span className="text-sm text-gray-500">Uses your backend AI provider</span>
            </div>

            {generatorError ? (
              <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
                {generatorError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Weight"
                placeholder="70 kg"
                value={generatorState.weight}
                onChange={(e) => setGeneratorState((current) => ({ ...current, weight: e.target.value }))}
              />
              <Input
                label="Goal"
                placeholder="Fat loss, muscle gain, strength..."
                value={generatorState.goal}
                onChange={(e) => setGeneratorState((current) => ({ ...current, goal: e.target.value }))}
              />
              <div className="w-full">
                <label className="mb-2 block text-sm font-medium text-[#F7F7F7]">Experience</label>
                <select
                  className="w-full rounded-lg border border-[#2e303a] bg-[#1a1a2e] px-4 py-2.5 text-[#F7F7F7] focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]"
                  value={generatorState.experience}
                  onChange={(e) => setGeneratorState((current) => ({ ...current, experience: e.target.value }))}
                >
                  <option value="">Select your level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <Input
                label="Equipment"
                placeholder="Dumbbells, bench, resistance bands, bodyweight"
                helperText="Use a comma-separated list or a short phrase."
                value={generatorState.equipment}
                onChange={(e) => setGeneratorState((current) => ({ ...current, equipment: e.target.value }))}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void handleGeneratePlan()} isLoading={isGenerating}>
                Generate And Save Plan
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setGeneratorState({
                    weight: user?.profile?.weightKg?.toString() ?? user?.profile?.weight?.toString() ?? '',
                    goal: user?.profile?.goal ?? '',
                    experience: user?.profile?.activityLevel ?? user?.profile?.level ?? '',
                    equipment: '',
                  });
                  setGeneratorError('');
                }}
                disabled={isGenerating}
              >
                Reset Form
              </Button>
            </div>
          </Card>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <Card variant="gradient">
            <div className="py-12 text-center">
              <p className="mb-6 text-lg text-gray-400">Loading your workout plans...</p>
              <div className="inline-flex animate-spin">
                <div className="h-8 w-8 rounded-full border-4 border-[#00FF88] border-t-transparent"></div>
              </div>
            </div>
          </Card>
        ) : plans.length === 0 ? (
          <Card variant="gradient">
            <div className="space-y-4 py-12 text-center">
              <h2 className="text-2xl font-bold text-[#F7F7F7]">No workout plans yet</h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                Generate one with AI above, or add a manual creation flow next.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isActivating = actionState?.type === 'activate' && actionState.key === plan.id;

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
                      {plan.status !== 'active' ? (
                        <Button
                          size="sm"
                          onClick={() => void handleActivatePlan(plan.id)}
                          isLoading={isActivating}
                        >
                          Activate
                        </Button>
                      ) : null}
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
                <Card variant="gradient" className="space-y-5">
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

                  {selectedPlan.notes ? (
                    <div className="rounded-lg border border-[#2e303a] bg-[#11131d] p-4 text-gray-300">
                      {selectedPlan.notes}
                    </div>
                  ) : null}
                </Card>

                <div className="space-y-4">
                  {selectedPlan.days.map((day) => renderDayCard(selectedPlan.id, day))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
