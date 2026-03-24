import { Inject, Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PLAN_GENERATION_QUEUE, REDIS_CONNECTION } from './queue.constants';

@Injectable()
export class QueueService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CONNECTION)
    private readonly redisConnection:
      | {
          host: string | undefined;
          port: number | undefined;
          username?: string;
          password?: string;
          db: number;
          maxRetriesPerRequest: null;
        }
      | null,
    @Inject(PLAN_GENERATION_QUEUE) private readonly planGenerationQueue: Queue | null,
  ) {}

  getStatus() {
    return {
      enabled: !!this.redisConnection && !!this.planGenerationQueue,
      queueName: this.planGenerationQueue?.name ?? 'plan-generation',
    };
  }

  async enqueuePlanGenerationJob(name: string, payload: Record<string, unknown>) {
    if (!this.planGenerationQueue) {
      throw new ServiceUnavailableException(
        'Redis/BullMQ is not enabled. Set REDIS_ENABLED=true and provide Redis connection settings.',
      );
    }

    return this.planGenerationQueue.add(name, payload, {
      removeOnComplete: 50,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async onModuleDestroy() {
    if (this.planGenerationQueue) {
      await this.planGenerationQueue.close();
    }
  }
}
