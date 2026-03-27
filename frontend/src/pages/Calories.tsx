import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Button, Card, Input, PremiumFeatureGate, Select, Textarea } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { aiAPI, caloriesAPI, dietAPI, getApiErrorMessage } from '../services/api';
import type { CalorieEstimate, CalorieLog, DailyCalorieLogResponse, DietPlan, MonthlyCalorieSummary } from '../types';
import { estimateGoalCalories } from '../utils/calorieTarget';
import { toastError, toastSuccess } from '../utils/toast';

type ApiErrorResponse = { message?: string | string[] };
type LogMode = 'ai' | 'manual';
type ManualForm = { loggedDate: string; mealType: CalorieLog['mealType']; title: string; calories: string; proteinGrams: string; carbsGrams: string; fatsGrams: string; notes: string };

const today = () => new Date().toISOString().slice(0, 10);
const monthNow = () => new Date().toISOString().slice(0, 7);
const emptyManual = (loggedDate: string): ManualForm => ({ loggedDate, mealType: 'breakfast', title: '', calories: '', proteinGrams: '', carbsGrams: '', fatsGrams: '', notes: '' });
const mealTypeOptions = [{ value: 'breakfast', label: 'Breakfast' }, { value: 'mid-morning', label: 'Mid-Morning' }, { value: 'lunch', label: 'Lunch' }, { value: 'evening-snack', label: 'Evening Snack' }, { value: 'dinner', label: 'Dinner' }, { value: 'post-workout', label: 'Post-Workout' }, { value: 'other', label: 'Other' }];
const formatDateLabel = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
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
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const resolveNextDietSlot = (plan: DietPlan | null) => {
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
    };
  }

  return null;
};

