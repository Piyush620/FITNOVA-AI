import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { buildWeekDates, formatDateLabel, formatMonthLabel, formatWeekdayLabel, shiftDate, shiftMonth, today } from '@/lib/calendar';
import { useCalendarStore } from '@/stores/calendarStore';

type Props = {
  title?: string;
  subtitle?: string;
  showMonthControls?: boolean;
};

export function LiveCalendar({
  title = 'Live calendar',
  subtitle,
  showMonthControls = false,
}: Props) {
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const selectedMonth = useCalendarStore((state) => state.selectedMonth);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  const setSelectedMonth = useCalendarStore((state) => state.setSelectedMonth);
  const goToToday = useCalendarStore((state) => state.goToToday);
  const weekDates = buildWeekDates(selectedDate);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText tone="muted">{subtitle ?? formatDateLabel(selectedDate)}</AppText>
          {showMonthControls ? <AppText tone="muted">{formatMonthLabel(selectedMonth)}</AppText> : null}
        </View>
        <AppButton variant="secondary" onPress={goToToday}>Today</AppButton>
      </View>

      <View style={styles.actionRow}>
        <AppButton variant="secondary" onPress={() => setSelectedDate(shiftDate(selectedDate, -1))}>
          Prev day
        </AppButton>
        <AppButton variant="secondary" onPress={() => setSelectedDate(shiftDate(selectedDate, 1))}>
          Next day
        </AppButton>
      </View>

      {showMonthControls ? (
        <View style={styles.actionRow}>
          <AppButton variant="secondary" onPress={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}>
            Prev month
          </AppButton>
          <AppButton variant="secondary" onPress={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}>
            Next month
          </AppButton>
        </View>
      ) : null}

      <View style={styles.weekRow}>
        {weekDates.map((date) => {
          const isSelected = date === selectedDate;
          const isToday = date === today();

          return (
            <Pressable
              key={date}
              onPress={() => setSelectedDate(date)}
              style={[styles.dayChip, isSelected && styles.dayChipActive]}
            >
              <AppText tone={isSelected ? 'accent' : 'muted'} style={styles.dayChipLabel}>
                {formatWeekdayLabel(date)}
              </AppText>
              <AppText style={styles.dayChipNumber}>{date.slice(-2)}</AppText>
              <AppText tone={isToday ? 'success' : 'muted'} style={styles.dayChipMeta}>
                {isToday ? 'Today' : 'Open'}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    gap: 4,
    flex: 1,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayChip: {
    minWidth: 82,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  dayChipActive: {
    borderColor: 'rgba(53,208,255,0.28)',
    backgroundColor: 'rgba(53,208,255,0.12)',
  },
  dayChipLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayChipNumber: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  dayChipMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
});
