import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Panel({ children, style }: Props) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(17,24,41,0.88)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
