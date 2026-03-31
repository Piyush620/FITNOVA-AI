import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    clearError();

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch {
      showToast({
        title: 'Login failed',
        message: 'Check your credentials and try again.',
        tone: 'danger',
      });
    }
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="FitNova Mobile"
        title="Train smarter from your pocket."
        subtitle="Sign in to keep workouts, meals, and coaching close."
      />

      <Panel>
        <AppInput label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AppInput label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <AppButton onPress={handleLogin} loading={isLoading}>Sign in</AppButton>
      </Panel>

      <View style={styles.row}>
        <AppText tone="muted">Need an account?</AppText>
        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <AppText tone="accent">Create one</AppText>
          </Pressable>
        </Link>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  error: {
    color: '#FF8A8A',
  },
});
