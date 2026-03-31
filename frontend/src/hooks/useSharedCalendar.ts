import { useCallback, useEffect, useState } from 'react';

import { currentMonth, normalizeDate, normalizeMonth, today } from '../utils/calendar';

const DATE_KEY = 'fitnova-shared-date';
const MONTH_KEY = 'fitnova-shared-month';
const EVENT_NAME = 'fitnova:calendar-sync';

const readDate = () => normalizeDate(localStorage.getItem(DATE_KEY));
const readMonth = () => normalizeMonth(localStorage.getItem(MONTH_KEY));

const writeCalendar = (date: string, month: string) => {
  localStorage.setItem(DATE_KEY, date);
  localStorage.setItem(MONTH_KEY, month);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { date, month } }));
};

export const useSharedCalendar = () => {
  const [selectedDate, setSelectedDateState] = useState(readDate);
  const [selectedMonth, setSelectedMonthState] = useState(readMonth);

  useEffect(() => {
    const sync = () => {
      setSelectedDateState(readDate());
      setSelectedMonthState(readMonth());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DATE_KEY || event.key === MONTH_KEY) {
        sync();
      }
    };

    window.addEventListener(EVENT_NAME, sync as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, sync as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setSelectedDate = useCallback((value: string) => {
    const nextDate = normalizeDate(value);
    const nextMonth = normalizeMonth(nextDate.slice(0, 7));
    setSelectedDateState(nextDate);
    setSelectedMonthState(nextMonth);
    writeCalendar(nextDate, nextMonth);
  }, []);

  const setSelectedMonth = useCallback((value: string) => {
    const nextMonth = normalizeMonth(value);
    setSelectedMonthState(nextMonth);
    writeCalendar(selectedDate, nextMonth);
  }, [selectedDate]);

  const goToToday = useCallback(() => {
    const nextDate = today();
    const nextMonth = currentMonth();
    setSelectedDateState(nextDate);
    setSelectedMonthState(nextMonth);
    writeCalendar(nextDate, nextMonth);
  }, []);

  return {
    selectedDate,
    selectedMonth,
    setSelectedDate,
    setSelectedMonth,
    goToToday,
  };
};
