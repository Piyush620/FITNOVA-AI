type CalorieTargetInput = {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  goal?: string;
  trainingDaysPerWeek?: number;
  averageWorkoutMinutes?: number;
};

const activityMultipliers: Array<{ match: string[]; value: number }> = [
  { match: ['sedentary', 'low'], value: 1.2 },
  { match: ['light'], value: 1.35 },
  { match: ['moderate'], value: 1.5 },
  { match: ['active', 'high'], value: 1.7 },
  { match: ['athlete', 'very active'], value: 1.85 },
];

const roundToNearest25 = (value: number) => Math.round(value / 25) * 25;
const normalizeGoal = (goal?: string) => goal?.toLowerCase() ?? '';

const resolveActivityMultiplier = (activityLevel?: string) => {
  const normalized = activityLevel?.toLowerCase() ?? '';
  const matched = activityMultipliers.find((entry) =>
    entry.match.some((token) => normalized.includes(token)),
  );

  return matched?.value ?? 1.5;
};

export const estimateGoalCalories = ({
  age,
  gender,
  heightCm,
  weightKg,
  activityLevel,
  goal,
  trainingDaysPerWeek,
  averageWorkoutMinutes,
}: CalorieTargetInput) => {
  const safeWeight = weightKg && weightKg > 0 ? weightKg : 70;
  const safeHeight = heightCm && heightCm > 0 ? heightCm : 170;
  const safeAge = age && age > 0 ? age : 28;
  const normalizedGender = gender?.toLowerCase() ?? '';
  const normalizedGoal = normalizeGoal(goal);
  const activityMultiplier = resolveActivityMultiplier(activityLevel);

  const bmr =
    normalizedGender.includes('female')
      ? 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161
      : 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5;

  const workoutDays = trainingDaysPerWeek && trainingDaysPerWeek > 0 ? trainingDaysPerWeek : 0;
  const averageMinutes =
    averageWorkoutMinutes && averageWorkoutMinutes > 0 ? averageWorkoutMinutes : 45;
  const workoutAdjustment =
    workoutDays > 0 ? Math.min(450, Math.max(75, workoutDays * 35 + Math.round(averageMinutes * 1.1))) : 0;
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

export const resolveGoalCalorieTarget = (
  profile: CalorieTargetInput,
  candidateTarget?: number | null,
) => {
  const estimatedTarget = estimateGoalCalories(profile);

  if (typeof candidateTarget !== 'number' || !Number.isFinite(candidateTarget) || candidateTarget <= 0) {
    return estimatedTarget;
  }

  const normalizedGoal = normalizeGoal(profile.goal);

  if (normalizedGoal.includes('fat') || normalizedGoal.includes('loss') || normalizedGoal.includes('cut')) {
    const minimum = Math.max(1400, estimatedTarget - 150);
    const maximum = Math.min(2800, estimatedTarget + 75);
    return roundToNearest25(Math.max(minimum, Math.min(maximum, candidateTarget)));
  }

  if (
    normalizedGoal.includes('muscle') ||
    normalizedGoal.includes('gain') ||
    normalizedGoal.includes('bulk')
  ) {
    const minimum = estimatedTarget - 125;
    const maximum = estimatedTarget + 300;
    return roundToNearest25(Math.max(minimum, Math.min(maximum, candidateTarget)));
  }

  const minimum = estimatedTarget - 175;
  const maximum = estimatedTarget + 175;
  return roundToNearest25(Math.max(minimum, Math.min(maximum, candidateTarget)));
};
