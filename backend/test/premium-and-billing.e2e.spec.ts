import { AiController } from 'src/modules/ai/ai.controller';
import { AiService } from 'src/modules/ai/ai.service';
import { SubscriptionsController } from 'src/modules/subscriptions/subscriptions.controller';

import { authHeaders, createTestApp } from './support/test-app';

describe('Premium and billing HTTP flows', () => {
  const aiService = {
    getStatus: jest.fn(),
    getHistory: jest.fn(),
    generateWorkoutPlan: jest.fn(),
    generateDietPlan: jest.fn(),
    generateAndSaveWorkoutPlan: jest.fn(),
    generateAndSaveDietPlan: jest.fn(),
    coachChat: jest.fn(),
    estimateCalorieLog: jest.fn(),
    generateAdaptivePlan: jest.fn(),
    generateCalorieInsights: jest.fn(),
    enqueuePlanJob: jest.fn(),
  };

  const subscriptionsService = {
    getStatus: jest.fn(),
    getCurrentSubscription: jest.fn(),
    createCheckoutSession: jest.fn(),
    confirmCheckoutSession: jest.fn(),
    handleWebhook: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('blocks premium AI routes for free users', async () => {
    const { app } = await createTestApp({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: aiService },
      ],
      includePremiumGuard: true,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/ai/workout-plan',
      headers: authHeaders('free-token'),
      payload: {
        weight: '78kg',
        goal: 'muscle gain',
        experience: 'intermediate',
        trainingDaysPerWeek: 4,
        equipment: 'gym',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(aiService.generateWorkoutPlan).not.toHaveBeenCalled();

    await app.close();
  });

  it('allows premium users through the AI HTTP flow and validates payloads', async () => {
    aiService.generateWorkoutPlan.mockResolvedValue({ title: 'AI Plan' });
    aiService.getHistory.mockResolvedValue({ items: [] });

    const { app } = await createTestApp({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: aiService },
      ],
      includePremiumGuard: true,
    });

    const invalidResponse = await app.inject({
      method: 'POST',
      url: '/ai/calorie-estimate',
      headers: authHeaders('premium-token'),
      payload: {
        loggedDate: '2026-03-29',
        mealType: 'dinner',
      },
    });

    expect(invalidResponse.statusCode).toBe(400);
    expect(aiService.estimateCalorieLog).not.toHaveBeenCalled();

    const workoutPayload = {
      weight: '78kg',
      goal: 'muscle gain',
      experience: 'intermediate',
      trainingDaysPerWeek: 4,
      equipment: 'gym',
    };

    const workoutResponse = await app.inject({
      method: 'POST',
      url: '/ai/workout-plan',
      headers: authHeaders('premium-token'),
      payload: workoutPayload,
    });

    expect(workoutResponse.statusCode).toBe(201);
    expect(aiService.generateWorkoutPlan).toHaveBeenCalledWith('user-premium', workoutPayload);

    const historyResponse = await app.inject({
      method: 'GET',
      url: '/ai/history?type=coach-chat',
      headers: authHeaders('premium-token'),
    });

    expect(historyResponse.statusCode).toBe(200);
    expect(aiService.getHistory).toHaveBeenCalledWith('user-premium', undefined, 'coach-chat');

    await app.close();
  });

  it('serves subscription status and checkout confirmation through the HTTP layer', async () => {
    subscriptionsService.getStatus.mockResolvedValue({ configured: true });
    subscriptionsService.getCurrentSubscription.mockImplementation(async (userId: string) => ({
      tier: userId === 'user-premium' ? 'premium' : 'free',
      plan: userId === 'user-premium' ? 'monthly' : 'free',
      status: userId === 'user-premium' ? 'active' : 'inactive',
      hasPremiumAccess: userId === 'user-premium',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }));
    subscriptionsService.createCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
    });
    subscriptionsService.confirmCheckoutSession.mockResolvedValue({
      tier: 'premium',
      plan: 'monthly',
      status: 'active',
      hasPremiumAccess: true,
    });

    const { app } = await createTestApp({
      controllers: [SubscriptionsController],
      providers: [],
      subscriptionOverride: subscriptionsService,
    });

    const invalidCheckoutResponse = await app.inject({
      method: 'POST',
      url: '/subscriptions/checkout-session',
      headers: authHeaders('free-token'),
      payload: {
        plan: 'weekly',
        successUrl: 'http://localhost:5173/billing/success',
        cancelUrl: 'http://localhost:5173/billing',
      },
    });

    expect(invalidCheckoutResponse.statusCode).toBe(400);
    expect(subscriptionsService.createCheckoutSession).not.toHaveBeenCalled();

    const statusResponse = await app.inject({
      method: 'GET',
      url: '/subscriptions/status',
      headers: authHeaders('free-token'),
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(subscriptionsService.getStatus).toHaveBeenCalled();

    const checkoutResponse = await app.inject({
      method: 'POST',
      url: '/subscriptions/checkout-session',
      headers: authHeaders('free-token'),
      payload: {
        plan: 'monthly',
        successUrl: 'http://localhost:5173/billing/success',
        cancelUrl: 'http://localhost:5173/billing',
      },
    });

    expect(checkoutResponse.statusCode).toBe(201);
    expect(subscriptionsService.createCheckoutSession).toHaveBeenCalledWith('user-free', {
      plan: 'monthly',
      successUrl: 'http://localhost:5173/billing/success',
      cancelUrl: 'http://localhost:5173/billing',
    });

    const confirmResponse = await app.inject({
      method: 'POST',
      url: '/subscriptions/checkout-session/confirm',
      headers: authHeaders('premium-token'),
      payload: {
        sessionId: 'cs_test_123',
      },
    });

    expect(confirmResponse.statusCode).toBe(201);
    expect(subscriptionsService.confirmCheckoutSession).toHaveBeenCalledWith(
      'user-premium',
      'cs_test_123',
    );

    await app.close();
  });
});
