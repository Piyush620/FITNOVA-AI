import React from 'react';

import { Button, Card, Input, PremiumFeatureGate, Select, Textarea } from '../../components/Common';
import type { CalorieEstimate, CalorieLog } from '../../types';

type ManualForm = {
  loggedDate: string;
  mealType: CalorieLog['mealType'];
  title: string;
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
  fatsGrams: string;
  notes: string;
};

type CaloriesComposerPanelProps = {
  actionState: string | null;
  aiMealText: string;
  aiMealType: CalorieLog['mealType'];
  editingLogId: string | null;
  estimate: CalorieEstimate | null;
  hasPremiumAccess: boolean;
  manualForm: ManualForm;
  mealTypeOptions: Array<{ value: string; label: string }>;
  mode: 'ai' | 'manual';
  onAiMealTextChange: (value: string) => void;
  onAiMealTypeChange: (value: CalorieLog['mealType']) => void;
  onEstimate: () => void;
  onManualFormChange: React.Dispatch<React.SetStateAction<ManualForm>>;
  onModeChange: (mode: 'ai' | 'manual') => void;
  onReset: () => void;
  onSaveEstimate: () => void;
  onSaveManual: () => void;
  onSwitchToBilling: () => void;
  onSwitchToManualFromEstimate: (estimate: CalorieEstimate) => void;
};

