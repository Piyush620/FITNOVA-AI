import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';

type AiProfileContext = {
  gender?: string;
  goal?: string;
  activityLevel?: string;
};

export const workoutPrompt = (input: GenerateWorkoutPlanDto, profile?: AiProfileContext) =>
  `Generate a weekly workout plan for:
weight: ${input.weight}
goal: ${input.goal}
level: ${input.experience}
equipment: ${input.equipment}
gender: ${profile?.gender ?? 'not provided'}
activity level: ${profile?.activityLevel ?? 'not provided'}

Return a practical 7-day schedule with warm-up, main exercises, sets, reps, rest time, and recovery guidance.`;

export const dietPrompt = (input: GenerateDietPlanDto, profile?: AiProfileContext) =>
  `Generate a daily Indian diet plan for:
goal: ${input.goal}
current weight: ${input.currentWeightKg} kg
target weight: ${input.targetWeightKg} kg
timeline: ${input.timelineWeeks} weeks
preference: ${input.preference}
cuisine region: ${input.cuisineRegion}
budget: ${input.budget}
gender: ${profile?.gender ?? 'not provided'}

Calculate a realistic daily calorie target and macro split based on the weight-change timeline.
Return breakfast, lunch, dinner, snacks, hydration, and macro notes with Indian food suggestions matched to the selected cuisine region.`;

export const coachPrompt = (userData: Record<string, unknown>, message: string) =>
  `Act as a professional fitness coach and guide the user based on:
${JSON.stringify(userData, null, 2)}

User message:
${message}

Give concise, motivational, safe fitness advice and include a next best action.`;

export const structuredWorkoutPrompt = (input: GenerateWorkoutPlanDto, profile?: AiProfileContext) =>
  `Generate a weekly workout plan for:
weight: ${input.weight}
goal: ${input.goal}
level: ${input.experience}
equipment: ${input.equipment}
gender: ${profile?.gender ?? 'not provided'}
activity level: ${profile?.activityLevel ?? 'not provided'}

Important:
- adapt exercise selection, recovery emphasis, and coaching cues appropriately for the provided gender when useful
- avoid stereotypes and keep the plan goal-driven, safe, and practical

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

export const structuredDietPrompt = (input: GenerateDietPlanDto, profile?: AiProfileContext) =>
  `Generate a daily Indian diet plan for:
goal: ${input.goal}
current weight: ${input.currentWeightKg} kg
target weight: ${input.targetWeightKg} kg
timeline: ${input.timelineWeeks} weeks
preference: ${input.preference}
cuisine region: ${input.cuisineRegion}
budget: ${input.budget}
gender: ${profile?.gender ?? 'not provided'}

Important:
- calculate a realistic targetCalories value from the current weight, target weight, and timeline
- keep the plan beginner-friendly and practical
- match meal suggestions to the selected cuisine region wherever possible
- adapt nutrition guidance appropriately for the provided gender when useful without relying on stereotypes

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
- include exactly 7 day entries
- use dayNumber 1 through 7 in ascending order
- use real weekday labels Monday through Sunday
- each day must include at least breakfast, lunch, evening-snack, and dinner
- use a targetCalories value between 1200 and 4000
- no markdown fences
- no prose outside JSON`;
