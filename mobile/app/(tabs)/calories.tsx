import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { LiveCalendar } from '@/components/LiveCalendar';
import { OptionChips } from '@/components/OptionChips';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { mealTypeOptions } from '@/constants/fitness';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatDateLabel, formatMonthLabel, normalizeDate, normalizeMonth } from '@/lib/calendar';
import { aiAPI, caloriesAPI } from '@/services/api';
import { useCalendarStore } from '@/stores/calendarStore';
import { colors } from '@/theme/colors';
import type {
  CalorieEstimate,
  CalorieInsightsResponse,
  CalorieLog,
  DailyCalorieLogResponse,
  MonthlyCalorieSummary,
} from '@/types';

type ManualLogForm = {
  loggedDate: string;
  mealType: CalorieLog['mealType'];
  title: string;
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
  fatsGrams: string;
};

const initialForm = (): ManualLogForm => ({
  loggedDate: normalizeDate(),
  mealType: 'breakfast',
  title: '',
  calories: '',
  proteinGrams: '',
  carbsGrams: '',
  fatsGrams: '',
});

function formatMealType(type: CalorieLog['mealType']) {
  return type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function CaloriesScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const selectedMonth = useCalendarStore((state) => state.selectedMonth);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  const setSelectedMonth = useCalendarStore((state) => state.setSelectedMonth);
  const [dailyData, setDailyData] = useState<DailyCalorieLogResponse | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyCalorieSummary | null>(null);
  const [form, setForm] = useState<ManualLogForm>(initialForm);
  const [aiInput, setAiInput] = useState('');
  const [aiMealType, setAiMealType] = useState<CalorieLog['mealType']>('dinner');
  const [aiEstimate, setAiEstimate] = useState<CalorieEstimate | null>(null);
  const [aiInsights, setAiInsights] = useState<CalorieInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;

  const remainingCalories = useMemo(() => {
    if (!dailyData) {
      return '--';
    }

    return String(dailyData.targetCalories - dailyData.totals.calories);
  }, [dailyData]);
  const safeSelectedDate = useMemo(() => normalizeDate(selectedDate), [selectedDate]);
  const safeSelectedMonth = useMemo(() => normalizeMonth(selectedMonth), [selectedMonth]);

  const loadDaily = async (date = safeSelectedDate) => {
    setLoading(true);
    setError(null);

    try {
      const resolvedDate = normalizeDate(date);
      const response = await caloriesAPI.getDaily(resolvedDate);
      setDailyData(response.data);
    } catch {
      setError('Could not load calorie logs yet.');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlySummary = async (month = safeSelectedMonth) => {
    setMonthlyLoading(true);

    try {
      const resolvedMonth = normalizeMonth(month);
      const response = await caloriesAPI.getMonthlySummary(resolvedMonth);
      setMonthlySummary(response.data);
    } catch {
      setError('Could not load monthly calorie insights yet.');
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate !== safeSelectedDate) {
      setSelectedDate(safeSelectedDate);
      return;
    }

    void loadDaily(safeSelectedDate);
  }, [safeSelectedDate, selectedDate]);

  useEffect(() => {
    if (selectedMonth !== safeSelectedMonth) {
      setSelectedMonth(safeSelectedMonth);
      return;
    }

    void loadMonthlySummary(safeSelectedMonth);
  }, [safeSelectedMonth, selectedMonth]);

  useEffect(() => {
    setForm((current) => ({ ...current, loggedDate: safeSelectedDate }));
  }, [safeSelectedDate]);

  useFocusEffect(
    useMemo(
      () => () => {
        void Promise.all([loadDaily(safeSelectedDate), loadMonthlySummary(safeSelectedMonth)]);
      },
      [safeSelectedDate, safeSelectedMonth],
    ),
  );

  const handleCreateLog = async () => {
    const calories = Number(form.calories);

    if (!form.title.trim() || !Number.isFinite(calories) || calories <= 0) {
      showToast({
        title: 'Missing info',
        message: 'Add a title and valid calories first.',
        tone: 'warning',
      });
      return;
    }

    setActionKey('save');

    try {
      await caloriesAPI.createLog({
        loggedDate: normalizeDate(form.loggedDate),
        mealType: form.mealType,
        title: form.title.trim(),
        source: 'manual',
        calories,
        proteinGrams: form.proteinGrams ? Number(form.proteinGrams) : null,
        carbsGrams: form.carbsGrams ? Number(form.carbsGrams) : null,
        fatsGrams: form.fatsGrams ? Number(form.fatsGrams) : null,
        notes: null,
      });

      setForm(initialForm());
      const resolvedDate = normalizeDate(form.loggedDate);
      const resolvedMonth = normalizeMonth(resolvedDate.slice(0, 7));
      setSelectedDate(resolvedDate);
      setSelectedMonth(resolvedMonth);
      await Promise.all([loadDaily(resolvedDate), loadMonthlySummary(resolvedMonth)]);
      showToast({
        title: 'Saved',
        message: 'Calorie entry added.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Save failed',
        message: 'Please try again.',
        tone: 'danger',
      });
    } finally {
      setActionKey(null);
    }
  };

  const handleEstimateCalories = async () => {
    if (!hasPremiumAccess) {
      showToast({
        title: 'Premium required',
        message: 'Upgrade this account to unlock AI calorie estimates on mobile.',
        tone: 'warning',
      });
      router.push('/billing' as never);
      return;
    }

    if (!aiInput.trim()) {
      showToast({
        title: 'Add your meal',
        message: 'Describe what you ate first.',
        tone: 'warning',
      });
      return;
    }

    setActionKey('estimate');

    try {
      const response = await aiAPI.estimateCalories({
        loggedDate: safeSelectedDate,
        mealType: aiMealType,
        rawInput: aiInput.trim(),
      });

      setAiEstimate(response.data.estimate);
      showToast({
        title: 'AI estimate ready',
        message: 'Review it below and save it if it looks right.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Estimate failed',
        message: 'Please try again in a moment.',
        tone: 'danger',
      });
    } finally {
      setActionKey(null);
    }
  };

  const handleSaveEstimate = async () => {
    if (!aiEstimate) {
      return;
    }

    setActionKey('save-estimate');

    try {
      await caloriesAPI.createLog({
        loggedDate: aiEstimate.loggedDate,
        mealType: aiEstimate.mealType,
        title: aiEstimate.title,
        source: 'ai',
        calories: aiEstimate.calories,
        proteinGrams: aiEstimate.proteinGrams,
        carbsGrams: aiEstimate.carbsGrams,
        fatsGrams: aiEstimate.fatsGrams,
        notes: aiEstimate.notes ?? null,
      });

      const estimateDate = aiEstimate.loggedDate;
      const estimateMonth = normalizeMonth(estimateDate.slice(0, 7));
      setAiEstimate(null);
      setAiInput('');
      setSelectedDate(normalizeDate(estimateDate));
      setSelectedMonth(estimateMonth);
      await Promise.all([loadDaily(normalizeDate(estimateDate)), loadMonthlySummary(estimateMonth)]);
      showToast({
        title: 'AI entry saved',
        message: 'The estimated meal has been added to your log.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Save failed',
        message: 'Please try again.',
        tone: 'danger',
      });
    } finally {
      setActionKey(null);
    }
  };

  const handleGenerateMonthlyInsights = async () => {
    if (!hasPremiumAccess) {
      showToast({
        title: 'Premium required',
        message: 'Upgrade this account to unlock AI monthly calorie reviews.',
        tone: 'warning',
      });
      router.push('/billing' as never);
      return;
    }

    setActionKey('insights');

    try {
      const response = await aiAPI.getCalorieInsights(safeSelectedMonth);
      setAiInsights(response.data);
      showToast({
        title: 'Monthly review ready',
        message: 'Your AI calorie insights have been generated.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Could not generate review',
        message: 'Please try again in a moment.',
        tone: 'danger',
      });
    } finally {
      setActionKey(null);
    }
  };

  const handleDelete = async (entry: CalorieLog) => {
    setActionKey(`delete:${entry.id}`);

    try {
      await caloriesAPI.deleteLog(entry.id);
      await Promise.all([
        loadDaily(normalizeDate(entry.loggedDate)),
        loadMonthlySummary(normalizeMonth(entry.loggedDate.slice(0, 7))),
      ]);
      showToast({
        title: 'Removed',
        message: 'Calorie entry deleted.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Delete failed',
        message: 'Please try again.',
        tone: 'danger',
      });
    } finally {
      setActionKey(null);
    }
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Track"
        title="Daily calorie tracker"
        subtitle="Use selectors for meal logging, review daily totals, and get a monthly mobile summary in one place."
      />

      <Panel>
        <LiveCalendar showMonthControls />
      </Panel>

      <Panel>
        <AppText style={styles.metricTitle}>Today at a glance</AppText>
        <View style={styles.metricRow}>
          <AppText tone="muted">Target</AppText>
          <AppText>{dailyData?.targetCalories ?? '--'} kcal</AppText>
        </View>
        <View style={styles.metricRow}>
          <AppText tone="muted">Consumed</AppText>
          <AppText>{dailyData?.totals.calories ?? '--'} kcal</AppText>
        </View>
        <View style={styles.metricRow}>
          <AppText tone="muted">Remaining</AppText>
          <AppText>{remainingCalories} kcal</AppText>
        </View>
        {dailyData?.activeWorkoutDay ? (
          <AppText tone="muted">
            {dailyData.activeWorkoutDay.isTrainingDay
              ? `${dailyData.activeWorkoutDay.focus} day${dailyData.activeWorkoutDay.durationMinutes ? ` | ${dailyData.activeWorkoutDay.durationMinutes} min` : ''}${dailyData.activeWorkoutDay.isCompleted ? ' | completed' : ' | pending'}`
              : 'Recovery / rest day calorie target'}
          </AppText>
        ) : null}
      </Panel>

      <Panel>
        <AppText tone="accent" style={styles.kicker}>AI ESTIMATE</AppText>
        <AppText style={styles.metricTitle}>Describe a meal and let AI estimate it</AppText>
        <AppInput
          label="Date"
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
        />
        <OptionChips
          label="Meal type"
          value={aiMealType}
          options={mealTypeOptions}
          onChange={setAiMealType}
        />
        <TextInput
          multiline
          value={aiInput}
          onChangeText={setAiInput}
          style={[styles.input, styles.textarea]}
          placeholder="Describe what you ate..."
          placeholderTextColor={colors.textMuted}
          textAlignVertical="top"
        />
        <AppButton onPress={() => void handleEstimateCalories()} loading={actionKey === 'estimate'}>
          Estimate with AI
        </AppButton>

        {aiEstimate ? (
          <View style={styles.aiCard}>
            <AppText style={styles.aiTitle}>{aiEstimate.title}</AppText>
            <AppText tone="muted">
              {formatMealType(aiEstimate.mealType)} | confidence {(aiEstimate.confidence * 100).toFixed(0)}%
            </AppText>
            <View style={styles.metricRow}>
              <AppText tone="muted">Calories</AppText>
              <AppText>{aiEstimate.calories} kcal</AppText>
            </View>
            <View style={styles.metricRow}>
              <AppText tone="muted">Protein</AppText>
              <AppText>{aiEstimate.proteinGrams} g</AppText>
            </View>
            <View style={styles.metricRow}>
              <AppText tone="muted">Carbs</AppText>
              <AppText>{aiEstimate.carbsGrams} g</AppText>
            </View>
            <View style={styles.metricRow}>
              <AppText tone="muted">Fats</AppText>
              <AppText>{aiEstimate.fatsGrams} g</AppText>
            </View>
            {aiEstimate.parsedItems.length ? (
              <View style={styles.parsedList}>
                {aiEstimate.parsedItems.map((item, index) => (
                  <View key={`${item.name}-${index}`} style={styles.parsedItem}>
                    <AppText>{item.name}</AppText>
                    <AppText tone="muted">
                      {item.quantity ? `${item.quantity} | ` : ''}{item.estimatedCalories} kcal
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
            <AppButton onPress={() => void handleSaveEstimate()} loading={actionKey === 'save-estimate'}>
              Save AI estimate
            </AppButton>
          </View>
        ) : null}
      </Panel>

      <Panel>
        <AppText style={styles.metricTitle}>Add manual entry</AppText>
        <AppInput
          label="Date"
          value={form.loggedDate}
          onChangeText={(value) => setForm((current) => ({ ...current, loggedDate: value }))}
          placeholder="YYYY-MM-DD"
        />
        <OptionChips
          label="Meal type"
          value={form.mealType}
          options={mealTypeOptions}
          onChange={(value) => setForm((current) => ({ ...current, mealType: value }))}
        />
        <AppInput
          label="Meal title"
          value={form.title}
          onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
          placeholder="Paneer wrap, oats bowl..."
        />
        <AppInput
          label="Calories"
          value={form.calories}
          onChangeText={(value) => setForm((current) => ({ ...current, calories: value }))}
          keyboardType="numeric"
          placeholder="450"
        />
        <View style={styles.grid}>
          <View style={styles.cell}>
            <AppInput
              label="Protein"
              value={form.proteinGrams}
              onChangeText={(value) => setForm((current) => ({ ...current, proteinGrams: value }))}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>
          <View style={styles.cell}>
            <AppInput
              label="Carbs"
              value={form.carbsGrams}
              onChangeText={(value) => setForm((current) => ({ ...current, carbsGrams: value }))}
              keyboardType="numeric"
              placeholder="45"
            />
          </View>
          <View style={styles.cell}>
            <AppInput
              label="Fats"
              value={form.fatsGrams}
              onChangeText={(value) => setForm((current) => ({ ...current, fatsGrams: value }))}
              keyboardType="numeric"
              placeholder="12"
            />
          </View>
        </View>
        <AppButton onPress={() => void handleCreateLog()} loading={actionKey === 'save'}>Save entry</AppButton>
      </Panel>

      <Panel>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.headerTextBlock}>
            <AppText style={styles.metricTitle}>Monthly calorie insights</AppText>
            <AppText tone="muted">{formatMonthLabel(selectedMonth)}</AppText>
          </View>
          <View style={styles.monthInputWrap}>
            <AppInput
              label="Month"
              value={selectedMonth}
              onChangeText={setSelectedMonth}
              placeholder="YYYY-MM"
            />
          </View>
        </View>

        {monthlyLoading ? (
          <AppText tone="muted">Loading monthly summary...</AppText>
        ) : monthlySummary ? (
          <>
            <View style={styles.monthlyGrid}>
              <View style={styles.summaryCard}>
                <AppText tone="muted">Days logged</AppText>
                <AppText style={styles.summaryValue}>
                  {monthlySummary.daysLogged}/{monthlySummary.daysInMonth}
                </AppText>
              </View>
              <View style={styles.summaryCard}>
                <AppText tone="muted">Avg logged day</AppText>
                <AppText style={styles.summaryValue}>{monthlySummary.averageLoggedDayCalories} kcal</AppText>
              </View>
              <View style={styles.summaryCard}>
                <AppText tone="muted">Avg protein</AppText>
                <AppText style={styles.summaryValue}>{monthlySummary.averageProteinGrams} g</AppText>
              </View>
              <View style={styles.summaryCard}>
                <AppText tone="muted">Entries</AppText>
                <AppText style={styles.summaryValue}>{monthlySummary.entriesCount}</AppText>
              </View>
            </View>

            <View style={styles.recommendationBlock}>
              <View style={styles.recommendationHeader}>
                <AppText style={styles.subsectionTitle}>Built-in recommendations</AppText>
                <AppButton
                  variant="secondary"
                  onPress={() => void handleGenerateMonthlyInsights()}
                  loading={actionKey === 'insights'}
                >
                  {hasPremiumAccess ? 'AI Review' : 'Unlock AI'}
                </AppButton>
              </View>
              {monthlySummary.recommendations.map((item) => (
                <View key={item} style={styles.recommendationCard}>
                  <AppText>{item}</AppText>
                </View>
              ))}
              {aiInsights ? (
                <View style={styles.aiReviewCard}>
                  <AppText style={styles.subsectionTitle}>AI monthly review</AppText>
                  <AppText tone="muted">{aiInsights.content}</AppText>
                </View>
              ) : null}
            </View>

            <View style={styles.recommendationBlock}>
              <AppText style={styles.subsectionTitle}>Recent logged days</AppText>
              {monthlySummary.dailyBreakdown.length ? (
                monthlySummary.dailyBreakdown.slice(-6).reverse().map((day) => (
                  <View key={day.date} style={styles.dayBreakdownRow}>
                    <View>
                      <AppText>{formatDateLabel(day.date)}</AppText>
                      <AppText tone="muted">{day.entryCount} entries</AppText>
                    </View>
                    <AppText>{day.calories} kcal</AppText>
                  </View>
                ))
              ) : (
                <AppText tone="muted">No monthly data yet.</AppText>
              )}
            </View>
          </>
        ) : null}
      </Panel>

      {error ? (
        <Panel>
          <AppText>{error}</AppText>
        </Panel>
      ) : null}

      <Panel>
        <AppText style={styles.metricTitle}>Entries for {selectedDate}</AppText>
        <AppText tone="muted">
          {loading ? 'Loading entries...' : `Tracking for ${formatDateLabel(safeSelectedDate)}`}
        </AppText>
        {dailyData?.entries.length ? (
          dailyData.entries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryInfo}>
                <AppText>{entry.title}</AppText>
                <AppText tone="muted">
                  {formatMealType(entry.mealType)} | {entry.calories} kcal | {entry.source ?? 'manual'}
                </AppText>
              </View>
              <AppButton
                variant="secondary"
                onPress={() => void handleDelete(entry)}
                loading={actionKey === `delete:${entry.id}`}
              >
                Delete
              </AppButton>
            </View>
          ))
        ) : (
          !loading && <AppText tone="muted">No entries yet for this day.</AppText>
        )}
      </Panel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metricTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  subsectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderRow: {
    gap: 12,
  },
  headerTextBlock: {
    gap: 4,
  },
  monthInputWrap: {
    maxWidth: 180,
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#F6F7FB',
    paddingHorizontal: 14,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
  },
  aiCard: {
    marginTop: 4,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(53,208,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(53,208,255,0.16)',
    gap: 10,
  },
  aiTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  parsedList: {
    gap: 8,
  },
  parsedItem: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 2,
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    minWidth: 140,
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    gap: 6,
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  recommendationBlock: {
    gap: 10,
  },
  recommendationHeader: {
    gap: 10,
  },
  recommendationCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
  },
  aiReviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(53,208,255,0.18)',
    backgroundColor: 'rgba(53,208,255,0.08)',
    padding: 14,
    gap: 8,
  },
  dayBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    marginTop: 4,
  },
  entryInfo: {
    flex: 1,
    gap: 4,
  },
});
