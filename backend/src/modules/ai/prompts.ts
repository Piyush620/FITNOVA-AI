import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';

export const workoutPrompt = (input: GenerateWorkoutPlanDto) =>
  `Generate a weekly workout plan for:
weight: ${input.weight}
goal: ${input.goal}
level: ${input.experience}
equipment: ${input.equipment}

Return a practical 7-day schedule with warm-up, main exercises, sets, reps, rest time, and recovery guidance.`;

export const dietPrompt = (input: GenerateDietPlanDto) =>
  `Generate a daily Indian diet plan for:
goal: ${input.goal}
calories: ${input.calories}
preference: ${input.preference}
budget: ${input.budget}

Return breakfast, lunch, dinner, snacks, hydration, and macro notes with Indian food suggestions.`;

export const coachPrompt = (userData: Record<string, unknown>, message: string) =>
  `Act as a professional fitness coach and guide the user based on:
${JSON.stringify(userData, null, 2)}

User message:
${message}

Give concise, motivational, safe fitness advice and include a next best action.`;
