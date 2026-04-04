const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalMonthString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export function today() {
  return toLocalDateString(new Date());
}

export function currentMonth() {
  return toLocalMonthString(new Date());
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
  return toLocalDateString(date);
}

export function shiftMonth(value: string, offset: number) {
  const date = parseMonthValue(value) ?? parseMonthValue(currentMonth());
  if (!date) {
    return currentMonth();
  }

  date.setMonth(date.getMonth() + offset);
  return toLocalMonthString(date);
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
    return toLocalDateString(next);
  });
}

export function getWeekdayName(value: string) {
  const date = parseDateValue(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}
