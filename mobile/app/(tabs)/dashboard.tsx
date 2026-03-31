import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { usersAPI } from '@/services/api';
import type { DashboardSummary } from '@/types';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const hasPremiumAccess = user?.subscription?.hasPremiumAccess ?? false;

  useEffect(() => {
    let active = true;

    void usersAPI
      .getDashboard()
      .then((response) => {
        if (active) {
          setSummary(response.data);
        }
      })
      .catch(() => {
        if (active) {
          setError('Dashboard sync will appear here once the API is reachable from your device.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Command Center"
        title={summary?.greeting || 'FitNova mobile dashboard'}
        subtitle="Your mobile home for daily momentum, calorie progress, and the next action worth taking."
      />

      <View style={styles.grid}>
        <View style={styles.cell}>
          <StatCard label="Calories Left" value={summary?.remainingCalories ?? '--'} caption="Today's target vs intake" />
        </View>
        <View style={styles.cell}>
          <StatCard label="Weekly Consistency" value={summary ? `${summary.weeklyConsistency}%` : '--'} caption="Training and nutrition streak" />
        </View>
      </View>

      <Panel>
        <AppText tone="accent" style={styles.kicker}>AI COACH</AppText>
        <AppText style={styles.heroTitle}>Your coach is live on mobile now.</AppText>
        <AppText tone="muted">
          Ask for training adjustments, meal structure, recovery fixes, or a quick reality check before the day gets away from you.
        </AppText>
        <View style={styles.coachMetaRow}>
          <View style={styles.pill}>
            <AppText tone={hasPremiumAccess ? 'success' : 'muted'} style={styles.pillText}>
              {hasPremiumAccess ? 'Premium coach unlocked' : 'Premium needed for replies'}
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/coach')} style={styles.linkPill}>
            <AppText style={styles.linkPillText}>Open AI Coach</AppText>
          </Pressable>
        </View>
        {error ? <AppText tone="muted">{error}</AppText> : null}
      </Panel>

      <Panel>
        <AppText style={styles.cardTitle}>Daily reminder</AppText>
        <AppText tone="muted">
          Turn on a local reminder so FitNova nudges you to log meals and review training each evening.
        </AppText>
        <View style={styles.reminderActions}>
          <AppButton
            onPress={() => {
              setNotificationLoading(true);
              void import('@/services/notifications')
                .then(({ scheduleDailyReminder }) => scheduleDailyReminder(19, 0))
                .then((result) => {
                  if (!result.granted) {
                    showToast({
                      title: 'Reminder not enabled',
                      message: result.reason,
                      tone: 'warning',
                    });
                    return;
                  }

                  showToast({
                    title: 'Reminder enabled',
                    message: 'FitNova will remind you each evening at 7:00 PM.',
                    tone: 'success',
                  });
                })
                .catch(() => {
                  showToast({
                    title: 'Reminder failed',
                    message: 'Please try again in a moment.',
                    tone: 'danger',
                  });
                })
                .finally(() => {
                  setNotificationLoading(false);
                });
            }}
            loading={notificationLoading}
          >
            Enable 7 PM reminder
          </AppButton>
        </View>
      </Panel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 14,
  },
  cell: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  coachMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  pill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  linkPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(53,208,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(53,208,255,0.24)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  linkPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: '#C8F5FF',
  },
  reminderActions: {
    alignItems: 'flex-start',
  },
});
