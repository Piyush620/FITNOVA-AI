import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

type RequestWithBody = FastifyRequest & {
  body?: {
    refreshToken?: string;
  };
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: RequestWithBody) => request?.body?.refreshToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(request: RequestWithBody, payload: JwtPayload) {
    if (!request.body?.refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    return payload;
  }
}
