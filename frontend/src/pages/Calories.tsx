import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Button, Card, Input, LiveCalendar } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { useSharedCalendar } from '../hooks/useSharedCalendar';
import { aiAPI, caloriesAPI, dietAPI, getApiErrorMessage } from '../services/api';
import type { CalorieEstimate, CalorieLog, DailyCalorieLogResponse, DietPlan, Meal, MonthlyCalorieSummary } from '../types';
import { estimateGoalCalories } from '../utils/calorieTarget';
import { notifyCaloriesChanged } from '../utils/appSync';
import { formatDateLabel } from '../utils/calendar';
import { toastError, toastSuccess } from '../utils/toast';

type ApiErrorResponse = { message?: string | string[] };
type LogMode = 'ai' | 'manual';
type ManualForm = { loggedDate: string; mealType: CalorieLog['mealType']; title: string; calories: string; proteinGrams: string; carbsGrams: string; fatsGrams: string; notes: string };
type NextDietSlot = {
  loggedDate: string;
  mealType: CalorieLog['mealType'];
  dayLabel: string;
  theme?: string;
  dayTargetCalories?: number;
  meal: Meal;
};

const CaloriesComposerPanel = lazy(() =>
  import('./sections/CaloriesComposerPanel').then((module) => ({ default: module.CaloriesComposerPanel })),
);
const CaloriesMonthlyReview = lazy(() =>
  import('./sections/CaloriesMonthlyReview').then((module) => ({ default: module.CaloriesMonthlyReview })),
);

const SectionFallback = () => (
  <Card variant="glass" className="space-y-4 rounded-[1.6rem] p-4 sm:p-5">
    <div className="h-8 w-40 animate-pulse rounded-2xl bg-[#1a2030]" />
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl border border-[#2e303a] bg-[#11131d]" />
      ))}
    </div>
  </Card>
);

const emptyManual = (loggedDate: string): ManualForm => ({ loggedDate, mealType: 'breakfast', title: '', calories: '', proteinGrams: '', carbsGrams: '', fatsGrams: '', notes: '' });
const mealTypeOptions = [{ value: 'breakfast', label: 'Breakfast' }, { value: 'mid-morning', label: 'Mid-Morning' }, { value: 'lunch', label: 'Lunch' }, { value: 'evening-snack', label: 'Evening Snack' }, { value: 'dinner', label: 'Dinner' }, { value: 'post-workout', label: 'Post-Workout' }, { value: 'other', label: 'Other' }];
const formatMealLabel = (value: CalorieLog['mealType']) => value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const formatTargetSource = (value?: DailyCalorieLogResponse['targetSource']) => {
  switch (value) {
    case 'active-diet-day':
      return 'Using workout-synced diet day';
    case 'active-diet-plan':
      return 'Using active diet target';
    case 'workout-adjusted-estimate':
      return 'Using workout-adjusted estimate';
    default:
      return 'Using estimated goal calories';
  }
};

const getTargetStatLabel = (value?: DailyCalorieLogResponse['targetSource']) => {
  switch (value) {
    case 'active-diet-day':
      return 'Diet day target';
    case 'active-diet-plan':
      return 'Diet plan target';
    case 'workout-adjusted-estimate':
      return 'Workout target';
    default:
      return 'Goal target';
  }
};
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const composeMealDescription = (meal: Meal, dayLabel?: string) => {
  const parts = [
    meal.title,
    meal.description,
    meal.items?.length ? `Items: ${meal.items.join(', ')}` : '',
    dayLabel ? `Diet plan slot: ${dayLabel}` : '',
  ].filter(Boolean);

  return parts.join('. ');
};

const buildManualFormFromDietSlot = (slot: NextDietSlot): ManualForm => ({
  loggedDate: slot.loggedDate,
  mealType: slot.mealType,
  title: slot.meal.title,
  calories: slot.meal.calories != null ? String(slot.meal.calories) : '',
  proteinGrams: slot.meal.proteinGrams != null ? String(slot.meal.proteinGrams) : '',
  carbsGrams: slot.meal.carbsGrams != null ? String(slot.meal.carbsGrams) : '',
  fatsGrams: slot.meal.fatsGrams != null ? String(slot.meal.fatsGrams) : '',
  notes: slot.dayLabel,
});

