import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Card, Button, Input, Pagination, PremiumFeatureGate, Select } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { aiAPI, dietAPI, getApiErrorMessage, workoutsAPI } from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';
import type { DietDay, DietPlan, GenerateDietPlanPayload, Meal, WorkoutPlan } from '../types';
import { estimateGoalCalories } from '../utils/calorieTarget';
import heroImage from '../assets/hero.png';

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

const formatPreferenceLabel = (preference: DietPlan['preference']) => {
  switch (preference) {
    case 'non-veg':
      return 'Non-Veg';
    case 'eggetarian':
      return 'Eggetarian';
    default:
      return 'Veg';
  }
};

const calculateMealNutrition = (meal: Meal) => ({
  calories: meal.calories ?? 0,
  proteinGrams: meal.proteinGrams ?? 0,
  carbsGrams: meal.carbsGrams ?? 0,
  fatsGrams: meal.fatsGrams ?? 0,
});

const calculateDayNutrition = (day: DietDay) =>
  day.meals.reduce(
    (totals, meal) => {
      const mealNutrition = calculateMealNutrition(meal);
      return {
        calories: totals.calories + mealNutrition.calories,
        proteinGrams: totals.proteinGrams + mealNutrition.proteinGrams,
        carbsGrams: totals.carbsGrams + mealNutrition.carbsGrams,
        fatsGrams: totals.fatsGrams + mealNutrition.fatsGrams,
      };
    },
    {
      calories: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatsGrams: 0,
    }
  );

const calculatePlanNutrition = (plan: DietPlan) =>
  plan.days.reduce(
    (totals, day) => {
      const dayNutrition = calculateDayNutrition(day);
      return {
        calories: totals.calories + dayNutrition.calories,
        proteinGrams: totals.proteinGrams + dayNutrition.proteinGrams,
        carbsGrams: totals.carbsGrams + dayNutrition.carbsGrams,
        fatsGrams: totals.fatsGrams + dayNutrition.fatsGrams,
      };
    },
    {
      calories: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatsGrams: 0,
    }
  );

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
  currentWeightKg: 70,
  targetWeightKg: 65,
  timelineWeeks: 12,
  preference: 'veg',
  cuisineRegion: 'mixed-indian',
  budget: 'medium',
};

const notifyDietTrackerSync = () => {
  const syncToken = `${Date.now()}`;
  localStorage.setItem('fitnova-diet-sync', syncToken);
  window.dispatchEvent(new CustomEvent('fitnova:diet-sync', { detail: syncToken }));
};

