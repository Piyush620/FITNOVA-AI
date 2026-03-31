import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/AppText';
import { colors } from '@/theme/colors';

type Props = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}>;

export function AppButton({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable disabled={isDisabled} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {variant === 'primary' ? (
        <LinearGradient colors={['#1BE7FF', '#1F89FF', '#FF7A18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.base, isDisabled && styles.disabled]}>
          {loading ? <ActivityIndicator color="#081018" /> : <AppText style={styles.primaryLabel}>{children}</AppText>}
        </LinearGradient>
      ) : (
        <View style={[styles.base, styles.secondary, isDisabled && styles.disabled]}>
          {loading ? <ActivityIndicator color={colors.text} /> : <AppText style={styles.secondaryLabel}>{children}</AppText>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryLabel: {
    color: '#081018',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.92,
  },
});
