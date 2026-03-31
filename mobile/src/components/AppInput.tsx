import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors } from '@/theme/colors';

type Props = TextInputProps & {
  label: string;
  hint?: string;
};

export function AppInput({ label, hint, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput placeholderTextColor={colors.textMuted} style={[styles.input, style]} {...props} />
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
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