export const DietPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorState, setGeneratorState] = useState<GenerateDietPlanPayload>(defaultGeneratorState);
  const [generatorError, setGeneratorError] = useState('');
  const [actionState, setActionState] = useState<
    { type: 'activate' | 'complete' | 'generate' | 'restart' | 'delete'; key: string } | null
  >(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setGeneratorState((current) => ({
      ...current,
      goal: user?.profile?.goal ?? '',
      currentWeightKg: user?.profile?.weightKg ?? current.currentWeightKg,
    }));
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveWorkoutPlan(null);
      return;
    }

    void (async () => {
      try {
        const response = await workoutsAPI.getActivePlan();
        setActiveWorkoutPlan(response.data);
      } catch (requestError) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
          setActiveWorkoutPlan(null);
        }
      }
    })();
  }, [isAuthenticated]);

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
  const selectedPlanNutrition = selectedPlan ? calculatePlanNutrition(selectedPlan) : null;
  const selectedPlanCompletedMeals =
    selectedPlan?.progress?.completedMeals ??
    selectedPlan?.days.reduce((sum, day) => sum + day.meals.filter((meal) => !!meal.completedAt).length, 0) ??
    0;
  const selectedPlanTotalMeals =
    selectedPlan?.progress?.totalMeals ??
    selectedPlan?.days.reduce((sum, day) => sum + day.meals.length, 0) ??
    0;
  const selectedPlanCompletionRate =
    selectedPlanTotalMeals > 0 ? Math.round((selectedPlanCompletedMeals / selectedPlanTotalMeals) * 100) : 0;
  const averageCaloriesPerDay =
    selectedPlan && selectedPlan.days.length > 0 && selectedPlanNutrition
      ? Math.round(selectedPlanNutrition.calories / selectedPlan.days.length)
      : null;
  const estimatedTrackerCalories = estimateGoalCalories(user?.profile);
  const activePlanTargetCalories =
    activePlan?.targetCalories ??
    activePlan?.days.find((day) => typeof day.targetCalories === 'number')?.targetCalories ??
    null;
  const currentTrackerCalories =
    activePlanTargetCalories && activePlanTargetCalories > 0
      ? activePlanTargetCalories
      : estimatedTrackerCalories;
  const selectedPlanTargetCalories =
    selectedPlan?.targetCalories ??
    selectedPlan?.days.find((day) => typeof day.targetCalories === 'number')?.targetCalories ??
    null;
  const previewTrackerCalories =
    selectedPlanTargetCalories && selectedPlanTargetCalories > 0
      ? selectedPlanTargetCalories
      : estimatedTrackerCalories;

  const handleActivatePlan = async (planId: string) => {
    setActionState({ type: 'activate', key: planId });
    setError('');

    try {
      const response = await dietAPI.activatePlan(planId);
      const nextActivePlan = response.data;
      setActivePlan(nextActivePlan);
      setSelectedPlanId(nextActivePlan.id);
      notifyDietTrackerSync();
      navigate(`/diet/${nextActivePlan.id}`);
      await loadPlans(false, 1);
      toastSuccess('Diet plan activated!');
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
      notifyDietTrackerSync();
      navigate(`/diet/${updatedPlan.id}`);
      if (activePlan?.id === updatedPlan.id || updatedPlan.status === 'active' || updatedPlan.status === 'completed') {
        setActivePlan(updatedPlan.status === 'archived' ? null : updatedPlan);
      }
      await loadPlans();
      toastSuccess('Meal logged! Nutritional goals on track!');
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

  const handleRestartPlan = async (planId: string) => {
    setActionState({ type: 'restart', key: planId });
    setError('');

    try {
      const response = await dietAPI.restartPlan(planId);
      const restartedPlan = response.data;
      setActivePlan(restartedPlan);
      setSelectedPlanId(restartedPlan.id);
      notifyDietTrackerSync();
      navigate(`/diet/${restartedPlan.id}`);
      await loadPlans(false, 1);
      toastSuccess('Diet week restarted. Fresh meal tracking is ready!');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to restart diet plan.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const confirmed = window.confirm('Delete this diet plan permanently? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setActionState({ type: 'delete', key: planId });
    setError('');

    try {
      await dietAPI.deletePlan(planId);
      const remainingPlans = plans.filter((plan) => plan.id !== planId);
      const nextSelectedPlanId =
        selectedPlanId === planId ? (remainingPlans[0]?.id ?? null) : selectedPlanId;

      setPlans(remainingPlans);
      setSelectedPlanId(nextSelectedPlanId);
      if (activePlan?.id === planId) {
        setActivePlan(remainingPlans.find((plan) => plan.status === 'active') ?? null);
      }
      notifyDietTrackerSync();
      if (id === planId) {
        navigate('/diet');
      }
      await loadPlans(false, 1);
      toastSuccess('Diet plan deleted.');
    } catch (error) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? getApiErrorMessage(error.response?.data?.message)
        : undefined;
      const errorMsg = message || 'Failed to delete diet plan.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setActionState(null);
    }
  };

  const handleGeneratePlan = async () => {
    if (!hasPremiumAccess) {
      toastError('Premium subscription required to generate AI diet plans.');
      navigate('/billing');
      return;
    }

    if (
      !generatorState.goal ||
      !generatorState.currentWeightKg ||
      !generatorState.targetWeightKg ||
      !generatorState.timelineWeeks ||
      !generatorState.preference ||
      !generatorState.cuisineRegion ||
      !generatorState.budget
    ) {
      setGeneratorError('Fill in goal, current weight, target weight, timeline, cuisine, preference, and budget before generating a plan.');
      toastError('Please fill in all required fields');
      return;
    }

    if (generatorState.currentWeightKg === generatorState.targetWeightKg) {
      setGeneratorError('Set a target weight that is different from your current weight.');
      toastError('Choose a different target weight');
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
      notifyDietTrackerSync();
      navigate(`/diet/${generatedPlan.id}`);
      await loadPlans();
      toastSuccess('AI diet plan generated and saved!');
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
    const mealNutrition = calculateMealNutrition(meal);

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
              variant="accent"
              className="min-w-[148px]"
              onClick={() => void handleCompleteMeal(planId, dayNumber, meal.type)}
              isLoading={isCompleting}
            >
              Mark Complete
            </Button>
          ) : null}
        </div>

        {(mealNutrition.calories > 0 ||
          mealNutrition.proteinGrams > 0 ||
          mealNutrition.carbsGrams > 0 ||
          mealNutrition.fatsGrams > 0) ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Calories</p>
              <p className="mt-1 text-sm font-semibold text-[#F7F7F7]">{mealNutrition.calories} kcal</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Protein</p>
              <p className="mt-1 text-sm font-semibold text-[#F7F7F7]">{mealNutrition.proteinGrams}g</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Carbs</p>
              <p className="mt-1 text-sm font-semibold text-[#F7F7F7]">{mealNutrition.carbsGrams}g</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Fats</p>
              <p className="mt-1 text-sm font-semibold text-[#F7F7F7]">{mealNutrition.fatsGrams}g</p>
            </div>
          </div>
        ) : null}

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

  const renderDayCard = (planId: string, day: DietDay) => {
    const dayNutrition = calculateDayNutrition(day);
    const completedMeals = day.meals.filter((meal) => !!meal.completedAt).length;
    const totalMeals = day.meals.length;
    const completionRate = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;
    const calorieTarget = day.targetCalories ?? selectedPlan?.targetCalories ?? null;
    const calorieDifference = calorieTarget !== null ? dayNutrition.calories - calorieTarget : null;

    return (
      <Card key={day.dayNumber} className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00FF88]">
                  Day {day.dayNumber}
                </span>
                {calorieTarget ? (
                  <span className="rounded-full border border-[#2e303a] px-3 py-1 text-xs text-gray-300">
                    {calorieTarget} kcal target
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-xl font-bold text-[#F7F7F7]">{day.dayLabel}</h3>
              {day.theme ? <p className="mt-1 text-gray-400">{day.theme}</p> : null}
            </div>

            <div className="min-w-[240px] rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Daily progress</span>
                <span className="font-semibold text-[#F7F7F7]">{completedMeals}/{totalMeals} meals</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1b1e2a]">
                <div
                  className="h-full rounded-full bg-[#00FF88] transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-gray-400">
                {completionRate === 100
                  ? 'Great work. This day is fully completed.'
                  : `${Math.max(totalMeals - completedMeals, 0)} meal${totalMeals - completedMeals === 1 ? '' : 's'} left to complete.`}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Calories</p>
              <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">{dayNutrition.calories} kcal</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Protein</p>
              <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">{dayNutrition.proteinGrams}g</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Carbs</p>
              <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">{dayNutrition.carbsGrams}g</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Fats</p>
              <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">{dayNutrition.fatsGrams}g</p>
            </div>
            <div className="rounded-xl border border-[#2e303a] bg-[#0B0B0B] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Calorie gap</p>
              <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                {calorieDifference === null ? 'N/A' : `${calorieDifference > 0 ? '+' : ''}${calorieDifference} kcal`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {day.meals.map((meal) => renderMealCard(planId, day.dayNumber, meal))}
        </div>
      </Card>
    );
  };

  const isGenerating = actionState?.type === 'generate';

  return (
    <MainLayout>
      <div className="space-y-8">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-5">
              <div className="space-y-3">
                <Breadcrumbs
                  items={[
                    { label: 'Dashboard', onClick: () => navigate('/dashboard') },
                    { label: 'Diet', isCurrent: true },
                  ]}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Nutrition Engine</p>
                <h1 className="text-3xl font-black leading-[0.98] text-[#F7F7F7] sm:text-4xl lg:text-5xl">
                  Turn your
                  <span className="block bg-[linear-gradient(90deg,#00FF88_0%,#F4FFF9_55%,#FF6B00_100%)] bg-clip-text text-transparent">
                    meals into momentum.
                  </span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                  Build cuisine-aware diet plans, track every meal, and keep your calorie and macro rhythm visible through the week.
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
                    Unlock AI Diet Plans
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
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
                <Card className="space-y-2 p-5">
                  <p className="text-sm text-gray-400">Tracker target</p>
                  <p className="text-3xl font-bold text-[#00FF88]">{currentTrackerCalories}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8f97ab]">
                    {activePlan ? 'Active diet synced' : 'Goal estimate'}
                  </p>
                </Card>
              </div>
            </div>

            <Card className="overflow-hidden border-white/10 p-0 lg:min-h-[620px] lg:self-start">
              <div className="relative min-h-[520px] lg:min-h-[620px]">
                <img src={heroImage} alt="Diet visual" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.18)_0%,rgba(5,5,5,0.58)_48%,rgba(5,5,5,0.94)_100%)]" />
                <div className="absolute inset-0 flex flex-col gap-5 p-6">
                  <div className="inline-flex self-start rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FF88] backdrop-blur">
                    Nutrition Mode
                  </div>
                  <div className="mt-auto space-y-4 pt-2">
                    <div>
                      <h2 className="text-2xl font-bold leading-tight text-[#F7F7F7]">
                        {selectedPlan?.title || 'Cuisine-aware diet system'}
                      </h2>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-[#d7dce6]">
                        Keep the structure practical, the cuisine familiar, and the calorie target realistic enough to follow.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9ea7b9]">Calories</p>
                        <p className="mt-2 text-xl font-bold text-[#F7F7F7]">
                          {selectedPlanTargetCalories ? `${selectedPlanTargetCalories}` : estimatedTrackerCalories}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9ea7b9]">Preference</p>
                        <p className="mt-2 text-xl font-bold text-[#F7F7F7]">
                          {selectedPlan ? formatPreferenceLabel(selectedPlan.preference) : 'Mixed'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9ea7b9]">Status</p>
                        <p className="mt-2 text-xl font-bold text-[#F7F7F7] capitalize">{selectedPlan?.status || 'draft'}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#00FF88]/20 bg-[radial-gradient(circle_at_top,rgba(0,255,136,0.12),transparent_70%),rgba(0,0,0,0.3)] p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#9ea7b9]">Calorie tracker sync</p>
                      <p className="mt-2 text-xl font-bold text-[#00FF88]">{currentTrackerCalories} kcal</p>
                      <p className="mt-2 text-sm leading-6 text-[#d7dce6]">
                        {activePlan
                          ? `Your calorie tracker currently follows the active diet target. This selected plan would track at ${previewTrackerCalories} kcal when active.`
                          : `Before you start a diet plan, FitNova estimates your tracker target from your profile and goal. Once you save and activate a plan, the tracker updates to that plan target automatically.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {showGenerator && hasPremiumAccess ? (
          <Card variant="gradient" className="space-y-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#F7F7F7]">AI Diet Generator</h2>
                <p className="mt-1 text-gray-400">
                  Tell FitNova your current weight, goal weight, timeline, cuisine, and food preference. The AI will estimate calories and build the week for you.
                </p>
              </div>
              <span className="text-sm text-gray-500">Uses your backend AI provider</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0f1320] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Current tracker target</p>
                <p className="mt-2 text-2xl font-bold text-[#00FF88]">{currentTrackerCalories} kcal</p>
                <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
                  {activePlan ? 'This is coming from your active diet plan.' : 'This is your current goal-based estimate.'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f1320] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Goal-based estimate</p>
                <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{estimatedTrackerCalories} kcal</p>
                <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
                  FitNova uses your profile goal, activity, and body stats before any diet plan exists.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f1320] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">After plan is active</p>
                <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">Tracker updates</p>
                <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
                  As soon as a diet plan is saved and active, the calorie tracker switches to that plan target automatically.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f1320] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Workout sync</p>
                <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                  {activeWorkoutPlan ? `${activeWorkoutPlan.days.length} day split` : 'No active split'}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
                  {activeWorkoutPlan
                    ? 'Diet generation follows your active workout split, giving training days more fuel and recovery support.'
                    : 'Activate a workout split first if you want meal timing and day calories shaped around training demand.'}
                </p>
              </div>
            </div>

            {activeWorkoutPlan ? (
              <div className="rounded-2xl border border-[#00FF88]/20 bg-[#0f1320] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FF88]">Active workout split</p>
                <p className="mt-2 text-sm leading-6 text-[#d5d9e3]">
                  {activeWorkoutPlan.title}: {activeWorkoutPlan.days.map((day) => `${day.dayLabel} ${day.focus}`).join(', ')}.
                </p>
              </div>
            ) : null}

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
                label="Current Weight (kg)"
                type="number"
                min={30}
                max={300}
                value={generatorState.currentWeightKg}
                onChange={(e) =>
                  setGeneratorState((current) => ({
                    ...current,
                    currentWeightKg: Number(e.target.value) || 0,
                  }))
                }
              />
              <Input
                label="Target Weight (kg)"
                type="number"
                min={30}
                max={300}
                value={generatorState.targetWeightKg}
                onChange={(e) =>
                  setGeneratorState((current) => ({
                    ...current,
                    targetWeightKg: Number(e.target.value) || 0,
                  }))
                }
              />
              <Input
                label="Time To Reach Goal (weeks)"
                type="number"
                min={1}
                max={52}
                value={generatorState.timelineWeeks}
                onChange={(e) =>
                  setGeneratorState((current) => ({
                    ...current,
                    timelineWeeks: Number(e.target.value) || 0,
                  }))
                }
              />
              <Select
                label="Food Preference"
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
                  { value: 'eggetarian', label: 'Eggetarian' },
                ]}
              />
              <Select
                label="Cuisine Style"
                value={generatorState.cuisineRegion}
                onChange={(e) =>
                  setGeneratorState((current) => ({
                    ...current,
                    cuisineRegion: e.target.value as GenerateDietPlanPayload['cuisineRegion'],
                  }))
                }
                options={[
                  { value: 'north-indian', label: 'North Indian' },
                  { value: 'south-indian', label: 'South Indian' },
                  { value: 'east-indian', label: 'East Indian' },
                  { value: 'west-indian', label: 'West Indian' },
                  { value: 'mixed-indian', label: 'Mixed Indian' },
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
                    currentWeightKg: user?.profile?.weightKg ?? 70,
                    targetWeightKg: Math.max((user?.profile?.weightKg ?? 70) - 5, 30),
                    timelineWeeks: 12,
                    preference: 'veg',
                    cuisineRegion: 'mixed-indian',
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

        {showGenerator && !hasPremiumAccess ? (
          <PremiumFeatureGate
            eyebrow="Premium nutrition"
            title="AI diet generation is unlocked on the premium plan."
            description="Upgrade to generate structured meal plans from your target weight, timeline, cuisine preferences, and budget."
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
              <div className="h-8 w-52 animate-pulse rounded-2xl bg-[#1a2030]" />
              <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-44 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
                  ))}
                </div>
                <div className="h-[620px] animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
              </div>
            </div>
          </Card>
        ) : plans.length === 0 ? (
          <Card variant="gradient">
            <div className="space-y-4 py-12 text-center">
              <h2 className="text-2xl font-bold text-[#F7F7F7]">No diet plans yet</h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                Build a plan from your current weight, target weight, timeline, and cuisine preference so the meals feel realistic for your lifestyle.
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
                      <p>Preference: <span className="text-[#F7F7F7]">{formatPreferenceLabel(plan.preference)}</span></p>
                      <p>{getCompletionLabel(plan)}</p>
                      <p>Calories: <span className="text-[#F7F7F7]">{plan.targetCalories ? `${plan.targetCalories} kcal` : 'AI derived'}</span></p>
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
                        <Button size="sm" onClick={() => void handleActivatePlan(plan.id)} isLoading={isActivating}>
                          Activate
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
                      <p>Preference: <span className="text-[#F7F7F7]">{formatPreferenceLabel(selectedPlan.preference)}</span></p>
                      <p>Target Calories: <span className="text-[#F7F7F7]">{selectedPlan.targetCalories ? `${selectedPlan.targetCalories} kcal` : 'AI derived'}</span></p>
                      <p>Start: <span className="text-[#F7F7F7]">{formatDate(selectedPlan.startDate)}</span></p>
                      <p>End: <span className="text-[#F7F7F7]">{formatDate(selectedPlan.endDate)}</span></p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Plan completion</p>
                      <p className="mt-2 text-2xl font-bold text-[#00FF88]">{selectedPlanCompletionRate}%</p>
                    </div>
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Average calories/day</p>
                      <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                        {averageCaloriesPerDay ? `${averageCaloriesPerDay}` : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Protein/day</p>
                      <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                        {selectedPlanNutrition ? `${Math.round(selectedPlanNutrition.proteinGrams / Math.max(selectedPlan.days.length, 1))}g` : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Carbs/day</p>
                      <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                        {selectedPlanNutrition ? `${Math.round(selectedPlanNutrition.carbsGrams / Math.max(selectedPlan.days.length, 1))}g` : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Fats/day</p>
                      <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
                        {selectedPlanNutrition ? `${Math.round(selectedPlanNutrition.fatsGrams / Math.max(selectedPlan.days.length, 1))}g` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#2e303a] bg-[#0B0B0B] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#00FF88]">Calorie tracker</p>
                        <p className="mt-2 text-sm text-gray-400">
                          Use this as your weekly nutrition guide. Staying close to the target matters more than being perfect on every single meal.
                        </p>
                      </div>
                      <div className="min-w-[220px]">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Meals completed</span>
                          <span className="font-semibold text-[#F7F7F7]">
                            {selectedPlanCompletedMeals}/{selectedPlanTotalMeals}
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
                  </div>

                  {selectedPlan.notes ? (
                    <div className="rounded-lg border border-[#2e303a] bg-[#11131d] p-4 text-gray-300">
                      {selectedPlan.notes}
                    </div>
                  ) : null}

                  {selectedPlan.status === 'completed' ? (
                    <div className="flex flex-col gap-4 rounded-2xl border border-[#00FF88]/40 bg-[#00FF88]/10 p-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[#F7F7F7]">Week completed</p>
                        <p className="mt-1 text-sm text-gray-300">
                          Restart the same meal structure with all completion marks cleared for a fresh week.
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


