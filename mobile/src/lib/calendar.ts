const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function parseDateValue(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseMonthValue(value: string) {
  if (!MONTH_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeDate(value?: string | null) {
  if (!value) {
    return today();
  }

  return parseDateValue(value) ? value : today();
}

export function normalizeMonth(value?: string | null) {
  if (!value) {
    return currentMonth();
  }

  return parseMonthValue(value) ? value : currentMonth();
}

export function formatDateLabel(value: string) {
  const date = parseDateValue(value);
  if (!date) {
    return 'Select a valid date';
  }

  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatMonthLabel(value: string) {
  const date = parseMonthValue(value);
  if (!date) {
    return 'Select a valid month';
  }

  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
}

export function formatWeekdayLabel(value: string) {
  const date = parseDateValue(value);
  if (!date) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date);
}

export function shiftDate(value: string, offset: number) {
  const date = parseDateValue(value) ?? parseDateValue(today());
  if (!date) {
    return today();
  }

  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function shiftMonth(value: string, offset: number) {
  const date = parseMonthValue(value) ?? parseMonthValue(currentMonth());
  if (!date) {
    return currentMonth();
  }

  date.setMonth(date.getMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function buildWeekDates(centerDate: string) {
  const date = parseDateValue(centerDate) ?? parseDateValue(today());
  if (!date) {
    return [today()];
  }

  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + mondayOffset + index);
    return next.toISOString().slice(0, 10);
  });
}

export function getWeekdayName(value: string) {
  const date = parseDateValue(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
}
