type PlanDay = {
  dayNumber: number;
  dayLabel: string;
};

type ScheduledPlan<TDay extends PlanDay> = {
  startDate?: string | Date | null;
  days?: TDay[] | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const resolveTargetDate = (value: string) => new Date(`${value}T12:00:00.000Z`);

const getWeekdayLabel = (value: Date) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(value);

export const resolvePlanDayByDate = <TDay extends PlanDay>(
  plan: ScheduledPlan<TDay> | null | undefined,
  selectedDate: string,
) => {
  if (!plan?.days?.length) {
    return null;
  }

  const normalizedDays = [...plan.days].sort((left, right) => left.dayNumber - right.dayNumber);
  const targetDate = resolveTargetDate(selectedDate);
  const planStartDate = plan.startDate ? new Date(plan.startDate) : null;

  if (planStartDate && !Number.isNaN(planStartDate.getTime())) {
    planStartDate.setUTCHours(12, 0, 0, 0);
    const diffDays = Math.floor((targetDate.getTime() - planStartDate.getTime()) / MS_PER_DAY);

    if (diffDays >= 0) {
      return normalizedDays.find((day) => day.dayNumber === diffDays + 1) ?? null;
    }
  }

  const weekdayLabel = getWeekdayLabel(targetDate);
  return normalizedDays.find((day) => day.dayLabel === weekdayLabel) ?? null;
};
