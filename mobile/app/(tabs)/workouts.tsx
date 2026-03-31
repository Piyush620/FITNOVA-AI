import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useToast } from '@/hooks/useToast';
import { workoutsAPI } from '@/services/api';
import type { WorkoutPlan } from '@/types';

function getCompletionLabel(plan: WorkoutPlan) {
  const completedDays = plan.progress?.completedDays ?? plan.days.filter((day) => Boolean(day.completedAt)).length;
  const totalDays = plan.progress?.totalDays ?? plan.days.length;

  return `${completedDays}/${totalDays} days completed`;
}

export default function WorkoutsScreen() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
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
      const plansResponse = await workoutsAPI.listPlans(1, 6);
      setPlans(plansResponse.data.items);

      try {
        const activeResponse = await workoutsAPI.getActivePlan();
        setActivePlan(activeResponse.data);
      } catch {
        setActivePlan(plansResponse.data.items.find((plan) => plan.status === 'active') ?? null);
      }
    } catch {
      setError('Could not load workout plans yet.');
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
      const response = await workoutsAPI.activatePlan(planId);
      setActivePlan(response.data);
      await loadPlans();
      showToast({ title: 'Workout activated', message: 'This plan is now your active training cycle.', tone: 'success' });
    } catch {
      showToast({ title: 'Activation failed', message: 'Please try again.', tone: 'danger' });
    } finally {
      setActionKey(null);
    }
  };

  const handleCompleteDay = async (planId: string, dayNumber: number) => {
    setActionKey(`complete:${planId}:${dayNumber}`);

    try {
      const response = await workoutsAPI.completeSession(planId, dayNumber);
      setActivePlan(response.data.status === 'active' || response.data.status === 'completed' ? response.data : null);
      await loadPlans();
      showToast({ title: 'Nice work', message: `Day ${dayNumber} has been marked complete.`, tone: 'success' });
    } catch {
      showToast({ title: 'Could not complete day', message: 'Please try again.', tone: 'danger' });
    } finally {
      setActionKey(null);
    }
  };

  const handleDeletePlan = async (planId: string, title: string) => {
    setActionKey(`delete:${planId}`);

    try {
      await workoutsAPI.deletePlan(planId);

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
        eyebrow="Train"
        title="Your workout plans"
        subtitle="Mobile now loads your real plans, active split, and day-completion actions."
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
          <AppText tone="muted">Loading workout plans...</AppText>
        </Panel>
      ) : null}

      {plans.map((plan) => (
        <Panel key={plan.id}>
          <AppText style={styles.planTitle}>{plan.title}</AppText>
          <AppText tone="muted">{plan.goal}</AppText>
          <AppText tone="muted">{getCompletionLabel(plan)}</AppText>
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
          <AppText style={styles.planTitle}>Current focus: {selectedPlan.title}</AppText>
          {selectedPlan.days.map((day) => {
            const isCompleted = Boolean(day.completedAt);

            return (
              <View key={`${selectedPlan.id}-${day.dayNumber}`} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <AppText style={styles.dayTitle}>{day.dayLabel}</AppText>
                    <AppText tone="muted">{day.focus}</AppText>
                    <AppText tone="muted">
                      {day.exercises.length} exercises
                      {day.durationMinutes ? ` | ${day.durationMinutes} min` : ''}
                    </AppText>
                  </View>
                  {!isCompleted && selectedPlan.status === 'active' ? (
                    <AppButton
                      variant="secondary"
                      onPress={() => void handleCompleteDay(selectedPlan.id, day.dayNumber)}
                      loading={actionKey === `complete:${selectedPlan.id}:${day.dayNumber}`}
                    >
                      Complete
                    </AppButton>
                  ) : (
                    <AppText tone={isCompleted ? 'success' : 'muted'}>
                      {isCompleted ? 'DONE' : 'UP NEXT'}
                    </AppText>
                  )}
                </View>
                {day.exercises.map((exercise, index) => (
                  <View key={`${exercise.name}-${index}`} style={styles.exerciseRow}>
                    <AppText>{exercise.name}</AppText>
                    <AppText tone="muted">{exercise.sets} x {exercise.reps}</AppText>
                  </View>
                ))}
              </View>
            );
          })}
        </Panel>
      ) : (
        !loading && (
          <Panel>
            <AppText tone="muted">No workout plans found for this account yet.</AppText>
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  dayInfo: {
    flex: 1,
    gap: 4,
  },
  dayTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  exerciseRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 4,
  },
});
