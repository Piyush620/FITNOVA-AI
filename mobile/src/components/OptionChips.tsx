import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors } from '@/theme/colors';

type Option<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  label: string;
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
  hint?: string;
};

export function OptionChips<T extends string>({ label, value, options, onChange, hint }: Props<T>) {
  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.row}>
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <AppText style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {hint ? <AppText tone="muted" style={styles.hint}>{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    borderColor: 'rgba(53,208,255,0.35)',
    backgroundColor: 'rgba(53,208,255,0.14)',
  },
  chipLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chipLabelActive: {
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
