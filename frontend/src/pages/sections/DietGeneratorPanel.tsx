import React from 'react';

import { Button, Card, Input, Select } from '../../components/Common';
import type { GenerateDietPlanPayload, WorkoutPlan } from '../../types';

type DietGeneratorPanelProps = {
  activePlanTitle?: string | null;
  activeWorkoutPlan: WorkoutPlan | null;
  currentTrackerCalories: number;
  estimatedTrackerCalories: number;
  generatorError: string;
  generatorState: GenerateDietPlanPayload;
  isGenerating: boolean;
  onGenerate: () => void;
  onReset: () => void;
  onStateChange: React.Dispatch<React.SetStateAction<GenerateDietPlanPayload>>;
};

export const DietGeneratorPanel: React.FC<DietGeneratorPanelProps> = ({
  activePlanTitle,
  activeWorkoutPlan,
  currentTrackerCalories,
  estimatedTrackerCalories,
  generatorError,
  generatorState,
  isGenerating,
  onGenerate,
  onReset,
  onStateChange,
}) => (
  <Card variant="gradient" className="space-y-5">
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-[#F7F7F7]">AI Diet Generator</h2>
        <p className="mt-1 text-gray-400">
          Tell FitNova your current weight, goal weight, timeline, cuisine, and food preference. The AI will estimate calories and build the week for you.
        </p>
      </div>
      <span className="text-sm text-gray-500">Uses your backend AI provider</span>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div className="theme-subtle-panel rounded-2xl border p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Current tracker target</p>
        <p className="mt-2 text-2xl font-bold text-[#00FF88]">{currentTrackerCalories} kcal</p>
        <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
          {activePlanTitle ? 'This is coming from your active diet plan.' : 'This is your current goal-based estimate.'}
        </p>
      </div>
      <div className="theme-subtle-panel rounded-2xl border p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Goal-based estimate</p>
        <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{estimatedTrackerCalories} kcal</p>
        <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
          FitNova uses your profile goal, activity, and body stats before any diet plan exists.
        </p>
      </div>
      <div className="theme-subtle-panel rounded-2xl border p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">After plan is active</p>
        <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">Tracker updates</p>
        <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
          As soon as a diet plan is saved and active, the calorie tracker switches to that plan target automatically.
        </p>
      </div>
      <div className="theme-subtle-panel rounded-2xl border p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">Workout sync</p>
        <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">
          {activeWorkoutPlan ? `${activeWorkoutPlan.days.length} day split` : 'No active split'}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#aeb7cb]">
          {activeWorkoutPlan
            ? 'Diet generation follows your active workout split, giving training days more fuel and recovery support.'
            : 'Activate a workout split first if you want meal timing and day calories shaped around training demand.'}
        </p>
      </div>
    </div>

    {activeWorkoutPlan ? (
      <div className="theme-subtle-panel rounded-2xl border border-[#00FF88]/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FF88]">Active workout split</p>
        <p className="mt-2 text-sm leading-6 text-[#d5d9e3]">
          {activeWorkoutPlan.title}: {activeWorkoutPlan.days.map((day) => `${day.dayLabel} ${day.focus}`).join(', ')}.
        </p>
      </div>
    ) : null}

    {generatorError ? (
      <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
        {generatorError}
      </div>
    ) : null}

    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Goal"
        value={generatorState.goal}
        onChange={(e) => onStateChange((current) => ({ ...current, goal: e.target.value }))}
      />
      <Input
        label="Current Weight (kg)"
        type="number"
        min={30}
        max={300}
        value={generatorState.currentWeightKg}
        onChange={(e) =>
          onStateChange((current) => ({
            ...current,
            currentWeightKg: Number(e.target.value) || 0,
          }))
        }
      />
      <Input
        label="Target Weight (kg)"
        type="number"
        min={30}
        max={300}
        value={generatorState.targetWeightKg}
        onChange={(e) =>
          onStateChange((current) => ({
            ...current,
            targetWeightKg: Number(e.target.value) || 0,
          }))
        }
      />
      <Input
        label="Time To Reach Goal (weeks)"
        type="number"
        min={1}
        max={52}
        value={generatorState.timelineWeeks}
        onChange={(e) =>
          onStateChange((current) => ({
            ...current,
            timelineWeeks: Number(e.target.value) || 0,
          }))
        }
      />
      <Select
        label="Food Preference"
        value={generatorState.preference}
        onChange={(e) =>
          onStateChange((current) => ({
            ...current,
            preference: e.target.value as GenerateDietPlanPayload['preference'],
          }))
        }
        options={[
          { value: 'veg', label: 'Veg' },
          { value: 'non-veg', label: 'Non-veg' },
          { value: 'eggetarian', label: 'Eggetarian' },
        ]}
      />
      <Select
        label="Cuisine Style"
        value={generatorState.cuisineRegion}
        onChange={(e) =>
          onStateChange((current) => ({
            ...current,
            cuisineRegion: e.target.value as GenerateDietPlanPayload['cuisineRegion'],
          }))
        }
        options={[
          { value: 'north-indian', label: 'North Indian' },
          { value: 'south-indian', label: 'South Indian' },
          { value: 'east-indian', label: 'East Indian' },
          { value: 'west-indian', label: 'West Indian' },
          { value: 'mixed-indian', label: 'Mixed Indian' },
        ]}
      />
      <Select
        label="Budget"
        value={generatorState.budget}
        onChange={(e) =>
          onStateChange((current) => ({
            ...current,
            budget: e.target.value as GenerateDietPlanPayload['budget'],
          }))
        }
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
      />
    </div>

    <div className="flex flex-wrap gap-3">
      <Button onClick={onGenerate} isLoading={isGenerating}>
        Generate And Save Plan
      </Button>
      <Button variant="secondary" onClick={onReset} disabled={isGenerating}>
        Reset Form
      </Button>
    </div>
  </Card>
);
