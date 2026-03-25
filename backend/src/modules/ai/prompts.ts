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

export const structuredWorkoutPrompt = (input: GenerateWorkoutPlanDto) =>
  `Generate a weekly workout plan for:
weight: ${input.weight}
goal: ${input.goal}
level: ${input.experience}
equipment: ${input.equipment}

Return ONLY valid JSON with this shape:
{
  "title": "string",
  "goal": "string",
  "level": "string",
  "equipment": ["string"],
  "activateNow": true,
  "isAiGenerated": true,
  "notes": "string",
  "days": [
    {
      "dayNumber": 1,
      "dayLabel": "Monday",
      "focus": "string",
      "durationMinutes": 60,
      "exercises": [
        {
          "name": "string",
          "muscleGroup": "string",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "equipment": "string",
          "notes": "string"
        }
      ]
    }
  ]
}

Constraints:
- include 4 to 7 day entries
- keep dayNumber unique and in ascending order
- no markdown fences
- no prose outside JSON`;

export const structuredDietPrompt = (input: GenerateDietPlanDto) =>
  `Generate a daily Indian diet plan for:
goal: ${input.goal}
calories: ${input.calories}
preference: ${input.preference}
budget: ${input.budget}

Return ONLY valid JSON with this shape:
{
  "title": "string",
  "goal": "string",
  "preference": "veg | non-veg | eggetarian",
  "targetCalories": 2200,
  "activateNow": true,
  "isAiGenerated": true,
  "notes": "string",
  "days": [
    {
      "dayNumber": 1,
      "dayLabel": "Monday",
      "theme": "string",
      "targetCalories": 2200,
      "meals": [
        {
          "type": "breakfast | mid-morning | lunch | evening-snack | dinner | post-workout",
          "title": "string",
          "description": "string",
          "items": ["string"],
          "calories": 400,
          "proteinGrams": 25,
          "carbsGrams": 40,
          "fatsGrams": 12
        }
      ]
    }
  ]
}

Constraints:
- include 1 to 3 day entries
- no markdown fences
- no prose outside JSON`;
