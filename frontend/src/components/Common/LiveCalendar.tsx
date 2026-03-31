import React from 'react';

import { buildWeekDates, formatDateLabel, formatMonthLabel, formatWeekdayLabel, shiftDate, shiftMonth, today } from '../../utils/calendar';
import { Button } from './Button';

type Props = {
  selectedDate: string;
  selectedMonth: string;
  onDateChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onToday: () => void;
  subtitle?: string;
  showMonthControls?: boolean;
};

export const LiveCalendar: React.FC<Props> = ({
  selectedDate,
  selectedMonth,
  onDateChange,
  onMonthChange,
  onToday,
  subtitle,
  showMonthControls = false,
}) => {
  const weekDates = buildWeekDates(selectedDate);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">Live calendar</p>
          <h2 className="text-xl font-bold text-[#F7F7F7]">{formatDateLabel(selectedDate)}</h2>
          <p className="text-sm text-[#98a3b8]">{subtitle ?? formatMonthLabel(selectedMonth)}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={() => onDateChange(shiftDate(selectedDate, -1))}>
          Prev day
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onDateChange(shiftDate(selectedDate, 1))}>
          Next day
        </Button>
      </div>

      {showMonthControls ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(shiftMonth(selectedMonth, -1))}>
            Prev month
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(shiftMonth(selectedMonth, 1))}>
            Next month
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {weekDates.map((date) => {
          const isSelected = date === selectedDate;
          const isToday = date === today();

          return (
            <button
              key={date}
              type="button"
              onClick={() => onDateChange(date)}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                isSelected
                  ? 'border-[#35d0ff]/50 bg-[#35d0ff]/10'
                  : 'border-white/10 bg-[#0f1320]'
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isSelected ? 'text-[#35d0ff]' : 'text-[#8f97ab]'}`}>
                {formatWeekdayLabel(date)}
              </p>
              <p className="mt-2 text-2xl font-bold text-[#F7F7F7]">{date.slice(-2)}</p>
              <p className={`mt-1 text-sm ${isToday ? 'text-[#00FF88]' : 'text-[#8f97ab]'}`}>
                {isToday ? 'Today' : 'Open'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
