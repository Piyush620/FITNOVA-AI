import React from 'react';

import { Button, Card } from '../../components/Common';
import type { MonthlyCalorieSummary } from '../../types';
import { formatDateLabel, formatMonthLabel } from '../../utils/calendar';

type CaloriesMonthlyReviewProps = {
  actionState: string | null;
  aiInsights: string;
  displayMonthlyTargetCalories: number;
  hasPremiumAccess: boolean;
  monthlySummary: MonthlyCalorieSummary | null;
  onGenerateAiInsights: () => void;
  onGoBilling: () => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
};

export const CaloriesMonthlyReview: React.FC<CaloriesMonthlyReviewProps> = ({
  actionState,
  aiInsights,
  displayMonthlyTargetCalories,
  hasPremiumAccess,
  monthlySummary,
  onGenerateAiInsights,
  onGoBilling,
  selectedMonth,
  setSelectedMonth,
}) => (
  <Card variant="glass" className="space-y-5 rounded-[1.6rem] p-4 sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Monthly review</p>
        <h2 className="mt-1 text-xl font-bold text-[#F7F7F7] sm:text-2xl">{formatMonthLabel(selectedMonth)}</h2>
      </div>
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="max-w-full rounded-xl border border-white/10 bg-[#0f1320] px-3 py-2 text-[#F7F7F7] sm:max-w-[220px]"
      />
    </div>
    {monthlySummary ? (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Target', `${displayMonthlyTargetCalories}`],
            ['Days logged', `${monthlySummary.daysLogged}/${monthlySummary.daysInMonth}`],
            ['Avg protein', `${monthlySummary.averageProteinGrams}g`],
            ['Entries', `${monthlySummary.entriesCount}`],
          ].map(([label, value]) => (
            <Card key={label} className="space-y-2 border-white/10 bg-[#0e1420] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8f97ab]">{label}</p>
              <p className="text-2xl font-bold text-[#F7F7F7]">{value}</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f97ab]">Daily breakdown</p>
            <div className="mt-4 space-y-3">
              {monthlySummary.dailyBreakdown.length ? (
                monthlySummary.dailyBreakdown.slice().reverse().slice(0, 6).map((day) => (
                  <div key={day.date} className="flex items-center justify-between rounded-xl border border-[#2e303a] bg-[#0f1320] px-4 py-3">
                    <div>
                      <p className="font-medium text-[#F7F7F7]">{formatDateLabel(day.date)}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8f97ab]">{day.entryCount} entries</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#F7F7F7]">{day.calories} kcal</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-[#98a3b8]">No monthly data yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[#2e303a] bg-[#11131d] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f97ab]">Recommendations</p>
                <p className="mt-2 text-sm text-[#98a3b8]">
                  {hasPremiumAccess ? 'Use the built-in guidance or ask AI for a sharper monthly read.' : 'Use the built-in guidance below. Premium unlocks a deeper AI monthly review.'}
                </p>
              </div>
              {hasPremiumAccess ? (
                <Button variant="secondary" size="sm" onClick={onGenerateAiInsights} isLoading={actionState === 'ai-insights'}>
                  AI Review
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={onGoBilling}>
                  Unlock AI Review
                </Button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {monthlySummary.recommendations.map((item) => (
                <div key={item} className="rounded-xl border border-[#2e303a] bg-[#0f1320] p-4 text-sm leading-6 text-[#d5d9e3]">
                  {item}
                </div>
              ))}
              {aiInsights ? (
                <div className="rounded-xl border border-[#2e303a] bg-[#0f1320] p-4 text-sm leading-7 text-[#d5d9e3]">
                  {aiInsights}
                </div>
              ) : !hasPremiumAccess ? (
                <div className="rounded-xl border border-dashed border-[#2e303a] bg-[#0f1320] p-4 text-sm leading-7 text-[#98a3b8]">
                  Premium adds an AI-written monthly review on top of these built-in recommendations.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    ) : null}
  </Card>
);
