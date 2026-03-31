import { useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AppShell } from '@/components/AppShell';
import { AppText } from '@/components/AppText';
import { Panel } from '@/components/Panel';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { subscriptionsAPI } from '@/services/api';
import type { SubscriptionConfigStatus, SubscriptionSummary } from '@/types';

const billingPlans = [
  {
    key: 'monthly' as const,
    name: 'Monthly',
    price: 'Rs 199',
    cadence: '/month',
    highlight: 'Flexible plan for testing premium features quickly.',
  },
  {
    key: 'yearly' as const,
    name: 'Yearly',
    price: 'Rs 1,299',
    cadence: '/year',
    highlight: 'Lower effective monthly cost for long-term users.',
  },
];

function formatDate(value?: string | null) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString('en-IN');
}

export default function BillingScreen() {
  const { user, getCurrentUser } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ checkout?: string; session_id?: string }>();
  const [configStatus, setConfigStatus] = useState<SubscriptionConfigStatus | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(user?.subscription ?? null);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [syncingCheckout, setSyncingCheckout] = useState(false);

  const loadBilling = async () => {
    setLoading(true);

    try {
      const [statusResponse, subscriptionResponse] = await Promise.all([
        subscriptionsAPI.getStatus(),
        subscriptionsAPI.getCurrent(),
      ]);

      setConfigStatus(statusResponse.data);
      setSubscription(subscriptionResponse.data);
    } catch {
      showToast({
        title: 'Could not load billing',
        message: 'Please try again.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBilling();
  }, []);

  useEffect(() => {
    const syncCheckout = async () => {
      if (params.checkout !== 'success' || !params.session_id || syncingCheckout) {
        return;
      }

      setSyncingCheckout(true);

      try {
        const response = await subscriptionsAPI.confirmCheckoutSession(String(params.session_id));
        setSubscription(response.data);
        await getCurrentUser();
        showToast({
          title: 'Premium updated',
          message: response.data.hasPremiumAccess
            ? 'Your subscription is active.'
            : 'Checkout completed and billing is still syncing.',
          tone: response.data.hasPremiumAccess ? 'success' : 'warning',
        });
      } catch {
        showToast({
          title: 'Checkout sync failed',
          message: 'Pull to refresh billing in a moment.',
          tone: 'warning',
        });
      } finally {
        setSyncingCheckout(false);
      }
    };

    void syncCheckout();
  }, [getCurrentUser, params.checkout, params.session_id, showToast, syncingCheckout]);

  const isBillingReady =
    configStatus?.stripeConfigured &&
    configStatus?.persistenceConfigured &&
    configStatus?.monthlyPriceConfigured &&
    configStatus?.yearlyPriceConfigured;

  const activePlan = subscription?.plan === 'monthly' || subscription?.plan === 'yearly'
    ? subscription.plan
    : null;

  const checkoutBanner = useMemo(() => {
    if (params.checkout === 'success') {
      return subscription?.hasPremiumAccess
        ? 'Checkout completed successfully. Premium access is active.'
        : 'Checkout completed. Billing state is syncing now.';
    }

    if (params.checkout === 'cancel') {
      return 'Checkout was canceled. Your current plan is unchanged.';
    }

    return null;
  }, [params.checkout, subscription?.hasPremiumAccess]);

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    setActionKey(plan);

    try {
      const response = await subscriptionsAPI.createCheckoutSession({
        plan,
        successUrl: 'fitnova://billing?checkout=success',
        cancelUrl: 'fitnova://billing?checkout=cancel',
      });

      if (response.data.url) {
        await Linking.openURL(response.data.url);
        return;
      }

      showToast({
        title: 'Checkout unavailable',
        message: 'Stripe did not return a checkout URL.',
        tone: 'danger',
      });
    } catch {
      showToast({
        title: 'Could not start checkout',
        message: 'Please verify billing is configured and try again.',
        tone: 'danger',
      });
    } finally {
      setActionKey(null);
    }
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Billing"
        title="Manage premium access"
        subtitle="Review subscription status, compare plans, and jump into Stripe checkout from mobile."
      />

      <View style={styles.actions}>
        <AppButton variant="secondary" onPress={() => void loadBilling()} loading={loading}>
          Refresh
        </AppButton>
        <AppButton variant="secondary" onPress={() => router.back()}>
          Back
        </AppButton>
      </View>

      {checkoutBanner ? (
        <Panel style={params.checkout === 'success' ? styles.bannerSuccess : styles.bannerWarning}>
          <AppText>{checkoutBanner}</AppText>
        </Panel>
      ) : null}

      <Panel>
        <AppText style={styles.title}>Current subscription</AppText>
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <AppText tone="muted">Tier</AppText>
            <AppText style={styles.statValue}>{subscription?.tier ?? 'free'}</AppText>
          </View>
          <View style={styles.statCard}>
            <AppText tone="muted">Plan</AppText>
            <AppText style={styles.statValue}>{subscription?.plan ?? 'free'}</AppText>
          </View>
          <View style={styles.statCard}>
            <AppText tone="muted">Status</AppText>
            <AppText style={styles.statValue}>{subscription?.status ?? 'inactive'}</AppText>
          </View>
          <View style={styles.statCard}>
            <AppText tone="muted">Premium</AppText>
            <AppText style={styles.statValue}>{subscription?.hasPremiumAccess ? 'Yes' : 'No'}</AppText>
          </View>
        </View>
        <AppText tone="muted">Current period start: {formatDate(subscription?.currentPeriodStart)}</AppText>
        <AppText tone="muted">Current period end: {formatDate(subscription?.currentPeriodEnd)}</AppText>
      </Panel>

      <Panel>
        <AppText style={styles.title}>Billing readiness</AppText>
        <AppText tone="muted">
          {isBillingReady ? 'Stripe checkout is ready on this environment.' : 'Stripe setup is still incomplete on this environment.'}
        </AppText>
        <View style={styles.statusList}>
          <AppText tone="muted">Stripe configured: {configStatus?.stripeConfigured ? 'yes' : 'no'}</AppText>
          <AppText tone="muted">Persistence ready: {configStatus?.persistenceConfigured ? 'yes' : 'no'}</AppText>
          <AppText tone="muted">Monthly price set: {configStatus?.monthlyPriceConfigured ? 'yes' : 'no'}</AppText>
          <AppText tone="muted">Yearly price set: {configStatus?.yearlyPriceConfigured ? 'yes' : 'no'}</AppText>
        </View>
      </Panel>

      {billingPlans.map((plan) => {
        const isActivePlan = activePlan === plan.key;

        return (
          <Panel key={plan.key} style={isActivePlan ? styles.activePlanPanel : undefined}>
            <View style={styles.planHeader}>
              <View style={styles.planCopy}>
                <AppText style={styles.title}>{plan.name}</AppText>
                <AppText tone="muted">{plan.highlight}</AppText>
              </View>
              {isActivePlan ? (
                <View style={styles.activeBadge}>
                  <AppText tone="success" style={styles.badgeText}>ACTIVE</AppText>
                </View>
              ) : null}
            </View>
            <AppText style={styles.priceLine}>
              {plan.price}
              <AppText tone="muted"> {plan.cadence}</AppText>
            </AppText>
            <AppButton
              onPress={() => void handleCheckout(plan.key)}
              loading={actionKey === plan.key}
              disabled={!isBillingReady || isActivePlan}
            >
              {isActivePlan ? `${plan.name} active` : `Choose ${plan.name}`}
            </AppButton>
          </Panel>
        );
      })}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  bannerSuccess: {
    borderColor: 'rgba(0,226,138,0.24)',
    backgroundColor: 'rgba(0,226,138,0.1)',
  },
  bannerWarning: {
    borderColor: 'rgba(255,184,77,0.22)',
    backgroundColor: 'rgba(255,184,77,0.08)',
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    minWidth: 140,
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  statusList: {
    gap: 4,
  },
  activePlanPanel: {
    borderColor: 'rgba(0,226,138,0.24)',
    backgroundColor: 'rgba(0,226,138,0.06)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  planCopy: {
    flex: 1,
    gap: 4,
  },
  activeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,226,138,0.22)',
    backgroundColor: 'rgba(0,226,138,0.09)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  priceLine: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
});
