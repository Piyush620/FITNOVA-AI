import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { usersAPI } from '@/services/api';
import type { User } from '@/types';

type ProfileForm = {
  fullName: string;
  goal: string;
  activityLevel: string;
  age: string;
  heightCm: string;
  weightKg: string;
  gender: string;
};

function buildForm(user: User | null): ProfileForm {
  return {
    fullName: user?.profile.fullName ?? '',
    goal: user?.profile.goal ?? '',
    activityLevel: user?.profile.activityLevel ?? 'moderate',
    age: user?.profile.age != null ? String(user.profile.age) : '',
    heightCm: user?.profile.heightCm != null ? String(user.profile.heightCm) : '',
    weightKg: user?.profile.weightKg != null ? String(user.profile.weightKg) : '',
    gender: user?.profile.gender ?? 'other',
  };
}

export default function ProfileScreen() {
  const { user, getCurrentUser, logout } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<ProfileForm>(() => buildForm(user));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildForm(user));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);

    try {
      await usersAPI.updateProfile({
        fullName: form.fullName.trim(),
        goal: form.goal.trim(),
        activityLevel: form.activityLevel,
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      });

      await getCurrentUser();
      showToast({
        title: 'Saved',
        message: 'Profile updated.',
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Save failed',
        message: 'Please try again.',
        tone: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Profile"
        title={user?.profile.fullName || 'Your FitNova profile'}
        subtitle={user?.email || 'Signed-in account details will appear here.'}
      />

      <Panel>
        <AppText style={styles.title}>Edit mobile profile</AppText>
        <TextInput value={form.fullName} onChangeText={(value) => setForm((current) => ({ ...current, fullName: value }))} style={styles.input} placeholder="Full name" placeholderTextColor="#96A0B8" />
        <TextInput value={form.goal} onChangeText={(value) => setForm((current) => ({ ...current, goal: value }))} style={styles.input} placeholder="Goal" placeholderTextColor="#96A0B8" />
        <TextInput value={form.activityLevel} onChangeText={(value) => setForm((current) => ({ ...current, activityLevel: value }))} style={styles.input} placeholder="Activity level" placeholderTextColor="#96A0B8" />
        <View style={styles.grid}>
          <TextInput value={form.age} onChangeText={(value) => setForm((current) => ({ ...current, age: value }))} style={[styles.input, styles.cell]} placeholder="Age" placeholderTextColor="#96A0B8" keyboardType="numeric" />
          <TextInput value={form.heightCm} onChangeText={(value) => setForm((current) => ({ ...current, heightCm: value }))} style={[styles.input, styles.cell]} placeholder="Height cm" placeholderTextColor="#96A0B8" keyboardType="numeric" />
          <TextInput value={form.weightKg} onChangeText={(value) => setForm((current) => ({ ...current, weightKg: value }))} style={[styles.input, styles.cell]} placeholder="Weight kg" placeholderTextColor="#96A0B8" keyboardType="numeric" />
        </View>
        <TextInput value={form.gender} onChangeText={(value) => setForm((current) => ({ ...current, gender: value }))} style={styles.input} placeholder="Gender" placeholderTextColor="#96A0B8" />
        <AppButton onPress={() => void handleSave()} loading={saving}>Save profile</AppButton>
      </Panel>

      <Panel>
        <AppText style={styles.title}>Account</AppText>
        <AppText tone="muted">{user?.subscription?.hasPremiumAccess ? 'Premium access active' : 'Free plan'}</AppText>
        <AppButton variant="secondary" onPress={() => router.push('/billing' as never)}>Billing & subscription</AppButton>
        <AppButton variant="secondary" onPress={() => void handleLogout()}>Log out</AppButton>
      </Panel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#F6F7FB',
    paddingHorizontal: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
  },
});