export const CaloriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;
  const [mode, setMode] = useState<LogMode>('ai');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(monthNow);
  const [manualForm, setManualForm] = useState<ManualForm>(() => emptyManual(today()));
  const [aiMealType, setAiMealType] = useState<CalorieLog['mealType']>('breakfast');
  const [aiMealText, setAiMealText] = useState('');
  const [estimate, setEstimate] = useState<CalorieEstimate | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalorieLogResponse | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyCalorieSummary | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState('');
  const [error, setError] = useState('');
  const [dietSlotLabel, setDietSlotLabel] = useState('');
  const [hasAppliedDietSlot, setHasAppliedDietSlot] = useState(false);
  const targetSourceLabel = formatTargetSource(dailyData?.targetSource);

  useEffect(() => { if (!hasPremiumAccess && mode === 'ai') setMode('manual'); }, [hasPremiumAccess, mode]);
  useEffect(() => setManualForm((current) => ({ ...current, loggedDate: selectedDate })), [selectedDate]);
  useEffect(() => { void (async () => { try { setDailyData((await caloriesAPI.getDaily(selectedDate)).data); setError(''); } catch (requestError) { const nextError = axios.isAxiosError<ApiErrorResponse>(requestError) ? getApiErrorMessage(requestError.response?.data?.message) : undefined; setError(nextError || 'Failed to load daily calorie logs.'); } })(); }, [selectedDate]);
  useEffect(() => { void (async () => { try { setMonthlySummary((await caloriesAPI.getMonthlySummary(selectedMonth)).data); } catch (requestError) { const nextError = axios.isAxiosError<ApiErrorResponse>(requestError) ? getApiErrorMessage(requestError.response?.data?.message) : undefined; setError(nextError || 'Failed to load monthly calorie summary.'); } })(); }, [selectedMonth]);
  useEffect(() => {
    const syncDietSlot = async (applyNextSlot = false) => {
      try {
        const response = await dietAPI.getActivePlan();
        const nextSlot = resolveNextDietSlot(response.data);

        if (!nextSlot) {
          setDietSlotLabel('');
          return;
        }

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

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('fitnova:diet-sync', handleDietSync);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fitnova:diet-sync', handleDietSync);
    };
  }, [hasAppliedDietSlot]);

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

  const refreshData = async (date = selectedDate, month = selectedMonth) => {
    const [dailyResponse, monthlyResponse] = await Promise.all([caloriesAPI.getDaily(date), caloriesAPI.getMonthlySummary(month)]);
    setDailyData(dailyResponse.data); setMonthlySummary(monthlyResponse.data); setError('');
  };

  const resetComposer = () => { setMode(hasPremiumAccess ? 'ai' : 'manual'); setEditingLogId(null); setEstimate(null); setAiMealType('breakfast'); setAiMealText(''); setManualForm(emptyManual(selectedDate)); };

  const handleEstimate = async () => {
    if (!hasPremiumAccess) return toastError('Premium subscription required for AI calorie estimation.');
    if (!aiMealText.trim()) return toastError('Describe what you ate first.');
    setActionState('estimate');
    try { setEstimate((await aiAPI.estimateCalorieLog({ loggedDate: selectedDate, mealType: aiMealType, rawInput: aiMealText.trim() })).data.estimate); toastSuccess('AI estimate ready.'); }
    catch (requestError) { const nextError = axios.isAxiosError<ApiErrorResponse>(requestError) ? getApiErrorMessage(requestError.response?.data?.message) : undefined; toastError(nextError || 'Could not estimate that meal.'); }
    finally { setActionState(null); }
  };

  const handleSaveEstimate = async () => {
    if (!estimate) return;
    setActionState('save-estimate');
    try {
      await caloriesAPI.createLog({ loggedDate: estimate.loggedDate, mealType: estimate.mealType, title: estimate.title, source: 'ai', rawInput: estimate.rawInput, calories: estimate.calories, proteinGrams: estimate.proteinGrams, carbsGrams: estimate.carbsGrams, fatsGrams: estimate.fatsGrams, notes: estimate.notes ?? null, confidence: estimate.confidence, parsedItems: estimate.parsedItems });
      await refreshData(estimate.loggedDate, estimate.loggedDate.slice(0, 7)); setSelectedDate(estimate.loggedDate); setSelectedMonth(estimate.loggedDate.slice(0, 7)); toastSuccess('Estimated meal saved.'); resetComposer();
    } catch (requestError) { const nextError = axios.isAxiosError<ApiErrorResponse>(requestError) ? getApiErrorMessage(requestError.response?.data?.message) : undefined; toastError(nextError || 'Could not save estimated meal.'); }
    finally { setActionState(null); }
  };

  const handleSaveManual = async () => {
    if (!manualForm.title.trim() || !manualForm.calories.trim()) return toastError('Add at least a meal title and calories.');
    const payload = { loggedDate: manualForm.loggedDate, mealType: manualForm.mealType, title: manualForm.title.trim(), source: 'manual' as const, rawInput: null, calories: Number(manualForm.calories), proteinGrams: manualForm.proteinGrams ? Number(manualForm.proteinGrams) : null, carbsGrams: manualForm.carbsGrams ? Number(manualForm.carbsGrams) : null, fatsGrams: manualForm.fatsGrams ? Number(manualForm.fatsGrams) : null, notes: manualForm.notes.trim() || null, confidence: null, parsedItems: null };
    setActionState(editingLogId ? `update-${editingLogId}` : 'manual-save');
    try {
      if (editingLogId) { await caloriesAPI.updateLog(editingLogId, payload); toastSuccess('Calorie entry updated.'); } else { await caloriesAPI.createLog(payload); toastSuccess('Manual calorie entry added.'); }
      await refreshData(manualForm.loggedDate, manualForm.loggedDate.slice(0, 7)); setSelectedDate(manualForm.loggedDate); setSelectedMonth(manualForm.loggedDate.slice(0, 7)); resetComposer();
    } catch (requestError) { const nextError = axios.isAxiosError<ApiErrorResponse>(requestError) ? getApiErrorMessage(requestError.response?.data?.message) : undefined; toastError(nextError || 'Could not save calorie entry.'); }
    finally { setActionState(null); }
  };

  const handleEdit = (entry: CalorieLog) => {
    setMode('manual'); setEditingLogId(entry.id); setEstimate(null); setSelectedDate(entry.loggedDate); setSelectedMonth(entry.loggedDate.slice(0, 7));
    setManualForm({ loggedDate: entry.loggedDate, mealType: entry.mealType, title: entry.title, calories: String(entry.calories), proteinGrams: entry.proteinGrams != null ? String(entry.proteinGrams) : '', carbsGrams: entry.carbsGrams != null ? String(entry.carbsGrams) : '', fatsGrams: entry.fatsGrams != null ? String(entry.fatsGrams) : '', notes: entry.notes ?? '' });
  };

  const handleDelete = async (entry: CalorieLog) => {
    setActionState(`delete-${entry.id}`);
    try { await caloriesAPI.deleteLog(entry.id); await refreshData(entry.loggedDate, entry.loggedDate.slice(0, 7)); toastSuccess('Calorie entry removed.'); if (editingLogId === entry.id) resetComposer(); }
    catch (requestError) { const nextError = axios.isAxiosError<ApiErrorResponse>(requestError) ? getApiErrorMessage(requestError.response?.data?.message) : undefined; toastError(nextError || 'Could not delete calorie entry.'); }
    finally { setActionState(null); }
  };

  const handleGenerateAiInsights = async () => {
    if (!hasPremiumAccess) return toastError('Premium subscription required for AI calorie insights.');
    setActionState('ai-insights');
    try { setAiInsights((await aiAPI.getCalorieInsights(selectedMonth)).data.content); toastSuccess('AI calorie review generated.'); }
    catch (requestError) { const nextError = axios.isAxiosError<ApiErrorResponse>(requestError) ? getApiErrorMessage(requestError.response?.data?.message) : undefined; toastError(nextError || 'Could not generate AI calorie insights.'); }
    finally { setActionState(null); }
  };

  return (
    <MainLayout>
      <div className="w-full space-y-5 sm:space-y-6">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="relative grid gap-5 px-5 py-6 sm:px-7 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.1),transparent_20%)]" />
            <div className="relative space-y-4">
              <Breadcrumbs items={[{ label: 'Dashboard', onClick: () => navigate('/dashboard') }, { label: 'Calories', isCurrent: true }]} />
              <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">AI Food Logging</p><h1 className="text-[2rem] font-black leading-[0.95] text-[#F7F7F7] sm:text-[2.6rem] lg:text-[3.2rem]">Describe the meal.<span className="block text-[#a5afc5]">Keep your tracker fast and usable.</span></h1><p className="max-w-2xl text-sm leading-7 text-[#a5afc5] sm:text-base">Log meals in plain language, save AI estimates when you need speed, or switch to manual entry whenever you want tighter control.</p></div>
            </div>
            <div className="relative grid grid-cols-2 gap-3">{[['Today', `${dailyData?.totals.calories ?? 0}`], ['Remaining', dailyData ? `${remainingCalories}` : '--'], ['Goal target', `${displayTargetCalories}`], ['Avg day', `${monthlySummary?.averageLoggedDayCalories ?? 0}`]].map(([label, value]) => <Card key={label} className="space-y-2 border-white/10 bg-black/20 p-4"><p className="text-sm text-[#8f97ab]">{label}</p><p className={`text-2xl font-bold sm:text-3xl ${label === 'Remaining' && remainingCalories < 0 ? 'text-[#FF6B00]' : label === 'Remaining' || label === 'Goal target' ? 'text-[#00FF88]' : 'text-[#F7F7F7]'}`}>{value}</p></Card>)}</div>
          </div>
        </Card>

        {error ? <div className="rounded-xl border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-sm text-[#FFB27A]">{error}</div> : null}
        {dietSlotLabel ? (
          <div className="rounded-xl border border-[#00FF88]/20 bg-[#00FF88]/10 p-4 text-sm text-[#bfffe0]">
            The calorie logger is following your next active diet meal: <span className="font-semibold">{dietSlotLabel}</span>.
          </div>
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
          {dailyData?.plannedNutritionDay ? (
            <p className="mt-2 text-sm text-[#9ea7b9]">
              Nutrition plan: {dailyData.plannedNutritionDay.dayLabel}
              {dailyData.plannedNutritionDay.theme ? `, ${dailyData.plannedNutritionDay.theme}` : ''}.
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
          <Card variant="glass" className="space-y-5 rounded-[1.6rem] p-4 sm:p-5 xl:sticky xl:top-24">
            <div className="flex gap-2 rounded-2xl border border-white/10 bg-[#0f1320] p-1">
              <button type="button" onClick={() => hasPremiumAccess ? setMode('ai') : navigate('/billing')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${mode === 'ai' ? 'bg-white text-black' : 'text-[#c6cede]'}`}>{hasPremiumAccess ? 'AI Estimate' : 'AI Estimate (Premium)'}</button>
              <button type="button" onClick={() => setMode('manual')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${mode === 'manual' ? 'bg-white text-black' : 'text-[#c6cede]'}`}>Manual</button>
            </div>

            {mode === 'ai' ? (
              hasPremiumAccess ? (
              <div className="space-y-5">
                <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">AI logging</p><h2 className="text-xl font-bold text-[#F7F7F7] sm:text-2xl">What did you eat?</h2></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><Input label="Date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /><Select label="Meal type" value={aiMealType} onChange={(e) => setAiMealType(e.target.value as CalorieLog['mealType'])} options={mealTypeOptions} /></div>
                <Textarea label="Meal description" rows={5} value={aiMealText} onChange={(e) => setAiMealText(e.target.value)} placeholder="Example: 2 rotis, paneer sabzi, dal, little rice and curd" />
                <div className="flex flex-wrap gap-3"><Button variant="accent" onClick={() => void handleEstimate()} isLoading={actionState === 'estimate'}>Estimate With AI</Button>{estimate ? <Button variant="secondary" onClick={resetComposer}>Reset</Button> : null}</div>
                {estimate ? <div className="space-y-4 rounded-2xl border border-[#2e303a] bg-[#0f1320] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Estimate preview</p><h3 className="mt-2 text-lg font-semibold text-[#F7F7F7]">{estimate.title}</h3><p className="mt-2 text-sm leading-6 text-[#98a3b8]">{estimate.rawInput}</p></div><div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#8f97ab]">{Math.round(estimate.confidence * 100)}% confidence</div></div><div className="grid grid-cols-2 gap-3">{[['Calories', `${estimate.calories}`], ['Protein', `${estimate.proteinGrams}g`], ['Carbs', `${estimate.carbsGrams}g`], ['Fats', `${estimate.fatsGrams}g`]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">{label}</p><p className="mt-2 text-xl font-bold text-[#F7F7F7]">{value}</p></div>)}</div><div className="space-y-2">{estimate.parsedItems.map((item) => <div key={`${item.name}-${item.quantity ?? ''}`} className="flex items-center justify-between rounded-xl border border-[#2e303a] bg-black/20 px-3 py-2"><div><p className="text-sm font-medium text-[#F7F7F7]">{item.name}</p>{item.quantity ? <p className="text-xs text-[#8f97ab]">{item.quantity}</p> : null}</div><p className="text-sm text-[#cfd6e3]">{item.estimatedCalories ?? 0} kcal</p></div>)}</div><div className="flex flex-wrap gap-3 border-t border-white/10 pt-4"><Button variant="accent" onClick={() => void handleSaveEstimate()} isLoading={actionState === 'save-estimate'}>Save Estimated Entry</Button><Button variant="secondary" onClick={() => { setMode('manual'); setManualForm({ loggedDate: estimate.loggedDate, mealType: estimate.mealType, title: estimate.title, calories: String(estimate.calories), proteinGrams: String(estimate.proteinGrams), carbsGrams: String(estimate.carbsGrams), fatsGrams: String(estimate.fatsGrams), notes: estimate.notes ?? '' }); }}>Edit Manually</Button></div></div> : null}
              </div>
              ) : (
                <PremiumFeatureGate eyebrow="Premium nutrition AI" title="AI calorie estimation is available on the premium plan." description="Upgrade to describe meals in plain language, review AI macro estimates, and generate deeper monthly nutrition reviews." ctaLabel="Unlock AI Logging" />
              )
            ) : (
              <div className="space-y-5">
                <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">{editingLogId ? 'Edit entry' : 'Manual logging'}</p><h2 className="text-xl font-bold text-[#F7F7F7] sm:text-2xl">{editingLogId ? 'Update calorie log' : 'Enter calories manually'}</h2></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><Input label="Date" type="date" value={manualForm.loggedDate} onChange={(e) => setManualForm((current) => ({ ...current, loggedDate: e.target.value }))} /><Select label="Meal type" value={manualForm.mealType} onChange={(e) => setManualForm((current) => ({ ...current, mealType: e.target.value as CalorieLog['mealType'] }))} options={mealTypeOptions} /></div>
                <Input label="Meal title" value={manualForm.title} onChange={(e) => setManualForm((current) => ({ ...current, title: e.target.value }))} placeholder="Paneer wrap, oats bowl, whey shake..." />
                <div className="grid gap-4 sm:grid-cols-2"><Input label="Calories" type="number" min="0" value={manualForm.calories} onChange={(e) => setManualForm((current) => ({ ...current, calories: e.target.value }))} placeholder="450" /><Input label="Protein (g)" type="number" min="0" value={manualForm.proteinGrams} onChange={(e) => setManualForm((current) => ({ ...current, proteinGrams: e.target.value }))} placeholder="30" /><Input label="Carbs (g)" type="number" min="0" value={manualForm.carbsGrams} onChange={(e) => setManualForm((current) => ({ ...current, carbsGrams: e.target.value }))} placeholder="55" /><Input label="Fats (g)" type="number" min="0" value={manualForm.fatsGrams} onChange={(e) => setManualForm((current) => ({ ...current, fatsGrams: e.target.value }))} placeholder="14" /></div>
                <Textarea label="Notes" rows={3} value={manualForm.notes} onChange={(e) => setManualForm((current) => ({ ...current, notes: e.target.value }))} />
                <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4"><Button variant="accent" onClick={() => void handleSaveManual()} isLoading={actionState === 'manual-save' || (editingLogId != null && actionState === `update-${editingLogId}`)}>{editingLogId ? 'Save Changes' : 'Add Manual Entry'}</Button>{(editingLogId || estimate) ? <Button variant="secondary" onClick={resetComposer}>Cancel</Button> : null}</div>
              </div>
            )}
          </Card>

          <div className="space-y-5">
            <Card variant="gradient" className="space-y-5 rounded-[1.6rem] p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Daily view</p><h2 className="mt-1 text-xl font-bold text-[#F7F7F7] sm:text-2xl">{formatDateLabel(selectedDate)}</h2></div><Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="max-w-full sm:max-w-[220px]" /></div>
              <div className="space-y-3">{dailyData?.entries.length ? dailyData.entries.map((entry) => <div key={entry.id} className="flex flex-col gap-4 rounded-2xl border border-[#2e303a] bg-[#11131d] p-4 lg:flex-row lg:items-center lg:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-[#00FF88]">{formatMealLabel(entry.mealType)}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8f97ab]">{entry.source ?? 'manual'}</span><p className="text-sm text-[#8f97ab]">{entry.calories} kcal</p></div><h3 className="text-lg font-semibold text-[#F7F7F7]">{entry.title}</h3>{entry.rawInput ? <p className="text-sm leading-6 text-[#8f97ab]">{entry.rawInput}</p> : null}<p className="text-sm text-[#98a3b8]">P {entry.proteinGrams ?? 0}g | C {entry.carbsGrams ?? 0}g | F {entry.fatsGrams ?? 0}g</p>{entry.parsedItems?.length ? <p className="text-xs uppercase tracking-[0.16em] text-[#8f97ab]">{entry.parsedItems.length} parsed items | {Math.round((entry.confidence ?? 0) * 100)}% confidence</p> : null}</div><div className="flex gap-3"><Button variant="secondary" size="sm" onClick={() => handleEdit(entry)}>Edit</Button><Button variant="secondary" size="sm" onClick={() => void handleDelete(entry)} isLoading={actionState === `delete-${entry.id}`}>Delete</Button></div></div>) : <div className="rounded-2xl border border-dashed border-[#2e303a] bg-[#10131d] p-6 text-sm leading-7 text-[#98a3b8]">{hasPremiumAccess ? 'No entries logged for this day yet. Use AI logging for speed or add your meals manually.' : 'No entries logged for this day yet. Start with the manual logger or upgrade to unlock faster AI meal estimation.'}</div>}</div>
            </Card>

            <Card variant="glass" className="space-y-5 rounded-[1.6rem] p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Monthly review</p><h2 className="mt-1 text-xl font-bold text-[#F7F7F7] sm:text-2xl">{selectedMonth}</h2></div><Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="max-w-full sm:max-w-[220px]" /></div>
              {monthlySummary ? <div className="space-y-5"><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['Target', `${displayMonthlyTargetCalories}`], ['Days logged', `${monthlySummary.daysLogged}/${monthlySummary.daysInMonth}`], ['Avg protein', `${monthlySummary.averageProteinGrams}g`], ['Entries', `${monthlySummary.entriesCount}`]].map(([label, value]) => <Card key={label} className="space-y-2 border-white/10 bg-[#0e1420] p-4"><p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">{label}</p><p className="text-2xl font-bold text-[#F7F7F7]">{value}</p></Card>)}</div><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f97ab]">Daily breakdown</p><div className="mt-4 space-y-3">{monthlySummary.dailyBreakdown.length ? monthlySummary.dailyBreakdown.slice().reverse().slice(0, 6).map((day) => <div key={day.date} className="flex items-center justify-between rounded-xl border border-[#2e303a] bg-[#0f1320] px-4 py-3"><div><p className="font-medium text-[#F7F7F7]">{formatDateLabel(day.date)}</p><p className="text-xs uppercase tracking-[0.16em] text-[#8f97ab]">{day.entryCount} entries</p></div><div className="text-right"><p className="font-semibold text-[#F7F7F7]">{day.calories} kcal</p></div></div>) : <p className="text-sm leading-7 text-[#98a3b8]">No monthly data yet.</p>}</div></div><div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f97ab]">Recommendations</p><p className="mt-2 text-sm text-[#98a3b8]">{hasPremiumAccess ? 'Use the built-in guidance or ask AI for a sharper monthly read.' : 'Use the built-in guidance below. Premium unlocks a deeper AI monthly review.'}</p></div>{hasPremiumAccess ? <Button variant="secondary" size="sm" onClick={() => void handleGenerateAiInsights()} isLoading={actionState === 'ai-insights'}>AI Review</Button> : <Button variant="secondary" size="sm" onClick={() => navigate('/billing')}>Unlock AI Review</Button>}</div><div className="mt-4 space-y-3">{monthlySummary.recommendations.map((item) => <div key={item} className="rounded-xl border border-[#2e303a] bg-[#0f1320] p-4 text-sm leading-6 text-[#d5d9e3]">{item}</div>)}{aiInsights ? <div className="rounded-xl border border-[#2e303a] bg-[#0f1320] p-4 text-sm leading-7 text-[#d5d9e3]">{aiInsights}</div> : !hasPremiumAccess ? <div className="rounded-xl border border-dashed border-[#2e303a] bg-[#0f1320] p-4 text-sm leading-7 text-[#98a3b8]">Premium adds an AI-written monthly review on top of these built-in recommendations.</div> : null}</div></div></div></div> : null}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
