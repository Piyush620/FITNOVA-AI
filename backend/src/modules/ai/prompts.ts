import { GenerateDietPlanDto } from './dto/generate-diet-plan.dto';
import { GenerateWorkoutPlanDto } from './dto/generate-workout-plan.dto';

type AiProfileContext = {
  age?: number;
  gender?: string;
  goal?: string;
  activityLevel?: string;
};

type WorkoutContext = {
  title?: string;
  trainingDaysPerWeek?: number;
  averageWorkoutMinutes?: number;
  focusSummary?: string;
  days?: Array<{
    dayNumber: number;
    dayLabel: string;
    focus: string;
    durationMinutes?: number;
  }>;
};

export const workoutPrompt = (input: GenerateWorkoutPlanDto, profile?: AiProfileContext) =>
  `Generate a weekly workout plan for:
weight: ${input.weight}
goal: ${input.goal}
level: ${input.experience}
training days per week: ${input.trainingDaysPerWeek}
equipment: ${input.equipment}
age: ${profile?.age ?? 'not provided'}
gender: ${profile?.gender ?? 'not provided'}
activity level: ${profile?.activityLevel ?? 'not provided'}

Return a practical weekly schedule with exactly ${input.trainingDaysPerWeek} training days, plus recovery guidance for the remaining days.`;

const formatWorkoutContext = (workout?: WorkoutContext) =>
  workout
    ? `
active workout title: ${workout.title ?? 'not provided'}
active workout days per week: ${workout.trainingDaysPerWeek ?? 'not provided'}
average workout duration: ${workout.averageWorkoutMinutes ?? 'not provided'} minutes
workout split focus: ${workout.focusSummary ?? 'not provided'}
workout day map: ${
  workout.days?.length
    ? workout.days.map((day) => `${day.dayLabel} ${day.focus}`).join('; ')
    : 'not provided'
}`
    : `
active workout title: none
active workout days per week: none
average workout duration: none
workout split focus: none
workout day map: none`;

export const dietPrompt = (
  input: GenerateDietPlanDto,
  profile?: AiProfileContext,
  workout?: WorkoutContext,
) =>
  `Generate a daily Indian diet plan for:
goal: ${input.goal}
current weight: ${input.currentWeightKg} kg
target weight: ${input.targetWeightKg} kg
timeline: ${input.timelineWeeks} weeks
preference: ${input.preference}
cuisine region: ${input.cuisineRegion}
budget: ${input.budget}
gender: ${profile?.gender ?? 'not provided'}
${formatWorkoutContext(workout)}

Calculate a realistic daily calorie target and macro split based on the weight-change timeline.
Make the meal structure support the workout split, training frequency, and recovery demands when an active workout plan exists.
Return breakfast, lunch, dinner, snacks, hydration, and macro notes with Indian food suggestions matched to the selected cuisine region.`;

export const coachPrompt = (
  userData: Record<string, unknown>,
  message: string,
  recentContext?: string,
) =>
  `Act as a professional fitness coach and guide the user based on:
${JSON.stringify(userData, null, 2)}

Recent conversation context:
${recentContext || 'No prior coach messages.'}

User message:
${message}

Give concise, motivational, safe fitness advice and include a next best action.`;

export const structuredWorkoutPrompt = (input: GenerateWorkoutPlanDto, profile?: AiProfileContext) =>
  `Generate a weekly workout plan for:
weight: ${input.weight}
goal: ${input.goal}
level: ${input.experience}
training days per week: ${input.trainingDaysPerWeek}
equipment: ${input.equipment}
age: ${profile?.age ?? 'not provided'}
gender: ${profile?.gender ?? 'not provided'}
activity level: ${profile?.activityLevel ?? 'not provided'}

Important:
- adapt exercise selection, volume, recovery emphasis, and coaching cues appropriately for the provided age and gender when useful
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
- include exactly ${input.trainingDaysPerWeek} day entries
- keep dayNumber unique and in ascending order
- no markdown fences
- no prose outside JSON`;

export const structuredDietPrompt = (
  input: GenerateDietPlanDto,
  profile?: AiProfileContext,
  workout?: WorkoutContext,
) =>
  `Generate a daily Indian diet plan for:
goal: ${input.goal}
current weight: ${input.currentWeightKg} kg
target weight: ${input.targetWeightKg} kg
timeline: ${input.timelineWeeks} weeks
preference: ${input.preference}
cuisine region: ${input.cuisineRegion}
budget: ${input.budget}
gender: ${profile?.gender ?? 'not provided'}
${formatWorkoutContext(workout)}

Important:
- calculate a realistic targetCalories value from the current weight, target weight, and timeline
- keep the plan beginner-friendly and practical
- match meal suggestions to the selected cuisine region wherever possible
- adapt nutrition guidance appropriately for the provided gender when useful without relying on stereotypes
- when an active workout plan exists, shape calorie distribution, meal timing, and protein/carbs around the workout split and recovery demands

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

export const structuredCalorieEstimatePrompt = (
  input: {
    loggedDate: string;
    mealType: string;
    rawInput: string;
  },
  profile?: AiProfileContext,
) =>
  `Estimate nutrition for this food log:
date: ${input.loggedDate}
meal type: ${input.mealType}
user input: ${input.rawInput}
goal: ${profile?.goal ?? 'not provided'}
activity level: ${profile?.activityLevel ?? 'not provided'}
gender: ${profile?.gender ?? 'not provided'}

Return ONLY valid JSON with this shape:
{
  "title": "short readable meal title",
  "mealType": "breakfast | mid-morning | lunch | evening-snack | dinner | post-workout | other",
  "rawInput": "original user text",
  "confidence": 0.78,
  "calories": 620,
  "proteinGrams": 28,
  "carbsGrams": 72,
  "fatsGrams": 18,
  "notes": "brief estimation note",
  "parsedItems": [
    {
      "name": "string",
      "quantity": "string",
      "estimatedCalories": 220
    }
  ]
}

Constraints:
- no markdown fences
- no prose outside JSON
- calories must be between 0 and 4000
- proteinGrams, carbsGrams, fatsGrams must be between 0 and 400
- confidence must be between 0 and 1
- parsedItems must contain at least 1 item
- keep notes concise and estimation-focused`;
