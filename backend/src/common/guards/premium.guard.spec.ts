import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { PremiumGuard } from './premium.guard';

describe('PremiumGuard', () => {
  let guard: PremiumGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let subscriptionsService: { getCurrentSubscription: jest.Mock };

  const createContext = (user?: { sub: string; roles: string[] }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    subscriptionsService = {
      getCurrentSubscription: jest.fn(),
    };

    guard = new PremiumGuard(reflector as never, subscriptionsService as never);
  });

  it('allows requests when premium is not required', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('allows premium users through', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    subscriptionsService.getCurrentSubscription.mockResolvedValue({
      hasPremiumAccess: true,
    });

    await expect(
      guard.canActivate(createContext({ sub: 'user-1', roles: ['user'] })),
    ).resolves.toBe(true);
  });

  it('allows admins through without subscription lookup', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    await expect(
      guard.canActivate(createContext({ sub: 'admin-1', roles: ['admin'] })),
    ).resolves.toBe(true);
    expect(subscriptionsService.getCurrentSubscription).not.toHaveBeenCalled();
  });

  it('blocks free users from premium routes', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    subscriptionsService.getCurrentSubscription.mockResolvedValue({
      hasPremiumAccess: false,
    });

    await expect(
      guard.canActivate(createContext({ sub: 'user-1', roles: ['user'] })),
    ).rejects.toThrow(ForbiddenException);
  });
});
