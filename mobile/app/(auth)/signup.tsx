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

export default function SignupScreen() {
  const { register, isLoading, error, clearError } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    clearError();

    try {
      const response = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      router.push({
        pathname: '/(auth)/verify',
        params: { email: response.email },
      });
    } catch {
      showToast({
        title: 'Signup failed',
        message: 'Please review your details and try again.',
        tone: 'danger',
      });
    }
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Start Strong"
        title="Build your FitNova account."
        subtitle="This mobile app will sync training, nutrition, and coaching across devices."
      />

      <Panel>
        <AppInput label="Full name" value={fullName} onChangeText={setFullName} />
        <AppInput label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AppInput label="Password" secureTextEntry hint="Use at least 8 characters." value={password} onChangeText={setPassword} />
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <AppButton onPress={handleSignup} loading={isLoading}>Create account</AppButton>
      </Panel>

      <View style={styles.row}>
        <AppText tone="muted">Already signed up?</AppText>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <AppText tone="accent">Go to login</AppText>
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
