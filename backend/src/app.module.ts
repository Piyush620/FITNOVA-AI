import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import configuration from './common/config/configuration';
import { validationSchema } from './common/config/validation.schema';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalorieLogsModule } from './modules/calorie-logs/calorie-logs.module';
import { DietModule } from './modules/diet/diet.module';
import { ProgressModule } from './modules/progress/progress.module';
import { QueueModule } from './modules/queue/queue.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SystemModule } from './modules/system/system.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongodbUri'),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('rateLimit.globalTtl', 60000),
          limit: configService.get<number>('rateLimit.globalLimit', 100),
        },
      ],
    }),
    QueueModule,
    SystemModule,
    AuthModule,
    UsersModule,
    CalorieLogsModule,
    WorkoutsModule,
    DietModule,
    ProgressModule,
    SubscriptionsModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
