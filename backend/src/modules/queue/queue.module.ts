import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { QueueOptions } from 'bullmq';

import { PLAN_GENERATION_QUEUE, REDIS_CONNECTION } from './queue.constants';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const enabled = configService.get<boolean>('redis.enabled', false);
        if (!enabled) {
          return {
            connection: null as unknown as QueueOptions['connection'],
          };
        }

        return {
          connection: {
            host: configService.get<string>('redis.host', '127.0.0.1'),
            port: configService.get<number>('redis.port', 6379),
            username: configService.get<string>('redis.username'),
            password: configService.get<string>('redis.password'),
            db: configService.get<number>('redis.db', 0),
            maxRetriesPerRequest: null,
          },
        } satisfies QueueOptions;
      },
    }),
    BullModule.registerQueue(
      { name: 'ai-generation' },
      { name: 'email' },
      { name: 'plan-generation' },
    ),
  ],
  controllers: [QueueController],
  providers: [
    {
      provide: REDIS_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const enabled = configService.get<boolean>('redis.enabled', false);
        if (!enabled) {
          return null;
        }

        return {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          username: configService.get<string>('redis.username') || undefined,
          password: configService.get<string>('redis.password') || undefined,
          db: configService.get<number>('redis.db', 0),
          maxRetriesPerRequest: null,
        };
      },
    },
    {
      provide: PLAN_GENERATION_QUEUE,
      inject: [REDIS_CONNECTION],
      useFactory: (
        connection:
          | {
              host: string | undefined;
              port: number | undefined;
              username?: string;
              password?: string;
              db: number;
              maxRetriesPerRequest: null;
            }
          | null,
      ) => {
        if (!connection) {
          return null;
        }

        return new Queue('plan-generation', { connection });
      },
    },
    QueueService,
  ],
  exports: [QueueService, REDIS_CONNECTION, PLAN_GENERATION_QUEUE],
})
export class QueueModule {}
