import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors } from '@/theme/colors';

type Props = PropsWithChildren<{
  style?: StyleProp<TextStyle>;
  tone?: 'default' | 'muted' | 'accent' | 'success';
}>;

export function AppText({ children, style, tone = 'default' }: Props) {
  return <Text style={[styles.base, toneStyles[tone], style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
});

const toneStyles = StyleSheet.create({
  default: { color: colors.text },
  muted: { color: colors.textMuted },
  accent: { color: colors.accent },
  success: { color: colors.success },
});
