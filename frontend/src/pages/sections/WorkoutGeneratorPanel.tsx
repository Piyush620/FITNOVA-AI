import React from 'react';

import { Button, Card, Input, Select } from '../../components/Common';
import type { GenerateWorkoutPlanPayload } from '../../types';

type WorkoutGeneratorPanelProps = {
  generatorError: string;
  generatorState: GenerateWorkoutPlanPayload;
  isGenerating: boolean;
  onGenerate: () => void;
  onReset: () => void;
  onStateChange: React.Dispatch<React.SetStateAction<GenerateWorkoutPlanPayload>>;
};

export const WorkoutGeneratorPanel: React.FC<WorkoutGeneratorPanelProps> = ({
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
        <h2 className="text-2xl font-bold text-[#F7F7F7]">AI Workout Generator</h2>
        <p className="mt-1 text-gray-400">
          Generate a structured workout plan and save it directly into your plans.
        </p>
      </div>
      <span className="text-sm text-gray-500">Uses your backend AI provider</span>
    </div>

    {generatorError ? (
      <div className="rounded-lg border border-[#FF6B00] bg-[#FF6B00]/10 p-4 text-[#FF6B00]">
        {generatorError}
      </div>
    ) : null}

    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Weight"
        placeholder="70 kg"
        value={generatorState.weight}
        onChange={(e) => onStateChange((current) => ({ ...current, weight: e.target.value }))}
      />
      <Input
        label="Goal"
        placeholder="Fat loss, muscle gain, strength..."
        value={generatorState.goal}
        onChange={(e) => onStateChange((current) => ({ ...current, goal: e.target.value }))}
      />
      <Select
        label="Experience"
        placeholder="Select your level"
        value={generatorState.experience}
        onChange={(e) => onStateChange((current) => ({ ...current, experience: e.target.value }))}
        options={[
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' },
        ]}
      />
      <Select
        label="Training Days Per Week"
        value={String(generatorState.trainingDaysPerWeek)}
        onChange={(e) =>
          onStateChange((current) => ({
            ...current,
            trainingDaysPerWeek: Number(e.target.value),
          }))
        }
        options={[
          { value: '3', label: '3 days' },
          { value: '4', label: '4 days' },
          { value: '5', label: '5 days' },
          { value: '6', label: '6 days' },
          { value: '7', label: '7 days' },
        ]}
      />
      <Input
        label="Equipment"
        placeholder="Dumbbells, bench, resistance bands, bodyweight"
        helperText="Use a comma-separated list or a short phrase."
        value={generatorState.equipment}
        onChange={(e) => onStateChange((current) => ({ ...current, equipment: e.target.value }))}
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
