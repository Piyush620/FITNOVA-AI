import type { CalorieLog } from '@/types';

export const mealTypeOptions: Array<{ label: string; value: CalorieLog['mealType'] }> = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Mid-Morning', value: 'mid-morning' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Evening Snack', value: 'evening-snack' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Post-Workout', value: 'post-workout' },
  { label: 'Other', value: 'other' },
];

export const workoutExperienceOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
] as const;

export const trainingDayOptions = [
  { label: '3 days', value: '3' },
  { label: '4 days', value: '4' },
  { label: '5 days', value: '5' },
  { label: '6 days', value: '6' },
] as const;

export const dietPreferenceOptions = [
  { label: 'Veg', value: 'veg' },
  { label: 'Non-Veg', value: 'non-veg' },
  { label: 'Eggetarian', value: 'eggetarian' },
] as const;

export const dietCuisineOptions = [
  { label: 'Mixed', value: 'mixed-indian' },
  { label: 'North', value: 'north-indian' },
  { label: 'South', value: 'south-indian' },
  { label: 'East', value: 'east-indian' },
  { label: 'West', value: 'west-indian' },
] as const;

export const dietBudgetOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
] as const;
