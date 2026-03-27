import type { User } from '../types';

type ProfileInput = User['profile'];
type CalorieProfileInput = ProfileInput & {
  trainingDaysPerWeek?: number;
  averageWorkoutMinutes?: number;
};

const roundToNearest25 = (value: number) => Math.round(value / 25) * 25;
const normalizeGoal = (goal?: string) => goal?.toLowerCase() ?? '';

const resolveActivityMultiplier = (activityLevel?: string) => {
  const normalized = activityLevel?.toLowerCase() ?? '';

  if (normalized.includes('sedentary') || normalized.includes('low')) return 1.2;
  if (normalized.includes('light')) return 1.35;
  if (normalized.includes('active') || normalized.includes('high')) return 1.7;
  if (normalized.includes('athlete') || normalized.includes('very active')) return 1.85;
  return 1.5;
};

export const estimateGoalCalories = (profile?: CalorieProfileInput) => {
  const safeWeight = profile?.weightKg && profile.weightKg > 0 ? profile.weightKg : 70;
  const safeHeight = profile?.heightCm && profile.heightCm > 0 ? profile.heightCm : 170;
  const safeAge = profile?.age && profile.age > 0 ? profile.age : 28;
  const normalizedGender = profile?.gender?.toLowerCase() ?? '';
  const normalizedGoal = normalizeGoal(profile?.goal);
  const activityMultiplier = resolveActivityMultiplier(profile?.activityLevel);
  const workoutDays =
    typeof profile?.trainingDaysPerWeek === 'number' && profile.trainingDaysPerWeek > 0
      ? profile.trainingDaysPerWeek
      : 0;
  const averageWorkoutMinutes =
    typeof profile?.averageWorkoutMinutes === 'number' && profile.averageWorkoutMinutes > 0
      ? profile.averageWorkoutMinutes
      : 45;

  const bmr =
    normalizedGender.includes('female')
      ? 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161
      : 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5;

  const workoutAdjustment =
    workoutDays > 0
      ? Math.min(450, Math.max(75, workoutDays * 35 + Math.round(averageWorkoutMinutes * 1.1)))
      : 0;
  const maintenance = Math.max(1400, roundToNearest25(bmr * activityMultiplier + workoutAdjustment));

  if (normalizedGoal.includes('fat') || normalizedGoal.includes('loss') || normalizedGoal.includes('cut')) {
    const deficit = Math.max(400, maintenance * 0.18);
    return Math.min(2800, Math.max(1400, roundToNearest25(maintenance - deficit)));
  }

  if (
    normalizedGoal.includes('muscle') ||
    normalizedGoal.includes('gain') ||
    normalizedGoal.includes('bulk')
  ) {
    return roundToNearest25(maintenance + 250);
  }

  return maintenance;
};

export const resolveGoalCalorieTarget = (profile?: CalorieProfileInput, candidateTarget?: number | null) => {
  const estimatedTarget = estimateGoalCalories(profile);

  if (typeof candidateTarget !== 'number' || !Number.isFinite(candidateTarget) || candidateTarget <= 0) {
    return estimatedTarget;
  }

  const normalizedGoal = normalizeGoal(profile?.goal);

  if (normalizedGoal.includes('fat') || normalizedGoal.includes('loss') || normalizedGoal.includes('cut')) {
    return roundToNearest25(Math.max(Math.max(1400, estimatedTarget - 150), Math.min(Math.min(2800, estimatedTarget + 75), candidateTarget)));
  }

  if (
    normalizedGoal.includes('muscle') ||
    normalizedGoal.includes('gain') ||
    normalizedGoal.includes('bulk')
  ) {
    return roundToNearest25(Math.max(estimatedTarget - 125, Math.min(estimatedTarget + 300, candidateTarget)));
  }

  return roundToNearest25(Math.max(estimatedTarget - 175, Math.min(estimatedTarget + 175, candidateTarget)));
};
