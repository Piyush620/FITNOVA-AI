import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type Props = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
}>;

export function AppShell({ children, scroll = true, padded = true }: Props) {
  const content = <View style={[styles.content, padded && styles.padded]}>{children}</View>;

  return (
    <LinearGradient
      colors={[colors.backgroundDeep, '#0B1221', '#121B30']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottom]} />
      <SafeAreaView style={styles.safeArea}>
        {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
  },
  glowTop: {
    top: -80,
    right: -60,
    backgroundColor: colors.glowBlue,
  },
  glowBottom: {
    bottom: 120,
    left: -90,
    backgroundColor: colors.glowOrange,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    gap: 18,
  },
  padded: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
