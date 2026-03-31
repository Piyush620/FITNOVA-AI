import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { aiAPI, caloriesAPI } from '@/services/api';
import type { CalorieEstimate, CalorieLog, DailyCalorieLogResponse } from '@/types';

const today = () => new Date().toISOString().slice(0, 10);

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
  loggedDate: today(),
  mealType: 'breakfast',
  title: '',
  calories: '',
  proteinGrams: '',
  carbsGrams: '',
  fatsGrams: '',
});

export default function CaloriesScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [dailyData, setDailyData] = useState<DailyCalorieLogResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(today());
  const [form, setForm] = useState<ManualLogForm>(initialForm);
  const [aiInput, setAiInput] = useState('');
  const [aiMealType, setAiMealType] = useState<CalorieLog['mealType']>('dinner');
  const [aiEstimate, setAiEstimate] = useState<CalorieEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;

  const remainingCalories = useMemo(() => {
    if (!dailyData) {
      return '--';
    }

    return String(dailyData.targetCalories - dailyData.totals.calories);
  }, [dailyData]);

  const loadDaily = async (date = selectedDate) => {
    setLoading(true);
    setError(null);

    try {
      const response = await caloriesAPI.getDaily(date);
      setDailyData(response.data);
    } catch {
      setError('Could not load calorie logs yet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDaily(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setForm((current) => ({ ...current, loggedDate: selectedDate }));
  }, [selectedDate]);

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
        loggedDate: form.loggedDate,
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
      setSelectedDate(form.loggedDate);
      await loadDaily(form.loggedDate);
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
        loggedDate: selectedDate,
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

      setAiEstimate(null);
      setAiInput('');
      await loadDaily(aiEstimate.loggedDate);
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

  const handleDelete = async (entry: CalorieLog) => {
    setActionKey(`delete:${entry.id}`);

    try {
      await caloriesAPI.deleteLog(entry.id);
      await loadDaily(entry.loggedDate);
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
        subtitle="Manual logging, AI meal estimates, and live daily totals now work together on mobile."
      />

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
      </Panel>

      <Panel>
        <AppText tone="accent" style={styles.kicker}>AI ESTIMATE</AppText>
        <AppText style={styles.metricTitle}>Describe a meal and let AI estimate it</AppText>
        <AppText tone="muted">
          This is the missing AI option on mobile. Paste a meal like "2 rotis, paneer curry, dal and curd" and save the estimate if it looks right.
        </AppText>
        <TextInput
          value={selectedDate}
          onChangeText={setSelectedDate}
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#96A0B8"
        />
        <TextInput
          value={aiMealType}
          onChangeText={(value) => setAiMealType(value as CalorieLog['mealType'])}
          style={styles.input}
          placeholder="Meal type"
          placeholderTextColor="#96A0B8"
        />
        <TextInput
          multiline
          value={aiInput}
          onChangeText={setAiInput}
          style={[styles.input, styles.textarea]}
          placeholder="Describe what you ate..."
          placeholderTextColor="#96A0B8"
          textAlignVertical="top"
        />
        <AppButton onPress={() => void handleEstimateCalories()} loading={actionKey === 'estimate'}>
          Estimate with AI
        </AppButton>

        {aiEstimate ? (
          <View style={styles.aiCard}>
            <AppText style={styles.aiTitle}>{aiEstimate.title}</AppText>
            <AppText tone="muted">
              {aiEstimate.mealType} | confidence {(aiEstimate.confidence * 100).toFixed(0)}%
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
        <TextInput
          value={form.loggedDate}
          onChangeText={(value) => setForm((current) => ({ ...current, loggedDate: value }))}
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#96A0B8"
        />
        <TextInput
          value={form.mealType}
          onChangeText={(value) => setForm((current) => ({ ...current, mealType: value as CalorieLog['mealType'] }))}
          style={styles.input}
          placeholder="Meal type"
          placeholderTextColor="#96A0B8"
        />
        <TextInput
          value={form.title}
          onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
          style={styles.input}
          placeholder="Meal title"
          placeholderTextColor="#96A0B8"
        />
        <TextInput
          value={form.calories}
          onChangeText={(value) => setForm((current) => ({ ...current, calories: value }))}
          style={styles.input}
          placeholder="Calories"
          placeholderTextColor="#96A0B8"
          keyboardType="numeric"
        />
        <View style={styles.grid}>
          <TextInput value={form.proteinGrams} onChangeText={(value) => setForm((current) => ({ ...current, proteinGrams: value }))} style={[styles.input, styles.cell]} placeholder="Protein" placeholderTextColor="#96A0B8" keyboardType="numeric" />
          <TextInput value={form.carbsGrams} onChangeText={(value) => setForm((current) => ({ ...current, carbsGrams: value }))} style={[styles.input, styles.cell]} placeholder="Carbs" placeholderTextColor="#96A0B8" keyboardType="numeric" />
          <TextInput value={form.fatsGrams} onChangeText={(value) => setForm((current) => ({ ...current, fatsGrams: value }))} style={[styles.input, styles.cell]} placeholder="Fats" placeholderTextColor="#96A0B8" keyboardType="numeric" />
        </View>
        <AppButton onPress={() => void handleCreateLog()} loading={actionKey === 'save'}>Save entry</AppButton>
      </Panel>

      {error ? (
        <Panel>
          <AppText>{error}</AppText>
        </Panel>
      ) : null}

      <Panel>
        <AppText style={styles.metricTitle}>Entries for {selectedDate}</AppText>
        {loading ? <AppText tone="muted">Loading entries...</AppText> : null}
        {dailyData?.entries.length ? (
          dailyData.entries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryInfo}>
                <AppText>{entry.title}</AppText>
                <AppText tone="muted">{entry.mealType} | {entry.calories} kcal | {entry.source ?? 'manual'}</AppText>
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
