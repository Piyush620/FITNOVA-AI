import { create } from 'zustand';

import { currentMonth, normalizeDate, normalizeMonth, today } from '@/lib/calendar';

type CalendarState = {
  selectedDate: string;
  selectedMonth: string;
  setSelectedDate: (value: string) => void;
  setSelectedMonth: (value: string) => void;
  goToToday: () => void;
};

export const useCalendarStore = create<CalendarState>((set) => ({
  selectedDate: today(),
  selectedMonth: currentMonth(),
  setSelectedDate: (value) => {
    const nextDate = normalizeDate(value);
    set({
      selectedDate: nextDate,
      selectedMonth: normalizeMonth(nextDate.slice(0, 7)),
    });
  },
  setSelectedMonth: (value) => {
    set({
      selectedMonth: normalizeMonth(value),
    });
  },
  goToToday: () =>
    set({
      selectedDate: today(),
      selectedMonth: currentMonth(),
    }),
}));
