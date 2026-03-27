import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRES_PREMIUM_KEY } from '../decorators/premium.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiresPremium = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_PREMIUM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresPremium) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPayload }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.roles.includes(Role.ADMIN)) {
      return true;
    }

    const subscription = await this.subscriptionsService.getCurrentSubscription(user.sub);
    if (subscription.hasPremiumAccess) {
      return true;
    }

    throw new ForbiddenException(
      'Premium subscription required. Upgrade in billing to use this feature.',
    );
  }
}
