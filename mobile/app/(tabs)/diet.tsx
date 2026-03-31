import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useToast } from '@/hooks/useToast';
import { dietAPI } from '@/services/api';
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

export default function DietScreen() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const selectedPlan = useMemo(
    () => activePlan ?? plans[0] ?? null,
    [activePlan, plans],
  );

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

  const handleActivate = async (planId: string) => {
    setActionKey(`activate:${planId}`);

    try {
      const response = await dietAPI.activatePlan(planId);
      setActivePlan(response.data);
      await loadPlans();
      showToast({ title: 'Diet activated', message: 'This plan is now your active nutrition cycle.', tone: 'success' });
    } catch {
      showToast({ title: 'Activation failed', message: 'Please try again.', tone: 'danger' });
    } finally {
      setActionKey(null);
    }
  };

  const handleCompleteMeal = async (planId: string, dayNumber: number, mealType: Meal['type']) => {
    setActionKey(`complete:${planId}:${dayNumber}:${mealType}`);

    try {
      const response = await dietAPI.completeMeal(planId, dayNumber, mealType);
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

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Fuel"
        title="Your diet plans"
        subtitle="Mobile now loads your real diet plans, active nutrition cycle, and meal completion actions."
      />

      <View style={styles.actions}>
        <AppButton variant="secondary" onPress={() => void loadPlans()} loading={loading}>Refresh</AppButton>
      </View>

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
                <AppButton onPress={() => void handleActivate(plan.id)} loading={actionKey === `activate:${plan.id}`}>
                  Activate
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
          {selectedPlan.days.map((day) => (
            <View key={`${selectedPlan.id}-${day.dayNumber}`} style={styles.dayCard}>
              <AppText style={styles.dayTitle}>{day.dayLabel}</AppText>
              {day.theme ? <AppText tone="muted">{day.theme}</AppText> : null}
              {day.targetCalories ? <AppText tone="muted">{day.targetCalories} kcal target</AppText> : null}
              {day.meals.map((meal) => {
                const isCompleted = Boolean(meal.completedAt);

                return (
                  <View key={`${day.dayNumber}-${meal.type}`} style={styles.mealRow}>
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
                        onPress={() => void handleCompleteMeal(selectedPlan.id, day.dayNumber, meal.type)}
                        loading={actionKey === `complete:${selectedPlan.id}:${day.dayNumber}:${meal.type}`}
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
          ))}
        </Panel>
      ) : (
        !loading && (
          <Panel>
            <AppText tone="muted">No diet plans found for this account yet.</AppText>
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
});
