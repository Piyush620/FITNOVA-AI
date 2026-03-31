import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <AppText tone="accent" style={styles.eyebrow}>{eyebrow}</AppText> : null}
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  eyebrow: {
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
});