export const CaloriesComposerPanel: React.FC<CaloriesComposerPanelProps> = ({
  actionState,
  aiMealText,
  aiMealType,
  editingLogId,
  estimate,
  hasPremiumAccess,
  manualForm,
  mealTypeOptions,
  mode,
  onAiMealTextChange,
  onAiMealTypeChange,
  onEstimate,
  onManualFormChange,
  onModeChange,
  onReset,
  onSaveEstimate,
  onSaveManual,
  onSwitchToBilling,
  onSwitchToManualFromEstimate,
}) => (
  <Card variant="glass" className="space-y-5 rounded-[1.6rem] p-4 sm:p-5 xl:sticky xl:top-24">
    <div className="flex gap-2 rounded-2xl border border-white/10 bg-[#0f1320] p-1">
      <button
        type="button"
        onClick={() => (hasPremiumAccess ? onModeChange('ai') : onSwitchToBilling())}
        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${mode === 'ai' ? 'bg-white text-black' : 'text-[#c6cede]'}`}
      >
        {hasPremiumAccess ? 'AI Estimate' : 'AI Estimate (Premium)'}
      </button>
      <button
        type="button"
        onClick={() => onModeChange('manual')}
        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${mode === 'manual' ? 'bg-white text-black' : 'text-[#c6cede]'}`}
      >
        Manual
      </button>
    </div>

    {mode === 'ai' ? (
      hasPremiumAccess ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">AI logging</p>
            <h2 className="text-xl font-bold text-[#F7F7F7] sm:text-2xl">What did you eat?</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Input label="Date" type="date" value={manualForm.loggedDate} onChange={(e) => onManualFormChange((current) => ({ ...current, loggedDate: e.target.value }))} />
            <Select label="Meal type" value={aiMealType} onChange={(e) => onAiMealTypeChange(e.target.value as CalorieLog['mealType'])} options={mealTypeOptions} />
          </div>
          <Textarea label="Meal description" rows={5} value={aiMealText} onChange={(e) => onAiMealTextChange(e.target.value)} placeholder="Example: 2 rotis, paneer sabzi, dal, little rice and curd" />
          <div className="flex flex-wrap gap-3">
            <Button variant="accent" onClick={onEstimate} isLoading={actionState === 'estimate'}>
              Estimate With AI
            </Button>
            {estimate ? <Button variant="secondary" onClick={onReset}>Reset</Button> : null}
          </div>
          {estimate ? (
            <div className="space-y-4 rounded-2xl border border-[#2e303a] bg-[#0f1320] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Estimate preview</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#F7F7F7]">{estimate.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#98a3b8]">{estimate.rawInput}</p>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#8f97ab]">
                  {Math.round(estimate.confidence * 100)}% confidence
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Calories', `${estimate.calories}`],
                  ['Protein', `${estimate.proteinGrams}g`],
                  ['Carbs', `${estimate.carbsGrams}g`],
                  ['Fats', `${estimate.fatsGrams}g`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">{label}</p>
                    <p className="mt-2 text-xl font-bold text-[#F7F7F7]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {estimate.parsedItems.map((item) => (
                  <div key={`${item.name}-${item.quantity ?? ''}`} className="flex items-center justify-between rounded-xl border border-[#2e303a] bg-black/20 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[#F7F7F7]">{item.name}</p>
                      {item.quantity ? <p className="text-xs text-[#8f97ab]">{item.quantity}</p> : null}
                    </div>
                    <p className="text-sm text-[#cfd6e3]">{item.estimatedCalories ?? 0} kcal</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                <Button variant="accent" onClick={onSaveEstimate} isLoading={actionState === 'save-estimate'}>
                  Save Estimated Entry
                </Button>
                <Button variant="secondary" onClick={() => onSwitchToManualFromEstimate(estimate)}>
                  Edit Manually
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <PremiumFeatureGate
          eyebrow="Premium nutrition AI"
          title="AI calorie estimation is available on the premium plan."
          description="Upgrade to describe meals in plain language, review AI macro estimates, and generate deeper monthly nutrition reviews."
          ctaLabel="Unlock AI Logging"
        />
      )
    ) : (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">{editingLogId ? 'Edit entry' : 'Manual logging'}</p>
          <h2 className="text-xl font-bold text-[#F7F7F7] sm:text-2xl">{editingLogId ? 'Update calorie log' : 'Enter calories manually'}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Input label="Date" type="date" value={manualForm.loggedDate} onChange={(e) => onManualFormChange((current) => ({ ...current, loggedDate: e.target.value }))} />
          <Select label="Meal type" value={manualForm.mealType} onChange={(e) => onManualFormChange((current) => ({ ...current, mealType: e.target.value as CalorieLog['mealType'] }))} options={mealTypeOptions} />
        </div>
        <Input label="Meal title" value={manualForm.title} onChange={(e) => onManualFormChange((current) => ({ ...current, title: e.target.value }))} placeholder="Paneer wrap, oats bowl, whey shake..." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Calories" type="number" min="0" value={manualForm.calories} onChange={(e) => onManualFormChange((current) => ({ ...current, calories: e.target.value }))} placeholder="450" />
          <Input label="Protein (g)" type="number" min="0" value={manualForm.proteinGrams} onChange={(e) => onManualFormChange((current) => ({ ...current, proteinGrams: e.target.value }))} placeholder="30" />
          <Input label="Carbs (g)" type="number" min="0" value={manualForm.carbsGrams} onChange={(e) => onManualFormChange((current) => ({ ...current, carbsGrams: e.target.value }))} placeholder="55" />
          <Input label="Fats (g)" type="number" min="0" value={manualForm.fatsGrams} onChange={(e) => onManualFormChange((current) => ({ ...current, fatsGrams: e.target.value }))} placeholder="14" />
        </div>
        <Textarea label="Notes" rows={3} value={manualForm.notes} onChange={(e) => onManualFormChange((current) => ({ ...current, notes: e.target.value }))} />
        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
          <Button variant="accent" onClick={onSaveManual} isLoading={actionState === 'manual-save' || (editingLogId != null && actionState === `update-${editingLogId}`)}>
            {editingLogId ? 'Save Changes' : 'Add Manual Entry'}
          </Button>
          {editingLogId || estimate ? <Button variant="secondary" onClick={onReset}>Cancel</Button> : null}
        </div>
      </div>
    )}
  </Card>
);
