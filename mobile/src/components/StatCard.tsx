import { StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';

type Props = {
  label: string;
  value: string | number;
  caption?: string;
};

export function StatCard({ label, value, caption }: Props) {
  return (
    <Panel>
      <AppText tone="muted" style={styles.label}>{label}</AppText>
      <AppText style={styles.value}>{value}</AppText>
      {caption ? <AppText tone="muted">{caption}</AppText> : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
});