const resolveNextDietSlot = (plan: DietPlan | null): NextDietSlot | null => {
  if (!plan?.days?.length) return null;

  const baseDate = plan.startDate ? new Date(plan.startDate) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  baseDate.setHours(12, 0, 0, 0);

  const sortedDays = [...plan.days].sort((left, right) => left.dayNumber - right.dayNumber);
  for (const day of sortedDays) {
    const nextMeal = day.meals.find((meal) => !meal.completedAt);
    if (!nextMeal) continue;

    const mealDate = new Date(baseDate);
    mealDate.setDate(baseDate.getDate() + Math.max(day.dayNumber - 1, 0));

    return {
      loggedDate: formatLocalDate(mealDate),
      mealType: nextMeal.type as CalorieLog['mealType'],
      dayLabel: day.dayLabel,
      theme: day.theme,
      dayTargetCalories: day.targetCalories ?? plan.targetCalories,
      meal: nextMeal,
    };
  }

  return null;
};

export const CaloriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;
  const [mode, setMode] = useState<LogMode>('ai');
  const { selectedDate, selectedMonth, setSelectedDate, setSelectedMonth, goToToday } = useSharedCalendar();
  const [manualForm, setManualForm] = useState<ManualForm>(() => emptyManual(selectedDate));
  const [aiMealType, setAiMealType] = useState<CalorieLog['mealType']>('breakfast');
  const [aiMealText, setAiMealText] = useState('');
  const [estimate, setEstimate] = useState<CalorieEstimate | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalorieLogResponse | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyCalorieSummary | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState('');
  const [error, setError] = useState('');
  const [nextDietSlot, setNextDietSlot] = useState<NextDietSlot | null>(null);
  const [dietSlotLabel, setDietSlotLabel] = useState('');
  const [hasAppliedDietSlot, setHasAppliedDietSlot] = useState(false);
  const targetSourceLabel = formatTargetSource(dailyData?.targetSource);
  const targetStatLabel = getTargetStatLabel(dailyData?.targetSource);

  useEffect(() => {
    if (!hasPremiumAccess && mode === 'ai') setMode('manual');
  }, [hasPremiumAccess, mode]);

  useEffect(() => {
    setManualForm((current) => ({ ...current, loggedDate: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    const loadDailyData = async () => {
      try {
        const response = await caloriesAPI.getDaily(selectedDate);
        setDailyData(response.data);
        setError('');
      } catch (requestError) {
        const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
          ? getApiErrorMessage(requestError.response?.data?.message)
          : undefined;
        setError(nextError || 'Failed to load daily calorie logs.');
      }
    };
    void loadDailyData();
  }, [selectedDate]);

  useEffect(() => {
    const loadMonthlySummary = async () => {
      try {
        const response = await caloriesAPI.getMonthlySummary(selectedMonth);
        setMonthlySummary(response.data);
      } catch (requestError) {
        const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
          ? getApiErrorMessage(requestError.response?.data?.message)
          : undefined;
        setError(nextError || 'Failed to load monthly calorie summary.');
      }
    };
    void loadMonthlySummary();
  }, [selectedMonth]);
  useEffect(() => {
    const syncDietSlot = async (applyNextSlot = false) => {
      try {
        const response = await dietAPI.getActivePlan();
        const nextSlot = resolveNextDietSlot(response.data);

        if (!nextSlot) {
          setNextDietSlot(null);
          setDietSlotLabel('');
          return;
        }

        setNextDietSlot(nextSlot);
        setDietSlotLabel(`${nextSlot.dayLabel} ${formatMealLabel(nextSlot.mealType)}`);

        if (applyNextSlot || !hasAppliedDietSlot) {
          setSelectedDate(nextSlot.loggedDate);
          setSelectedMonth(nextSlot.loggedDate.slice(0, 7));
          setAiMealType(nextSlot.mealType);
          setManualForm((current) => ({
            ...current,
            loggedDate: nextSlot.loggedDate,
            mealType: nextSlot.mealType,
          }));
          setHasAppliedDietSlot(true);
        }
      } catch (requestError) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
          setNextDietSlot(null);
          setDietSlotLabel('');
          return;
        }
      }

      return;
    };

    void syncDietSlot(false);

    const handleFocus = () => {
      void syncDietSlot(true);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'fitnova-diet-sync') {
        void syncDietSlot(true);
      }
    };
    const handleDietSync = () => {
      void syncDietSlot(true);
    };

    const handleCalorieSync = () => {
      void refreshData();
    };
    const handleWorkoutSync = () => {
      void refreshData();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('fitnova:diet-sync', handleDietSync);
    window.addEventListener('fitnova:calories-sync', handleCalorieSync);
    window.addEventListener('fitnova:workout-sync', handleWorkoutSync);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fitnova:diet-sync', handleDietSync);
      window.removeEventListener('fitnova:calories-sync', handleCalorieSync);
      window.removeEventListener('fitnova:workout-sync', handleWorkoutSync);
    };
  }, [hasAppliedDietSlot, selectedDate, selectedMonth]);

  const displayTargetCalories = useMemo(() => (
    dailyData?.targetCalories && dailyData.targetCalories > 0
      ? dailyData.targetCalories
      : estimateGoalCalories(user?.profile)
  ), [dailyData?.targetCalories, user?.profile]);
  const displayMonthlyTargetCalories = useMemo(() => (
    monthlySummary?.targetCalories && monthlySummary.targetCalories > 0
      ? monthlySummary.targetCalories
      : estimateGoalCalories(user?.profile)
  ), [monthlySummary?.targetCalories, user?.profile]);
  const remainingCalories = useMemo(() => (dailyData ? displayTargetCalories - dailyData.totals.calories : 0), [dailyData, displayTargetCalories]);
  const nextDietMealCompletion = useMemo(() => {
    if (!nextDietSlot || !dailyData) {
      return false;
    }

    return dailyData.entries.some(
      (entry) =>
        entry.loggedDate === nextDietSlot.loggedDate &&
        entry.mealType === nextDietSlot.mealType &&
        entry.title.trim().toLowerCase() === nextDietSlot.meal.title.trim().toLowerCase(),
    );
  }, [dailyData, nextDietSlot]);

  const refreshData = async (date = selectedDate, month = selectedMonth) => {
    try {
      const [dailyResponse, monthlyResponse] = await Promise.all([
        caloriesAPI.getDaily(date),
        caloriesAPI.getMonthlySummary(month),
      ]);
      setDailyData(dailyResponse.data);
      setMonthlySummary(monthlyResponse.data);
      setError('');
    } catch (requestError) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      setError(nextError || 'Failed to refresh calorie data.');
    }
  };

  const resetComposer = () => {
    setMode(hasPremiumAccess ? 'ai' : 'manual');
    setEditingLogId(null);
    setEstimate(null);
    setAiMealType(nextDietSlot?.mealType ?? 'breakfast');
    setAiMealText('');
    setManualForm(nextDietSlot ? buildManualFormFromDietSlot(nextDietSlot) : emptyManual(selectedDate));
  };

  const handleUseDietMealInManual = () => {
    if (!nextDietSlot) {
      return;
    }

    setMode('manual');
    setEditingLogId(null);
    setEstimate(null);
    setSelectedDate(nextDietSlot.loggedDate);
    setSelectedMonth(nextDietSlot.loggedDate.slice(0, 7));
    setManualForm(buildManualFormFromDietSlot(nextDietSlot));
  };

  const handleUseDietMealInAi = () => {
    if (!nextDietSlot) {
      return;
    }

    setMode('ai');
    setEditingLogId(null);
    setEstimate(null);
    setSelectedDate(nextDietSlot.loggedDate);
    setSelectedMonth(nextDietSlot.loggedDate.slice(0, 7));
    setAiMealType(nextDietSlot.mealType);
    setAiMealText(composeMealDescription(nextDietSlot.meal, nextDietSlot.dayLabel));
  };

  const handleEstimate = async () => {
    if (!hasPremiumAccess) {
      toastError('Premium subscription required for AI calorie estimation.');
      return;
    }
    if (!aiMealText.trim()) {
      toastError('Describe what you ate first.');
      return;
    }
    setActionState('estimate');
    try {
      const response = await aiAPI.estimateCalorieLog({
        loggedDate: selectedDate,
        mealType: aiMealType,
        rawInput: aiMealText.trim(),
      });
      setEstimate(response.data.estimate);
      toastSuccess('AI estimate ready.');
    } catch (requestError) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      toastError(nextError || 'Could not estimate that meal.');
    } finally {
      setActionState(null);
    }
  };

  const handleSaveEstimate = async () => {
    if (!estimate) return;
    setActionState('save-estimate');
    try {
      await caloriesAPI.createLog({
        loggedDate: estimate.loggedDate,
        mealType: estimate.mealType,
        title: estimate.title,
        source: 'ai',
        rawInput: estimate.rawInput,
        calories: estimate.calories,
        proteinGrams: estimate.proteinGrams,
        carbsGrams: estimate.carbsGrams,
        fatsGrams: estimate.fatsGrams,
        notes: estimate.notes ?? null,
        confidence: estimate.confidence,
        parsedItems: estimate.parsedItems,
      });
      const mealDate = estimate.loggedDate;
      const mealMonth = mealDate.slice(0, 7);
      await refreshData(mealDate, mealMonth);
      setSelectedDate(mealDate);
      setSelectedMonth(mealMonth);
      notifyCaloriesChanged();
      toastSuccess('Estimated meal saved.');
      resetComposer();
    } catch (requestError) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      toastError(nextError || 'Could not save estimated meal.');
    } finally {
      setActionState(null);
    }
  };

  const handleSaveManual = async () => {
    if (!manualForm.title.trim() || !manualForm.calories.trim()) {
      toastError('Add at least a meal title and calories.');
      return;
    }

    const calories = Number(manualForm.calories);
    const proteinGrams = manualForm.proteinGrams ? Number(manualForm.proteinGrams) : null;
    const carbsGrams = manualForm.carbsGrams ? Number(manualForm.carbsGrams) : null;
    const fatsGrams = manualForm.fatsGrams ? Number(manualForm.fatsGrams) : null;
    const hasInvalidNumber = [calories, proteinGrams, carbsGrams, fatsGrams].some(
      (value) => value != null && (!Number.isFinite(value) || value < 0),
    );

    if (!Number.isFinite(calories) || calories <= 0 || hasInvalidNumber) {
      toastError('Use valid positive calories and non-negative macro values.');
      return;
    }

    const payload = {
      loggedDate: manualForm.loggedDate,
      mealType: manualForm.mealType,
      title: manualForm.title.trim(),
      source: 'manual' as const,
      rawInput: null,
      calories,
      proteinGrams,
      carbsGrams,
      fatsGrams,
      notes: manualForm.notes.trim() || null,
      confidence: null,
      parsedItems: null,
    };
    setActionState(editingLogId ? `update-${editingLogId}` : 'manual-save');
    try {
      if (editingLogId) {
        await caloriesAPI.updateLog(editingLogId, payload);
        toastSuccess('Calorie entry updated.');
      } else {
        await caloriesAPI.createLog(payload);
        toastSuccess('Manual calorie entry added.');
      }
      const mealDate = manualForm.loggedDate;
      const mealMonth = mealDate.slice(0, 7);
      await refreshData(mealDate, mealMonth);
      setSelectedDate(mealDate);
      setSelectedMonth(mealMonth);
      notifyCaloriesChanged();
      resetComposer();
    } catch (requestError) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      toastError(nextError || 'Could not save calorie entry.');
    } finally {
      setActionState(null);
    }
  };

  const handleEdit = (entry: CalorieLog) => {
    setMode('manual');
    setEditingLogId(entry.id);
    setEstimate(null);
    setSelectedDate(entry.loggedDate);
    setSelectedMonth(entry.loggedDate.slice(0, 7));
    setManualForm({
      loggedDate: entry.loggedDate,
      mealType: entry.mealType,
      title: entry.title,
      calories: String(entry.calories),
      proteinGrams: entry.proteinGrams != null ? String(entry.proteinGrams) : '',
      carbsGrams: entry.carbsGrams != null ? String(entry.carbsGrams) : '',
      fatsGrams: entry.fatsGrams != null ? String(entry.fatsGrams) : '',
      notes: entry.notes ?? '',
    });
  };

  const handleDelete = async (entry: CalorieLog) => {
    setActionState(`delete-${entry.id}`);
    try {
      await caloriesAPI.deleteLog(entry.id);
      const mealDate = entry.loggedDate;
      const mealMonth = mealDate.slice(0, 7);
      await refreshData(mealDate, mealMonth);
      notifyCaloriesChanged();
      toastSuccess('Calorie entry removed.');
      if (editingLogId === entry.id) {
        resetComposer();
      }
    } catch (requestError) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      toastError(nextError || 'Could not delete calorie entry.');
    } finally {
      setActionState(null);
    }
  };

  const handleGenerateAiInsights = async () => {
    if (!hasPremiumAccess) {
      toastError('Premium subscription required for AI calorie insights.');
      return;
    }
    setActionState('ai-insights');
    try {
      const response = await aiAPI.getCalorieInsights(selectedMonth);
      setAiInsights(response.data.content);
      toastSuccess('AI calorie review generated.');
    } catch (requestError) {
      const nextError = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      toastError(nextError || 'Could not generate AI calorie insights.');
    } finally {
      setActionState(null);
    }
  };

  return (
    <MainLayout>
      <div className="w-full space-y-5 sm:space-y-6">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-5">
              <div className="space-y-3">
                <Breadcrumbs items={[{ label: 'Dashboard', onClick: () => navigate('/dashboard') }, { label: 'Calories', isCurrent: true }]} />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">AI Food Logging</p>
                <h1 className="text-3xl font-black leading-[0.98] text-[#F7F7F7] sm:text-4xl lg:text-5xl">
                  Describe the meal.
                  <span className="block text-[#a5afc5]">Keep your tracker fast and usable.</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#a5afc5] sm:text-base">
                  Log meals in plain language, save AI estimates when you need speed, or switch to manual entry whenever you want tighter control.
                </p>
              </div>
            </div>

            <Card className="theme-hero-surface overflow-hidden border-white/10 p-0 lg:min-h-[520px] lg:self-start">
              <div className="flex min-h-[420px] flex-col gap-5 p-6 lg:min-h-[520px]">
                  <div className="theme-media-chip inline-flex self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                    Tracker Mode
                  </div>
                  <div className="mt-auto space-y-4 pt-2">
                    <div>
                      <h2 className="theme-media-heading text-2xl font-bold leading-tight">
                        Calorie target and daily rhythm
                      </h2>
                      <p className="theme-media-copy mt-2 max-w-sm text-sm leading-6">
                        Keep daily targets visible, move faster with AI logging, and stay synced with your active diet plan when one is running.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['Today', `${dailyData?.totals.calories ?? 0}`],
                        ['Remaining', dailyData ? `${remainingCalories}` : '--'],
                        [targetStatLabel, `${displayTargetCalories}`],
                        ['Avg day', `${monthlySummary?.averageLoggedDayCalories ?? 0}`],
                      ].map(([label, value]) => (
                        <div key={label} className="theme-media-panel rounded-2xl border p-4">
                          <p className="theme-media-copy text-sm">{label}</p>
                          <p
                            className={`mt-2 text-2xl font-bold sm:text-3xl ${
                              label === 'Remaining' && remainingCalories < 0
                                ? 'text-[#FF6B00]'
                                : label === 'Remaining' || label === 'Goal target'
                                  ? 'text-[#00FF88]'
                                  : 'theme-media-heading'
                            }`}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
              </div>
            </Card>
          </div>
        </Card>

        {error ? <div className="rounded-xl border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-sm text-[#FFB27A]">{error}</div> : null}
        {dietSlotLabel ? (
          <div className="rounded-xl border border-[#00FF88]/20 bg-[#00FF88]/10 p-4 text-sm text-[#bfffe0]">
            The calorie logger is following your next active diet meal: <span className="font-semibold">{dietSlotLabel}</span>.
          </div>
        ) : null}
        <Card className="space-y-4 rounded-[1.6rem] p-4 sm:p-5">
          <LiveCalendar
            selectedDate={selectedDate}
            selectedMonth={selectedMonth}
            onDateChange={setSelectedDate}
            onMonthChange={setSelectedMonth}
            onToday={goToToday}
            subtitle="Diet, workouts, and calorie tracking now follow the same live date"
            showMonthControls
          />
        </Card>
        {nextDietSlot ? (
          <Card variant="glass" className="space-y-4 rounded-[1.5rem] border border-[#00FF88]/15 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Diet-linked quick log</p>
                <h2 className="text-xl font-bold text-[#F7F7F7]">
                  {nextDietSlot.meal.title}
                </h2>
                <p className="text-sm leading-6 text-[#aab3c6]">
                  {nextDietSlot.dayLabel}
                  {nextDietSlot.theme ? `, ${nextDietSlot.theme}` : ''} on {formatDateLabel(nextDietSlot.loggedDate)}.
                </p>
                {nextDietSlot.meal.description ? (
                  <p className="text-sm leading-6 text-[#8f97ab]">{nextDietSlot.meal.description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" onClick={handleUseDietMealInManual}>
                  Use In Manual Logger
                </Button>
                {hasPremiumAccess ? (
                  <Button variant="secondary" onClick={handleUseDietMealInAi}>
                    Use In AI Logger
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Meal type</p>
                <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">{formatMealLabel(nextDietSlot.mealType)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Plan calories</p>
                <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                  {nextDietSlot.meal.calories != null ? `${nextDietSlot.meal.calories}` : 'N/A'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Protein</p>
                <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                  {nextDietSlot.meal.proteinGrams != null ? `${nextDietSlot.meal.proteinGrams}g` : 'N/A'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Carbs</p>
                <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                  {nextDietSlot.meal.carbsGrams != null ? `${nextDietSlot.meal.carbsGrams}g` : 'N/A'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Status</p>
                <p className={`mt-2 text-lg font-semibold ${nextDietMealCompletion ? 'text-[#00FF88]' : 'text-[#F7F7F7]'}`}>
                  {nextDietMealCompletion ? 'Logged' : 'Ready'}
                </p>
                {nextDietSlot.dayTargetCalories ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8f97ab]">
                    Day target {nextDietSlot.dayTargetCalories} kcal
                  </p>
                ) : null}
              </div>
            </div>
            {nextDietSlot.meal.items?.length ? (
              <div className="flex flex-wrap gap-2">
                {nextDietSlot.meal.items.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#d7dce7]">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}
        <div className="rounded-xl border border-white/10 bg-[#0f1320] p-4 text-sm text-[#d5d9e3]">
          <span className="rounded-full border border-[#00FF88]/25 bg-[#00FF88]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ff9ca]">
            {targetSourceLabel}
          </span>
          {dailyData?.activeWorkoutDay ? (
            <p className="mt-3 text-sm text-[#d5d9e3]">
              {dailyData.activeWorkoutDay.isTrainingDay
                ? `Today's tracker is adjusted for ${dailyData.activeWorkoutDay.focus.toLowerCase()} training${dailyData.activeWorkoutDay.durationMinutes ? ` (${dailyData.activeWorkoutDay.durationMinutes} min)` : ''}.`
                : 'Today is treated as a recovery day, so the tracker stays on your lower recovery target.'}
            </p>
          ) : null}
          {dailyData?.activeWorkoutDay?.isCompleted ? (
            <p className="mt-2 text-sm text-[#9ff9ca]">
              The workout for this selected day is already marked complete and synced into your tracker context.
            </p>
          ) : null}
          {dailyData?.plannedNutritionDay ? (
            <p className="mt-2 text-sm text-[#9ea7b9]">
              Nutrition plan: {dailyData.plannedNutritionDay.dayLabel}
              {dailyData.plannedNutritionDay.theme ? `, ${dailyData.plannedNutritionDay.theme}` : ''}.
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
          <Suspense fallback={<SectionFallback />}>
            <CaloriesComposerPanel
              actionState={actionState}
              aiMealText={aiMealText}
              aiMealType={aiMealType}
              editingLogId={editingLogId}
              estimate={estimate}
              hasPremiumAccess={hasPremiumAccess}
              manualForm={manualForm}
              mealTypeOptions={mealTypeOptions}
              mode={mode}
              onAiMealTextChange={setAiMealText}
              onAiMealTypeChange={setAiMealType}
              onEstimate={() => void handleEstimate()}
              onManualFormChange={setManualForm}
              onModeChange={setMode}
              onReset={resetComposer}
              onSaveEstimate={() => void handleSaveEstimate()}
              onSaveManual={() => void handleSaveManual()}
              onSwitchToBilling={() => navigate('/billing')}
              onSwitchToManualFromEstimate={(nextEstimate) => {
                setMode('manual');
                setManualForm({
                  loggedDate: nextEstimate.loggedDate,
                  mealType: nextEstimate.mealType,
                  title: nextEstimate.title,
                  calories: String(nextEstimate.calories),
                  proteinGrams: String(nextEstimate.proteinGrams),
                  carbsGrams: String(nextEstimate.carbsGrams),
                  fatsGrams: String(nextEstimate.fatsGrams),
                  notes: nextEstimate.notes ?? '',
                });
              }}
            />
          </Suspense>

          <div className="space-y-5">
            <Card variant="gradient" className="space-y-5 rounded-[1.6rem] p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Daily view</p><h2 className="mt-1 text-xl font-bold text-[#F7F7F7] sm:text-2xl">{formatDateLabel(selectedDate)}</h2></div><Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="max-w-full sm:max-w-[220px]" /></div>
              <div className="space-y-3">{dailyData?.entries.length ? dailyData.entries.map((entry) => <div key={entry.id} className="flex flex-col gap-4 rounded-2xl border border-[#2e303a] bg-[#11131d] p-4 lg:flex-row lg:items-center lg:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-[#00FF88]">{formatMealLabel(entry.mealType)}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8f97ab]">{entry.source ?? 'manual'}</span><p className="text-sm text-[#8f97ab]">{entry.calories} kcal</p></div><h3 className="text-lg font-semibold text-[#F7F7F7]">{entry.title}</h3>{entry.rawInput ? <p className="text-sm leading-6 text-[#8f97ab]">{entry.rawInput}</p> : null}<p className="text-sm text-[#98a3b8]">P {entry.proteinGrams ?? 0}g | C {entry.carbsGrams ?? 0}g | F {entry.fatsGrams ?? 0}g</p>{entry.parsedItems?.length ? <p className="text-xs uppercase tracking-[0.16em] text-[#8f97ab]">{entry.parsedItems.length} parsed items | {Math.round((entry.confidence ?? 0) * 100)}% confidence</p> : null}</div><div className="flex gap-3"><Button variant="secondary" size="sm" onClick={() => handleEdit(entry)}>Edit</Button><Button variant="secondary" size="sm" onClick={() => void handleDelete(entry)} isLoading={actionState === `delete-${entry.id}`}>Delete</Button></div></div>) : <div className="rounded-2xl border border-dashed border-[#2e303a] bg-[#10131d] p-6 text-sm leading-7 text-[#98a3b8]">{hasPremiumAccess ? 'No entries logged for this day yet. Use AI logging for speed or add your meals manually.' : 'No entries logged for this day yet. Start with the manual logger or upgrade to unlock faster AI meal estimation.'}</div>}</div>
            </Card>

            <Suspense fallback={<SectionFallback />}>
              <CaloriesMonthlyReview
                actionState={actionState}
                aiInsights={aiInsights}
                displayMonthlyTargetCalories={displayMonthlyTargetCalories}
                hasPremiumAccess={hasPremiumAccess}
                monthlySummary={monthlySummary}
                onGenerateAiInsights={() => void handleGenerateAiInsights()}
                onGoBilling={() => navigate('/billing')}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
