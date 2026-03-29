import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { StringValue } from 'ms';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PremiumGuard } from 'src/common/guards/premium.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { User, UserSchema } from './schemas/user.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    SubscriptionsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('auth.accessTtl') as StringValue,
        },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    JwtStrategy,
    RefreshTokenStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PremiumGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
