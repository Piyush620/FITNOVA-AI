import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { colors } from '@/theme/colors';

type Props = {
  title: string;
  body: string;
};

export function FeaturePlaceholder({ title, body }: Props) {
  return (
    <Panel>
      <View style={styles.badge}>
        <AppText style={styles.badgeText}>Mobile Next</AppText>
      </View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText tone="muted">{body}</AppText>
    </Panel>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,226,138,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0,226,138,0.28)',
  },
  badgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
});
