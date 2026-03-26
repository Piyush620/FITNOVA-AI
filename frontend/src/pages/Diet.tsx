import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Card, Button, Input, Pagination, Select } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { aiAPI, dietAPI, getApiErrorMessage } from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';
import type { DietDay, DietPlan, GenerateDietPlanPayload, Meal } from '../types';

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

const formatMealType = (type: Meal['type']) =>
  type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getCompletionLabel = (plan: DietPlan) => {
  const completedMeals =
    plan.progress?.completedMeals ??
    plan.days.reduce((sum, day) => sum + day.meals.filter((meal) => !!meal.completedAt).length, 0);
  const totalMeals =
    plan.progress?.totalMeals ?? plan.days.reduce((sum, day) => sum + day.meals.length, 0);

  return `${completedMeals}/${totalMeals} meals completed`;
};

const getStatusClasses = (status: DietPlan['status']) => {
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

const defaultGeneratorState: GenerateDietPlanPayload = {
  goal: '',
  calories: 2200,
  preference: 'veg',
  budget: 'medium',
};

export const DietPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorState, setGeneratorState] = useState<GenerateDietPlanPayload>(defaultGeneratorState);
  const [generatorError, setGeneratorError] = useState('');
  const [actionState, setActionState] = useState<
    { type: 'activate' | 'complete' | 'generate'; key: string } | null
  >(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setGeneratorState((current) => ({
      ...current,
      goal: user?.profile?.goal ?? '',
    }));
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
      const plansResponse = await dietAPI.listPlans(requestedPage, 6);
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
      setError(message || 'Failed to load diet plans.');
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
      const response = await dietAPI.activatePlan(planId);
      const nextActivePlan = response.data;
      setActivePlan(nextActivePlan);
      setSelectedPlanId(nextActivePlan.id);
      navigate(`/diet/${nextActivePlan.id}`);
      await loadPlans(false, 1);
      toastSuccess('Diet plan activated! 🥗');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to activate diet plan.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleCompleteMeal = async (planId: string, dayNumber: number, mealType: Meal['type']) => {
    setActionState({ type: 'complete', key: `${planId}:${dayNumber}:${mealType}` });
    setError('');

    try {
      const response = await dietAPI.completeMeal(planId, dayNumber, mealType);
      const updatedPlan = response.data;

      setPlans((current) => current.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)));
      setSelectedPlanId(updatedPlan.id);
      navigate(`/diet/${updatedPlan.id}`);
      if (activePlan?.id === updatedPlan.id || updatedPlan.status === 'active' || updatedPlan.status === 'completed') {
        setActivePlan(updatedPlan.status === 'archived' ? null : updatedPlan);
      }
      await loadPlans();
      toastSuccess('Meal logged! Nutritional goals on track! 🎯');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to mark meal as complete.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleGeneratePlan = async () => {
    if (!generatorState.goal || !generatorState.calories || !generatorState.preference || !generatorState.budget) {
      setGeneratorError('Fill in goal, calories, preference, and budget before generating a plan.');
      toastError('Please fill in all required fields');
      return;
    }

    setActionState({ type: 'generate', key: 'diet-ai-generate' });
    setGeneratorError('');
    setError('');

    try {
      const response = await aiAPI.generateAndSaveDietPlan(generatorState);
      const generatedPlan = (response.data as { plan?: DietPlan }).plan;

      if (!generatedPlan) {
        throw new Error('Diet plan was generated but no plan payload was returned.');
      }

      setShowGenerator(false);
      setPlans((current) => [generatedPlan, ...current.filter((plan) => plan.id !== generatedPlan.id)]);
      setActivePlan(generatedPlan);
      setSelectedPlanId(generatedPlan.id);
      navigate(`/diet/${generatedPlan.id}`);
      await loadPlans();
      toastSuccess('AI diet plan generated and saved! 🤖🥗');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : error instanceof Error
          ? error.message
          : undefined;
      const errorMsg = message || 'Failed to generate and save diet plan.';
      setGeneratorError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const renderMealCard = (planId: string, dayNumber: number, meal: Meal) => {
    const isCompleted = !!meal.completedAt;
    const isCompleting =
      actionState?.type === 'complete' && actionState.key === `${planId}:${dayNumber}:${meal.type}`;

    return (
      <div key={`${dayNumber}-${meal.type}`} className="rounded-lg border border-[#2e303a] bg-[#11131d] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00FF88]">
                {formatMealType(meal.type)}
              </span>
              {isCompleted ? (
                <span className="rounded-full bg-[#1f3a2c] px-3 py-1 text-xs font-semibold text-[#7fffc1]">
                  Completed
                </span>
              ) : null}
            </div>
            <h4 className="mt-2 text-lg font-bold text-[#F7F7F7]">{meal.title}</h4>
            {meal.description ? <p className="mt-1 text-sm text-gray-400">{meal.description}</p> : null}
          </div>
          {!isCompleted && selectedPlan?.status === 'active' ? (
            <Button
              size="sm"
              onClick={() => void handleCompleteMeal(planId, dayNumber, meal.type)}
              isLoading={isCompleting}
            >
              Mark Complete
            </Button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-400">
          {meal.calories ? <span>{meal.calories} kcal</span> : null}
          {meal.proteinGrams ? <span>{meal.proteinGrams}g protein</span> : null}
          {meal.carbsGrams ? <span>{meal.carbsGrams}g carbs</span> : null}
          {meal.fatsGrams ? <span>{meal.fatsGrams}g fats</span> : null}
        </div>

        {meal.items?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {meal.items.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#2e303a] px-3 py-1 text-xs text-gray-300"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderDayCard = (planId: string, day: DietDay) => (
    <Card key={day.dayNumber} className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00FF88]">
            Day {day.dayNumber}
          </span>
          {day.targetCalories ? (
            <span className="rounded-full border border-[#2e303a] px-3 py-1 text-xs text-gray-300">
              {day.targetCalories} kcal target
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 text-xl font-bold text-[#F7F7F7]">{day.dayLabel}</h3>
        {day.theme ? <p className="mt-1 text-gray-400">{day.theme}</p> : null}
      </div>

      <div className="space-y-3">
        {day.meals.map((meal) => renderMealCard(planId, day.dayNumber, meal))}
      </div>
    </Card>
  );

  const isGenerating = actionState?.type === 'generate';

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#F7F7F7]">Diet Plans</h1>
            <p className="mt-2 text-gray-400">Track your nutrition plan, activate a schedule, and complete meals day by day.</p>
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
                <h2 className="text-2xl font-bold text-[#F7F7F7]">AI Diet Generator</h2>
                <p className="mt-1 text-gray-400">
                  Generate a structured diet plan and save it directly into your nutrition plans.
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
                label="Goal"
                placeholder="Fat loss, maintenance, lean bulk..."
                value={generatorState.goal}
                onChange={(e) => setGeneratorState((current) => ({ ...current, goal: e.target.value }))}
              />
              <Input
                label="Target Calories"
                type="number"
                min={1000}
                max={6000}
                value={generatorState.calories}
                onChange={(e) =>
                  setGeneratorState((current) => ({
                    ...current,
                    calories: Number(e.target.value) || 0,
                  }))
                }
              />
              <Select
                label="Preference"
                value={generatorState.preference}
                onChange={(e) =>
                  setGeneratorState((current) => ({
                    ...current,
                    preference: e.target.value as GenerateDietPlanPayload['preference'],
                  }))
                }
                options={[
                  { value: 'veg', label: 'Veg' },
                  { value: 'non-veg', label: 'Non-veg' },
                ]}
              />
              <Select
                label="Budget"
                value={generatorState.budget}
                onChange={(e) =>
                  setGeneratorState((current) => ({
                    ...current,
                    budget: e.target.value as GenerateDietPlanPayload['budget'],
                  }))
                }
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
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
                    goal: user?.profile?.goal ?? '',
                    calories: 2200,
                    preference: 'veg',
                    budget: 'medium',
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
              <p className="mb-6 text-lg text-gray-400">Loading your diet plans...</p>
              <div className="inline-flex animate-spin">
                <div className="h-8 w-8 rounded-full border-4 border-[#00FF88] border-t-transparent"></div>
              </div>
            </div>
          </Card>
        ) : plans.length === 0 ? (
          <Card variant="gradient">
            <div className="space-y-4 py-12 text-center">
              <h2 className="text-2xl font-bold text-[#F7F7F7]">No diet plans yet</h2>
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
                  <Card key={plan.id} variant={isSelected ? 'gradient' : 'default'} className="space-y-4">
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
                      <p>Preference: <span className="text-[#F7F7F7]">{plan.preference}</span></p>
                      <p>{getCompletionLabel(plan)}</p>
                      <p>Calories: <span className="text-[#F7F7F7]">{plan.targetCalories ?? 'Not set'}</span></p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        variant={isSelected ? 'primary' : 'secondary'}
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          navigate(`/diet/${plan.id}`);
                        }}
                      >
                        View Details
                      </Button>
                      {plan.status !== 'active' ? (
                        <Button size="sm" onClick={() => void handleActivatePlan(plan.id)} isLoading={isActivating}>
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
                      <p>Preference: <span className="text-[#F7F7F7]">{selectedPlan.preference}</span></p>
                      <p>Target Calories: <span className="text-[#F7F7F7]">{selectedPlan.targetCalories ?? 'Not set'}</span></p>
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
