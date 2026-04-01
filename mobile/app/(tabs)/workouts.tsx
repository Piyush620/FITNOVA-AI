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
import { trainingDayOptions, workoutExperienceOptions } from '@/constants/fitness';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatDateLabel, getWeekdayName } from '@/lib/calendar';
import { aiAPI, workoutsAPI } from '@/services/api';
import { useCalendarStore } from '@/stores/calendarStore';
import type { WorkoutPlan } from '@/types';

function getCompletionLabel(plan: WorkoutPlan) {
  const completedDays = plan.progress?.completedDays ?? plan.days.filter((day) => Boolean(day.completedAt)).length;
  const totalDays = plan.progress?.totalDays ?? plan.days.length;

  return `${completedDays}/${totalDays} days completed`;
}

type WorkoutGeneratorForm = {
  weight: string;
  goal: string;
  experience: (typeof workoutExperienceOptions)[number]['value'];
  trainingDaysPerWeek: (typeof trainingDayOptions)[number]['value'];
  equipment: string;
};

function buildWorkoutGeneratorForm(profile?: {
  weightKg?: number;
  goal?: string;
  activityLevel?: string;
}): WorkoutGeneratorForm {
  return {
    weight: profile?.weightKg ? `${Math.round(profile.weightKg)} kg` : '70 kg',
    goal: profile?.goal?.trim() || 'general fitness',
    experience:
      profile?.activityLevel === 'high' || profile?.activityLevel === 'very-active'
        ? 'intermediate'
        : 'beginner',
    trainingDaysPerWeek: '4',
    equipment: 'bodyweight and dumbbells',
  };
}

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [generatorForm, setGeneratorForm] = useState<WorkoutGeneratorForm>(() => buildWorkoutGeneratorForm(user?.profile));

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
      if (current.goal !== 'general fitness' || current.weight !== '70 kg' || current.equipment !== 'bodyweight and dumbbells') {
        return current;
      }

      return buildWorkoutGeneratorForm(user?.profile);
    });
  }, [user?.profile]);

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

  useFocusEffect(
    useMemo(
      () => () => {
        void loadPlans();
      },
      [],
    ),
  );

  const handleActivate = async (plan: WorkoutPlan) => {
    setActionKey(`activate:${plan.id}`);

    try {
      const hasProgress = (plan.progress?.completedDays ?? 0) > 0;
      const response = hasProgress
        ? await workoutsAPI.restartPlan(plan.id)
        : await workoutsAPI.activatePlan(plan.id);
      setActivePlan(response.data);
      await loadPlans();
      showToast({
        title: hasProgress ? 'Workout restarted' : 'Workout activated',
        message: hasProgress
          ? 'This plan was restored as a fresh training cycle.'
          : 'This plan is now your active training cycle.',
        tone: 'success',
      });
    } catch {
      showToast({ title: 'Activation failed', message: 'Please try again.', tone: 'danger' });
    } finally {
      setActionKey(null);
    }
  };

  const handleCompleteDay = async (planId: string, dayNumber: number) => {
    setActionKey(`complete:${planId}:${dayNumber}`);

    try {
      const response = await workoutsAPI.completeSession(planId, dayNumber, selectedDate);
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

  const handleGeneratePlan = async () => {
    if (!hasPremiumAccess) {
      showToast({
        title: 'Premium required',
        message: 'Upgrade this account to generate workout plans with AI.',
        tone: 'warning',
      });
      return;
    }

    setActionKey('generate');

    try {
      await aiAPI.generateAndSaveWorkoutPlan({
        weight: generatorForm.weight.trim(),
        goal: generatorForm.goal.trim(),
        experience: generatorForm.experience,
        trainingDaysPerWeek: Number(generatorForm.trainingDaysPerWeek),
        equipment: generatorForm.equipment.trim(),
      });

      await loadPlans();
      showToast({
        title: 'Workout plan generated',
        message: 'Your first AI workout plan is ready on mobile.',
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
        message: 'There are no saved workout plans yet.',
        tone: 'warning',
      });
      return;
    }

    setActionKey('reset-all');

    try {
      await Promise.all(plans.map((plan) => workoutsAPI.deletePlan(plan.id)));
      setActivePlan(null);
      await loadPlans();
      showToast({
        title: 'Workout plans reset',
        message: 'All saved workout plans were removed.',
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
        eyebrow="Train"
        title="Your workout plans"
        subtitle="Mobile now loads your real plans, active split, and day-completion actions."
      />

      <Panel style={styles.aiStatusPanel}>
        <AppText style={styles.planTitle}>AI workout planner</AppText>
        <AppText tone="muted">
          {hasPremiumAccess
            ? 'Premium is active. Generate and manage your AI workout plans here.'
            : 'Premium is needed to generate AI workout plans for this account.'}
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
        <LiveCalendar subtitle={`Workout synced for ${formatDateLabel(selectedDate)}`} />
      </Panel>

      <Panel>
        <AppText style={styles.planTitle}>Generate a workout plan</AppText>
        <AppText tone="muted">
          Tune the training split before you generate instead of relying on one fixed default.
        </AppText>
        <AppInput
          label="Weight"
          value={generatorForm.weight}
          onChangeText={(value) => setGeneratorForm((current) => ({ ...current, weight: value }))}
          placeholder="70 kg"
        />
        <AppInput
          label="Goal"
          value={generatorForm.goal}
          onChangeText={(value) => setGeneratorForm((current) => ({ ...current, goal: value }))}
          placeholder="Muscle gain, fat loss, strength..."
        />
        <OptionChips
          label="Experience"
          value={generatorForm.experience}
          options={[...workoutExperienceOptions]}
          onChange={(value) => setGeneratorForm((current) => ({ ...current, experience: value }))}
        />
        <OptionChips
          label="Training days"
          value={generatorForm.trainingDaysPerWeek}
          options={[...trainingDayOptions]}
          onChange={(value) => setGeneratorForm((current) => ({ ...current, trainingDaysPerWeek: value }))}
        />
        <AppInput
          label="Equipment"
          value={generatorForm.equipment}
          onChangeText={(value) => setGeneratorForm((current) => ({ ...current, equipment: value }))}
          placeholder="Bodyweight, dumbbells, gym machines..."
        />
        <AppText tone="muted" style={styles.generatorHint}>
          Use the quick AI card above for generation, then review the split details here.
        </AppText>
      </Panel>

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
                <AppButton onPress={() => void handleActivate(plan)} loading={actionKey === `activate:${plan.id}`}>
                  {(plan.progress?.completedDays ?? 0) > 0 ? 'Restore fresh' : 'Activate'}
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
          {selectedDay ? (() => {
            const isCompleted = Boolean(selectedDay.completedAt);

            return (
              <View key={`${selectedPlan.id}-${selectedDay.dayNumber}`} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <AppText style={styles.dayTitle}>{selectedDay.dayLabel}</AppText>
                    <AppText tone="muted">{selectedDay.focus}</AppText>
                    <AppText tone="muted">
                      {selectedDay.exercises.length} exercises
                      {selectedDay.durationMinutes ? ` | ${selectedDay.durationMinutes} min` : ''}
                    </AppText>
                  </View>
                  {!isCompleted && selectedPlan.status === 'active' ? (
                    <AppButton
                      variant="secondary"
                      onPress={() => void handleCompleteDay(selectedPlan.id, selectedDay.dayNumber)}
                      loading={actionKey === `complete:${selectedPlan.id}:${selectedDay.dayNumber}`}
                    >
                      Complete
                    </AppButton>
                  ) : (
                    <AppText tone={isCompleted ? 'success' : 'muted'}>
                      {isCompleted ? 'DONE' : 'UP NEXT'}
                    </AppText>
                  )}
                </View>
                {selectedDay.exercises.map((exercise, index) => (
                  <View key={`${exercise.name}-${index}`} style={styles.exerciseRow}>
                    <AppText>{exercise.name}</AppText>
                    <AppText tone="muted">{exercise.sets} x {exercise.reps}</AppText>
                  </View>
                ))}
              </View>
            );
          })() : (
            <AppText tone="muted">No workout block is scheduled for the selected calendar day.</AppText>
          )}
        </Panel>
      ) : (
        !loading && (
          <Panel>
            <AppText style={styles.emptyTitle}>No workout plans yet.</AppText>
            <AppText tone="muted">
              Use the generator above to create your first training split directly on mobile, then the delete option will also appear on each saved plan.
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
  generatorHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
