import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const { verifyEmailOtp, resendEmailOtp, isLoading, error, clearError } = useAuth();
  const { showToast } = useToast();
  const [otp, setOtp] = useState('');

  const handleVerify = async () => {
    clearError();

    try {
      await verifyEmailOtp(email, otp.trim());
      router.replace('/(tabs)/dashboard');
    } catch {
      showToast({
        title: 'Verification failed',
        message: 'Please check the OTP and try again.',
        tone: 'danger',
      });
    }
  };

  const handleResend = async () => {
    try {
      await resendEmailOtp(email);
      showToast({
        title: 'OTP sent',
        message: 'A fresh code has been sent to your email.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Could not resend OTP',
        message: 'Please wait a moment and try again.',
        tone: 'danger',
      });
    }
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="One Last Step"
        title="Verify your email."
        subtitle={`Enter the 6-digit OTP sent to ${email || 'your inbox'}.`}
      />

      <Panel>
        <AppInput label="OTP code" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <AppButton onPress={handleVerify} loading={isLoading}>Verify and continue</AppButton>
        <AppButton variant="secondary" onPress={handleResend}>Resend OTP</AppButton>
      </Panel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#FF8A8A',
  },
});
