type CalorieTargetInput = {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  goal?: string;
};

const activityMultipliers: Array<{ match: string[]; value: number }> = [
  { match: ['sedentary', 'low'], value: 1.2 },
  { match: ['light'], value: 1.35 },
  { match: ['moderate'], value: 1.5 },
  { match: ['active', 'high'], value: 1.7 },
  { match: ['athlete', 'very active'], value: 1.85 },
];

const roundToNearest25 = (value: number) => Math.round(value / 25) * 25;

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
}: CalorieTargetInput) => {
  const safeWeight = weightKg && weightKg > 0 ? weightKg : 70;
  const safeHeight = heightCm && heightCm > 0 ? heightCm : 170;
  const safeAge = age && age > 0 ? age : 28;
  const normalizedGender = gender?.toLowerCase() ?? '';
  const normalizedGoal = goal?.toLowerCase() ?? '';
  const activityMultiplier = resolveActivityMultiplier(activityLevel);

  const bmr =
    normalizedGender.includes('female')
      ? 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161
      : 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5;

  const maintenance = Math.max(1400, roundToNearest25(bmr * activityMultiplier));

  if (normalizedGoal.includes('fat') || normalizedGoal.includes('loss') || normalizedGoal.includes('cut')) {
    return Math.max(1400, roundToNearest25(maintenance - 350));
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
