import { CanActivate, Injectable, Provider, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyRequest } from 'fastify';

import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PremiumGuard } from 'src/common/guards/premium.guard';
import { RefreshJwtAuthGuard } from 'src/modules/auth/guards/refresh-jwt-auth.guard';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';

type UserKey = 'free' | 'premium' | 'admin';

type TestAppOptions = {
  controllers: Array<new (...args: any[]) => unknown>;
  providers: Provider[];
  includePremiumGuard?: boolean;
  subscriptionOverride?: Partial<SubscriptionsService>;
};

const TEST_USERS: Record<UserKey, JwtPayload> = {
  free: {
    sub: 'user-free',
    email: 'free@fitnova.test',
    roles: [Role.USER],
  },
  premium: {
    sub: 'user-premium',
    email: 'premium@fitnova.test',
    roles: [Role.USER],
  },
  admin: {
    sub: 'user-admin',
    email: 'admin@fitnova.test',
    roles: [Role.ADMIN],
  },
};

function resolveUserFromToken(token?: string): JwtPayload | undefined {
  switch (token) {
    case 'premium-token':
      return TEST_USERS.premium;
    case 'admin-token':
      return TEST_USERS.admin;
    case 'free-token':
      return TEST_USERS.free;
    default:
      return undefined;
  }
}

@Injectable()
class TestJwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: import('@nestjs/common').ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPayload }>();
    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length)
      : undefined;

    const user = resolveUserFromToken(token);
    if (!user) {
      return false;
    }

    request.user = user;
    return true;
  }
}

const testRefreshGuard = {
  canActivate(context: import('@nestjs/common').ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPayload }>();
    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length)
      : undefined;
    const user = resolveUserFromToken(token);

    if (!user) {
      return false;
    }

    request.user = user;
    return true;
  },
};

export async function createTestApp({
  controllers,
  providers,
  includePremiumGuard = false,
  subscriptionOverride,
}: TestAppOptions): Promise<{
  app: NestFastifyApplication;
  moduleRef: TestingModule;
  subscriptionsServiceMock: Partial<SubscriptionsService>;
}> {
  const subscriptionsServiceMock: Partial<SubscriptionsService> = {
    getCurrentSubscription: async (userId: string) => ({
      tier: userId === TEST_USERS.premium.sub ? 'premium' : 'free',
      plan: userId === TEST_USERS.premium.sub ? 'monthly' : 'free',
      status: userId === TEST_USERS.premium.sub ? 'active' : 'inactive',
      hasPremiumAccess: userId === TEST_USERS.premium.sub,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }),
    ...subscriptionOverride,
  };

  const moduleRef = await Test.createTestingModule({
    controllers,
    providers: [
      ...providers,
      {
        provide: RefreshJwtAuthGuard,
        useValue: testRefreshGuard,
      },
      {
        provide: SubscriptionsService,
        useValue: subscriptionsServiceMock,
      },
      {
        provide: APP_GUARD,
        useClass: TestJwtAuthGuard,
      },
      ...(includePremiumGuard
        ? [
            {
              provide: APP_GUARD,
              useClass: PremiumGuard,
            },
          ]
        : []),
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return {
    app,
    moduleRef,
    subscriptionsServiceMock,
  };
}

export function authHeaders(token: 'free-token' | 'premium-token' | 'admin-token' = 'free-token') {
  return {
    authorization: `Bearer ${token}`,
  };
}
