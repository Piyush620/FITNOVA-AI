import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { MainLayout } from '../components/Layout';
import { Breadcrumbs, Button, Card } from '../components/Common';
import { useAuth } from '../hooks/useAuth';
import { subscriptionsAPI, getApiErrorMessage } from '../services/api';
import type { CheckoutSessionResponse, SubscriptionConfigStatus, SubscriptionSummary } from '../types';
import { toastError, toastSuccess } from '../utils/toast';

type ApiErrorResponse = {
  message?: string | string[];
};

const billingPlans = [
  {
    key: 'monthly' as const,
    name: 'Monthly',
    price: 'Rs 199',
    cadence: '/month',
    badge: 'Flexible',
    description: 'Best for testing, short commitments, and faster checkout validation.',
    highlight: 'Cancel any time in Stripe test mode.',
  },
  {
    key: 'yearly' as const,
    name: 'Yearly',
    price: 'Rs 1,299',
    cadence: '/year',
    badge: 'Best value',
    description: 'Lower effective monthly cost for users who plan to stay consistent.',
    highlight: 'About Rs 108 per month when billed yearly.',
  },
] satisfies Array<{
  key: 'monthly' | 'yearly';
  name: string;
  price: string;
  cadence: string;
  badge: string;
  description: string;
  highlight: string;
}>;

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString();
};

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, getCurrentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [configStatus, setConfigStatus] = useState<SubscriptionConfigStatus | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [error, setError] = useState('');
  const [actionState, setActionState] = useState<'monthly' | 'yearly' | null>(null);
  const checkoutState = searchParams.get('checkout');
  const checkoutSessionId = searchParams.get('session_id');

  const loadBilling = useCallback(async () => {
    try {
      const [statusResponse, subscriptionResponse] = await Promise.all([
        subscriptionsAPI.getStatus(),
        subscriptionsAPI.getCurrent(),
      ]);

      setConfigStatus(statusResponse.data);
      setSubscription(subscriptionResponse.data);
      if (subscriptionResponse.data.hasPremiumAccess !== (user?.subscription?.hasPremiumAccess ?? false)) {
        await getCurrentUser();
      }
      setError('');
      return subscriptionResponse.data;
    } catch (requestError) {
      const message = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      setError(message || 'Failed to load billing details.');
      return null;
    }
  }, [getCurrentUser, user?.subscription?.hasPremiumAccess]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (checkoutState !== 'success') {
      return;
    }

    let cancelled = false;

    const syncSubscription = async () => {
      if (checkoutSessionId) {
        try {
          const confirmedSubscription = await subscriptionsAPI.confirmCheckoutSession(checkoutSessionId);
          if (!cancelled) {
            setSubscription(confirmedSubscription.data);
            if (confirmedSubscription.data.hasPremiumAccess !== (user?.subscription?.hasPremiumAccess ?? false)) {
              await getCurrentUser();
            }
          }
        } catch {
          // Fall back to polling below if the direct session confirmation path fails.
        }
      }

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const latestSubscription = await loadBilling();
        if (cancelled) {
          return;
        }

        if (latestSubscription?.hasPremiumAccess) {
          return;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 2000);
        });
      }
    };

    void syncSubscription();

    return () => {
      cancelled = true;
    };
  }, [checkoutSessionId, checkoutState, getCurrentUser, loadBilling, user?.subscription?.hasPremiumAccess]);

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    setActionState(plan);
    try {
      const origin = window.location.origin;
      const response = await subscriptionsAPI.createCheckoutSession({
        plan,
        successUrl: `${origin}/billing?checkout=success`,
        cancelUrl: `${origin}/billing?checkout=cancel`,
      });

      const checkout = response.data as CheckoutSessionResponse;
      if (checkout.url) {
        toastSuccess(`Redirecting to Stripe ${plan} checkout...`);
        window.location.href = checkout.url;
        return;
      }

      toastError('Stripe checkout URL was not returned.');
    } catch (requestError) {
      const message = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? getApiErrorMessage(requestError.response?.data?.message)
        : undefined;
      toastError(message || 'Could not start checkout.');
    } finally {
      setActionState(null);
    }
  };

  const isBillingReady =
    configStatus?.stripeConfigured &&
    configStatus?.persistenceConfigured &&
    configStatus?.monthlyPriceConfigured &&
    configStatus?.yearlyPriceConfigured;
  const activePlan = subscription?.plan === 'monthly' || subscription?.plan === 'yearly'
    ? subscription.plan
    : null;
  const checkoutBanner = useMemo(() => {
    if (checkoutState === 'success') {
      return {
        tone: 'success',
        text: subscription?.hasPremiumAccess
          ? 'Checkout completed successfully. Your premium access is active.'
          : 'Checkout completed. We are syncing your subscription status now.',
      } as const;
    }

    if (checkoutState === 'cancel') {
      return {
        tone: 'warning',
        text: 'Checkout was canceled. Your current subscription is unchanged.',
      } as const;
    }

    return null;
  }, [checkoutState, subscription?.hasPremiumAccess]);

  return (
    <MainLayout>
      <div className="w-full space-y-8">
        <Card variant="gradient" className="overflow-hidden p-0">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-5">
              <div className="space-y-3">
                <Breadcrumbs
                  items={[
                    { label: 'Dashboard', onClick: () => navigate('/dashboard') },
                    { label: 'Billing', isCurrent: true },
                  ]}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">
                  Billing
                </p>
                <h1 className="text-3xl font-black leading-[0.98] text-[#F7F7F7] sm:text-4xl lg:text-5xl">
                  Manage premium access and checkout.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#aeb7cb] sm:text-base">
                  This page shows your current subscription state and starts Stripe Checkout when
                  billing is configured. For resume/demo use, Stripe test mode is enough.
                </p>
              </div>
            </div>

            <Card className="theme-hero-surface overflow-hidden border-white/10 p-0 lg:min-h-[520px] lg:self-start">
              <div className="flex min-h-[420px] flex-col gap-5 p-6 lg:min-h-[520px]">
                  <div className="theme-media-chip inline-flex self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                    Premium Access
                  </div>
                  <div className="mt-auto space-y-4 pt-2">
                    <div>
                      <h2 className="theme-media-heading text-2xl font-bold leading-tight">
                        Subscription state at a glance
                      </h2>
                      <p className="theme-media-copy mt-2 max-w-sm text-sm leading-6">
                        See your current tier, billing plan, and premium access before you move into Stripe Checkout.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['Tier', subscription?.tier ?? 'free'],
                        ['Plan', subscription?.plan ?? 'free'],
                        ['Status', subscription?.status ?? 'inactive'],
                        ['Premium access', subscription?.hasPremiumAccess ? 'Yes' : 'No'],
                      ].map(([label, value]) => (
                        <div key={label} className="theme-media-panel rounded-2xl border p-4">
                          <p className="theme-media-copy text-sm">{label}</p>
                          <p className="theme-media-heading mt-2 text-2xl font-bold capitalize">{value}</p>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-[#FF6B00] bg-[#FF6B00]/10 px-5 py-4 text-sm text-[#FFB27A]">
            {error}
          </div>
        ) : null}

        {checkoutBanner ? (
          <div
            className={`rounded-2xl px-5 py-4 text-sm ${
              checkoutBanner.tone === 'success'
                ? 'border border-[#00FF88]/25 bg-[#00FF88]/10 text-[#b8ffe0]'
                : 'border border-[#FFB27A]/25 bg-[#FFB27A]/10 text-[#FFE1C2]'
            }`}
          >
            {checkoutBanner.text}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">
                Subscription
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#F7F7F7]">Current plan details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="theme-subtle-panel rounded-2xl border p-4">
                <p className="text-sm text-[#8f97ab]">Current period start</p>
                <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                  {formatDate(subscription?.currentPeriodStart)}
                </p>
              </div>
              <div className="theme-subtle-panel rounded-2xl border p-4">
                <p className="text-sm text-[#8f97ab]">Current period end</p>
                <p className="mt-2 text-lg font-semibold text-[#F7F7F7]">
                  {formatDate(subscription?.currentPeriodEnd)}
                </p>
              </div>
              <div className="theme-subtle-panel rounded-2xl border p-4">
                <p className="text-sm text-[#8f97ab]">Stripe customer</p>
                <p className="mt-2 break-all text-sm font-medium text-[#F7F7F7]">
                  {subscription?.stripeCustomerId ?? 'Not created yet'}
                </p>
              </div>
              <div className="theme-subtle-panel rounded-2xl border p-4">
                <p className="text-sm text-[#8f97ab]">Stripe subscription</p>
                <p className="mt-2 break-all text-sm font-medium text-[#F7F7F7]">
                  {subscription?.stripeSubscriptionId ?? 'No active subscription'}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00FF88]">
                Upgrade
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#F7F7F7]">Choose your billing plan</h2>
              <p className="mt-2 text-sm leading-7 text-[#aeb7cb]">
                Compare the monthly and yearly options below, then jump straight into Stripe
                Checkout.
              </p>
            </div>

            <div className="space-y-4">
              <div className="theme-subtle-panel rounded-2xl border p-4">
                <p className="text-sm text-[#8f97ab]">Billing setup readiness</p>
                <p className={`mt-2 text-xl font-bold ${isBillingReady ? 'text-[#00FF88]' : 'text-[#FFB27A]'}`}>
                  {isBillingReady ? 'Ready for test checkout' : 'Setup still needed'}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#aeb7cb]">
                  Stripe is in test mode. Use card `4242 4242 4242 4242` with any future expiry,
                  any CVC, and any ZIP code.
                </p>
              </div>

              <div className="grid gap-4">
                {billingPlans.map((plan) => {
                  const isActivePlan = activePlan === plan.key;
                  const isLoading = actionState === plan.key;

                  return (
                    <div
                      key={plan.key}
                      className={`rounded-[1.75rem] border p-5 transition-all duration-300 ${
                        isActivePlan
                          ? 'theme-billing-plan theme-billing-plan-active border-[#00FF88]/40'
                          : 'theme-billing-plan border-white/10'
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold text-[#F7F7F7]">{plan.name}</h3>
                            <span
                              className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${
                                plan.key === 'yearly'
                                  ? 'theme-billing-badge-yearly'
                                  : 'theme-billing-badge-default'
                              }`}
                            >
                              {plan.badge}
                            </span>
                            {isActivePlan ? (
                              <span className="rounded-full bg-[#00FF88]/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#7fffc3]">
                                Current plan
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-[#F7F7F7]">{plan.price}</p>
                            <p className="pb-1 text-sm font-medium text-[#8f97ab]">{plan.cadence}</p>
                          </div>
                          <p className="max-w-xl text-sm leading-7 text-[#aeb7cb]">
                            {plan.description}
                          </p>
                          <p className="theme-billing-highlight text-sm font-medium">{plan.highlight}</p>
                        </div>

                        <div className="sm:w-[190px]">
                          <Button
                            variant={plan.key === 'monthly' ? 'accent' : 'secondary'}
                            onClick={() => void handleCheckout(plan.key)}
                            isLoading={isLoading}
                            disabled={!isBillingReady || isActivePlan}
                            fullWidth
                          >
                            {isActivePlan ? `${plan.name} Active` : `Choose ${plan.name}`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="theme-subtle-panel rounded-2xl border border-dashed p-4 text-sm leading-7 text-[#9da8bf]">
                <p>Stripe configured: {configStatus?.stripeConfigured ? 'yes' : 'no'}</p>
                <p>
                  Persistence ready: {configStatus?.persistenceConfigured ? 'yes' : 'no'} (
                  {configStatus?.persistenceProvider ?? 'mongodb'})
                </p>
                <p>Monthly price set: {configStatus?.monthlyPriceConfigured ? 'yes' : 'no'}</p>
                <p>Yearly price set: {configStatus?.yearlyPriceConfigured ? 'yes' : 'no'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};
