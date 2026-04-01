import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { LiveCalendar } from '@/components/LiveCalendar';
import { OptionChips } from '@/components/OptionChips';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { dietBudgetOptions, dietCuisineOptions, dietPreferenceOptions } from '@/constants/fitness';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatDateLabel, getWeekdayName } from '@/lib/calendar';
import { aiAPI, dietAPI } from '@/services/api';
import { useCalendarStore } from '@/stores/calendarStore';
import type { DietPlan, Meal } from '@/types';

function formatMealType(type: Meal['type']) {
  return type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getCompletionLabel(plan: DietPlan) {
  const completedMeals =
    plan.progress?.completedMeals ??
    plan.days.reduce((sum, day) => sum + day.meals.filter((meal) => Boolean(meal.completedAt)).length, 0);
  const totalMeals = plan.progress?.totalMeals ?? plan.days.reduce((sum, day) => sum + day.meals.length, 0);

  return `${completedMeals}/${totalMeals} meals completed`;
}

type DietGeneratorForm = {
  goal: string;
  currentWeightKg: string;
  targetWeightKg: string;
  timelineWeeks: string;
  preference: (typeof dietPreferenceOptions)[number]['value'];
  cuisineRegion: (typeof dietCuisineOptions)[number]['value'];
  budget: (typeof dietBudgetOptions)[number]['value'];
};

function buildDietGeneratorForm(profile?: {
  goal?: string;
  weightKg?: number;
}): DietGeneratorForm {
  const currentWeightKg = profile?.weightKg ? Math.round(profile.weightKg) : 70;
  const goal = profile?.goal?.trim() || 'fat loss';
  const targetWeightKg =
    goal.toLowerCase().includes('gain') || goal.toLowerCase().includes('muscle')
      ? currentWeightKg + 3
      : Math.max(40, currentWeightKg - 5);

  return {
    goal,
    currentWeightKg: String(currentWeightKg),
    targetWeightKg: String(targetWeightKg),
    timelineWeeks: '12',
    preference: 'veg',
    cuisineRegion: 'mixed-indian',
    budget: 'medium',
  };
}

export default function DietScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [generatorForm, setGeneratorForm] = useState<DietGeneratorForm>(() => buildDietGeneratorForm(user?.profile));

  const selectedPlan = useMemo(
    () => activePlan ?? plans[0] ?? null,
    [activePlan, plans],
  );
  const selectedDay = useMemo(
    () => selectedPlan?.days.find((day) => day.dayLabel === getWeekdayName(selectedDate)) ?? null,
    [selectedDate, selectedPlan],
  );
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;

  useEffect(() => {
    setGeneratorForm((current) => {
      if (current.goal !== 'fat loss' || current.currentWeightKg !== '70' || current.targetWeightKg !== '65') {
        return current;
      }

      return buildDietGeneratorForm(user?.profile);
    });
  }, [user?.profile]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      const plansResponse = await dietAPI.listPlans(1, 6);
      setPlans(plansResponse.data.items);

      try {
        const activeResponse = await dietAPI.getActivePlan();
        setActivePlan(activeResponse.data);
      } catch {
        setActivePlan(plansResponse.data.items.find((plan) => plan.status === 'active') ?? null);
      }
    } catch {
      setError('Could not load diet plans yet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  useFocusEffect(
    useMemo(
      () => () => {
        void loadPlans();
      },
      [],
    ),
  );

  const handleActivate = async (plan: DietPlan) => {
    setActionKey(`activate:${plan.id}`);

    try {
      const hasProgress = (plan.progress?.completedMeals ?? 0) > 0;
      const response = hasProgress
        ? await dietAPI.restartPlan(plan.id)
        : await dietAPI.activatePlan(plan.id);
      setActivePlan(response.data);
      await loadPlans();
      showToast({
        title: hasProgress ? 'Diet restarted' : 'Diet activated',
        message: hasProgress
          ? 'This plan was restored as a fresh nutrition cycle.'
          : 'This plan is now your active nutrition cycle.',
        tone: 'success',
      });
    } catch {
      showToast({ title: 'Activation failed', message: 'Please try again.', tone: 'danger' });
    } finally {
      setActionKey(null);
    }
  };

  const handleCompleteMeal = async (planId: string, dayNumber: number, mealType: Meal['type']) => {
    setActionKey(`complete:${planId}:${dayNumber}:${mealType}`);

    try {
      const response = await dietAPI.completeMeal(planId, dayNumber, mealType, selectedDate);
      setActivePlan(response.data.status === 'active' || response.data.status === 'completed' ? response.data : null);
      await loadPlans();
      showToast({ title: 'Meal completed', message: `${formatMealType(mealType)} has been logged.`, tone: 'success' });
    } catch {
      showToast({ title: 'Could not complete meal', message: 'Please try again.', tone: 'danger' });
    } finally {
      setActionKey(null);
    }
  };

  const handleDeletePlan = async (planId: string, title: string) => {
    setActionKey(`delete:${planId}`);

    try {
      await dietAPI.deletePlan(planId);

      if (activePlan?.id === planId) {
        setActivePlan(null);
      }

      await loadPlans();
      showToast({ title: 'Plan deleted', message: `${title} was removed.`, tone: 'success' });
    } catch {
      showToast({ title: 'Delete failed', message: 'Please try again.', tone: 'danger' });
    } finally {
      setActionKey(null);
    }
  };

  const handleGeneratePlan = async () => {
    if (!hasPremiumAccess) {
      showToast({
        title: 'Premium required',
        message: 'Upgrade this account to generate diet plans with AI.',
        tone: 'warning',
      });
      return;
    }

    setActionKey('generate');

    try {
      const currentWeightKg = Number(generatorForm.currentWeightKg);
      const targetWeightKg = Number(generatorForm.targetWeightKg);
      const timelineWeeks = Number(generatorForm.timelineWeeks);

      await aiAPI.generateAndSaveDietPlan({
        goal: generatorForm.goal.trim(),
        currentWeightKg,
        targetWeightKg,
        timelineWeeks,
        preference: generatorForm.preference,
        cuisineRegion: generatorForm.cuisineRegion,
        budget: generatorForm.budget,
      });

      await loadPlans();
      showToast({
        title: 'Diet plan generated',
        message: 'Your first AI diet plan is ready on mobile.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Generation failed',
        message: 'Please try again in a moment.',
        tone: 'danger',
      });
    } finally {
      setActionKey(null);
    }
  };

  const handleResetPlans = async () => {
    if (!plans.length) {
      showToast({
        title: 'Nothing to reset',
        message: 'There are no saved diet plans yet.',
        tone: 'warning',
      });
      return;
    }

    setActionKey('reset-all');

    try {
      await Promise.all(plans.map((plan) => dietAPI.deletePlan(plan.id)));
      setActivePlan(null);
      await loadPlans();
      showToast({
        title: 'Diet plans reset',
        message: 'All saved diet plans were removed.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Reset failed',
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
        eyebrow="Fuel"
        title="Your diet plans"
        subtitle="Mobile now loads your real diet plans, active nutrition cycle, and meal completion actions."
      />

      <Panel style={styles.aiStatusPanel}>
        <AppText style={styles.planTitle}>AI diet planner</AppText>
        <AppText tone="muted">
          {hasPremiumAccess
            ? 'Premium is active. Generate and manage your AI diet plans here.'
            : 'Premium is needed to generate AI diet plans for this account.'}
        </AppText>
        <View style={styles.inlineActions}>
          {!hasPremiumAccess ? (
            <AppButton variant="secondary" onPress={() => router.push('/billing' as never)}>
              Unlock premium
            </AppButton>
          ) : null}
          <AppButton onPress={() => void handleGeneratePlan()} loading={actionKey === 'generate'}>
            Generate with AI
          </AppButton>
          <AppButton
            variant="secondary"
            onPress={() => void handleResetPlans()}
            loading={actionKey === 'reset-all'}
            disabled={!plans.length}
          >
            Reset plans
          </AppButton>
        </View>
      </Panel>

      <View style={styles.actions}>
        <AppButton variant="secondary" onPress={() => void loadPlans()} loading={loading}>Refresh</AppButton>
      </View>

      <Panel>
        <LiveCalendar subtitle={`Diet synced for ${formatDateLabel(selectedDate)}`} />
      </Panel>

      <Panel>
        <AppText style={styles.planTitle}>Generate a diet plan</AppText>
        <AppText tone="muted">
          Adjust the nutrition target, food preference, region, and budget before the AI builds your plan.
        </AppText>
        <AppInput
          label="Goal"
          value={generatorForm.goal}
          onChangeText={(value) => setGeneratorForm((current) => ({ ...current, goal: value }))}
          placeholder="Fat loss, muscle gain, maintenance..."
        />
        <View style={styles.grid}>
          <View style={styles.gridCell}>
            <AppInput
              label="Current weight"
              value={generatorForm.currentWeightKg}
              onChangeText={(value) => setGeneratorForm((current) => ({ ...current, currentWeightKg: value }))}
              keyboardType="numeric"
              placeholder="70"
            />
          </View>
          <View style={styles.gridCell}>
            <AppInput
              label="Target weight"
              value={generatorForm.targetWeightKg}
              onChangeText={(value) => setGeneratorForm((current) => ({ ...current, targetWeightKg: value }))}
              keyboardType="numeric"
              placeholder="65"
            />
          </View>
        </View>
        <AppInput
          label="Timeline"
          value={generatorForm.timelineWeeks}
          onChangeText={(value) => setGeneratorForm((current) => ({ ...current, timelineWeeks: value }))}
          keyboardType="numeric"
          placeholder="12"
          hint="Weeks until the target weight."
        />
        <OptionChips
          label="Preference"
          value={generatorForm.preference}
          options={[...dietPreferenceOptions]}
          onChange={(value) => setGeneratorForm((current) => ({ ...current, preference: value }))}
        />
        <OptionChips
          label="Cuisine"
          value={generatorForm.cuisineRegion}
          options={[...dietCuisineOptions]}
          onChange={(value) => setGeneratorForm((current) => ({ ...current, cuisineRegion: value }))}
        />
        <OptionChips
          label="Budget"
          value={generatorForm.budget}
          options={[...dietBudgetOptions]}
          onChange={(value) => setGeneratorForm((current) => ({ ...current, budget: value }))}
        />
        <AppText tone="muted" style={styles.generatorHint}>
          Use the quick AI card above for generation, then manage the plan details here.
        </AppText>
      </Panel>

      {error ? (
        <Panel>
          <AppText>{error}</AppText>
        </Panel>
      ) : null}

      {loading ? (
        <Panel>
          <AppText tone="muted">Loading diet plans...</AppText>
        </Panel>
      ) : null}

      {plans.map((plan) => (
        <Panel key={plan.id}>
          <AppText style={styles.planTitle}>{plan.title}</AppText>
          <AppText tone="muted">{plan.goal}</AppText>
          <AppText tone="muted">{getCompletionLabel(plan)}</AppText>
          <AppText tone="muted">
            {plan.targetCalories ? `${plan.targetCalories} kcal target` : 'AI-derived daily calories'}
          </AppText>
          <View style={styles.row}>
            <View style={[styles.statusPill, plan.status === 'active' ? styles.statusActive : styles.statusIdle]}>
              <AppText tone={plan.status === 'active' ? 'success' : 'muted'} style={styles.statusText}>{plan.status.toUpperCase()}</AppText>
            </View>
            <View style={styles.planActions}>
              {plan.status !== 'active' ? (
                <AppButton onPress={() => void handleActivate(plan)} loading={actionKey === `activate:${plan.id}`}>
                  {(plan.progress?.completedMeals ?? 0) > 0 ? 'Restore fresh' : 'Activate'}
                </AppButton>
              ) : null}
              <AppButton variant="secondary" onPress={() => void handleDeletePlan(plan.id, plan.title)} loading={actionKey === `delete:${plan.id}`}>
                Delete
              </AppButton>
            </View>
          </View>
        </Panel>
      ))}

      {selectedPlan ? (
        <Panel>
          <AppText style={styles.planTitle}>Current nutrition plan: {selectedPlan.title}</AppText>
          {selectedDay ? (
            <View key={`${selectedPlan.id}-${selectedDay.dayNumber}`} style={styles.dayCard}>
              <AppText style={styles.dayTitle}>{selectedDay.dayLabel}</AppText>
              {selectedDay.theme ? <AppText tone="muted">{selectedDay.theme}</AppText> : null}
              {selectedDay.targetCalories ? <AppText tone="muted">{selectedDay.targetCalories} kcal target</AppText> : null}
              {selectedDay.meals.map((meal) => {
                const isCompleted = Boolean(meal.completedAt);

                return (
                  <View key={`${selectedDay.dayNumber}-${meal.type}`} style={styles.mealRow}>
                    <View style={styles.mealInfo}>
                      <AppText>{formatMealType(meal.type)}</AppText>
                      <AppText tone="muted">{meal.title}</AppText>
                      <AppText tone="muted">
                        {meal.calories != null ? `${meal.calories} kcal` : 'Calories not set'}
                      </AppText>
                    </View>
                    {!isCompleted && selectedPlan.status === 'active' ? (
                      <AppButton
                        variant="secondary"
                        onPress={() => void handleCompleteMeal(selectedPlan.id, selectedDay.dayNumber, meal.type)}
                        loading={actionKey === `complete:${selectedPlan.id}:${selectedDay.dayNumber}:${meal.type}`}
                      >
                        Complete
                      </AppButton>
                    ) : (
                      <AppText tone={isCompleted ? 'success' : 'muted'}>
                        {isCompleted ? 'DONE' : 'PLANNED'}
                      </AppText>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <AppText tone="muted">No meal block is scheduled for the selected calendar day.</AppText>
          )}
        </Panel>
      ) : (
        !loading && (
          <Panel>
            <AppText style={styles.emptyTitle}>No diet plans yet.</AppText>
            <AppText tone="muted">
              Use the generator above to create your first nutrition plan directly on mobile, then the delete option will appear on saved plans too.
            </AppText>
          </Panel>
        )
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'flex-start',
  },
  aiStatusPanel: {
    gap: 14,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  planActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  planTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(0,226,138,0.09)',
    borderColor: 'rgba(0,226,138,0.22)',
  },
  statusIdle: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  dayCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginTop: 6,
    gap: 10,
  },
  dayTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  mealInfo: {
    flex: 1,
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCell: {
    flex: 1,
  },
  generatorHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
