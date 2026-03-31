export const today = () => new Date().toISOString().slice(0, 10);
export const currentMonth = () => new Date().toISOString().slice(0, 7);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export const parseDateValue = (value: string) => {
  if (!DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const parseMonthValue = (value: string) => {
  if (!MONTH_PATTERN.test(value)) return null;
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeDate = (value?: string | null) => {
  if (!value) return today();
  return parseDateValue(value) ? value : today();
};

export const normalizeMonth = (value?: string | null) => {
  if (!value) return currentMonth();
  return parseMonthValue(value) ? value : currentMonth();
};

export const formatDateLabel = (value: string) => {
  const date = parseDateValue(value);
  if (!date) return 'Select a valid date';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export const formatMonthLabel = (value: string) => {
  const date = parseMonthValue(value);
  if (!date) return 'Select a valid month';
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
};

export const formatWeekdayLabel = (value: string) => {
  const date = parseDateValue(value);
  if (!date) return '--';
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date);
};

export const getWeekdayName = (value: string) => {
  const date = parseDateValue(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
};

export const shiftDate = (value: string, offset: number) => {
  const date = parseDateValue(value) ?? parseDateValue(today());
  if (!date) return today();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const shiftMonth = (value: string, offset: number) => {
  const date = parseMonthValue(value) ?? parseMonthValue(currentMonth());
  if (!date) return currentMonth();
  date.setMonth(date.getMonth() + offset);
  return date.toISOString().slice(0, 7);
};

export const buildWeekDates = (centerDate: string) => {
  const date = parseDateValue(centerDate) ?? parseDateValue(today());
  if (!date) return [today()];
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + mondayOffset + index);
    return next.toISOString().slice(0, 10);
  });
};
