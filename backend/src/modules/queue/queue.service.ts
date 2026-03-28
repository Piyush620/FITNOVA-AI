import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';

import type { AdaptivePlanDto } from '../ai/dto/adaptive-plan.dto';
import type { GenerateDietPlanDto } from '../ai/dto/generate-diet-plan.dto';
import type { GenerateWorkoutPlanDto } from '../ai/dto/generate-workout-plan.dto';
import { PLAN_GENERATION_QUEUE, REDIS_CONNECTION } from './queue.constants';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private planGenerationWorker: Worker<Record<string, unknown>, unknown, string> | null = null;
  private planGenerationEvents: QueueEvents | null = null;

  constructor(
    private readonly moduleRef: ModuleRef,
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

  async onModuleInit() {
    if (!this.redisConnection || !this.planGenerationQueue) {
      this.logger.log('BullMQ workers are disabled because Redis is not configured.');
      return;
    }

    this.planGenerationWorker = new Worker(
      this.planGenerationQueue.name,
      async (job) => this.processPlanGenerationJob(job),
      {
        connection: this.redisConnection,
        concurrency: 2,
      },
    );

    this.planGenerationEvents = new QueueEvents(this.planGenerationQueue.name, {
      connection: this.redisConnection,
    });

    this.planGenerationWorker.on('active', (job) => {
      this.logger.log('Plan generation job started', {
        jobId: job.id,
        name: job.name,
        attemptsMade: job.attemptsMade,
      });
    });

    this.planGenerationWorker.on('progress', (job, progress) => {
      this.logger.debug('Plan generation job progress', {
        jobId: job.id,
        name: job.name,
        progress,
      });
    });

    this.planGenerationWorker.on('completed', (job, result) => {
      this.logger.log('Plan generation job completed', {
        jobId: job.id,
        name: job.name,
        attemptsMade: job.attemptsMade,
        result,
      });
    });

    this.planGenerationWorker.on('failed', (job, error) => {
      const attemptsMade = job?.attemptsMade ?? 0;
      const totalAttempts = job?.opts.attempts ?? attemptsMade;
      const baseMeta = {
        jobId: job?.id,
        name: job?.name,
        attemptsMade,
        totalAttempts,
        willRetry: attemptsMade < totalAttempts,
        error: error.message,
        stack: error.stack,
      };

      if (attemptsMade < totalAttempts) {
        this.logger.warn('Plan generation job failed and will retry', baseMeta);
        return;
      }

      this.logger.error('Plan generation job failed after all retries', baseMeta);
    });

    this.planGenerationWorker.on('error', (error) => {
      this.logger.error('Plan generation worker error', {
        error: error.message,
        stack: error.stack,
      });
    });

    this.planGenerationEvents.on('stalled', ({ jobId }) => {
      this.logger.warn('Plan generation job stalled', { jobId });
    });

    this.logger.log('BullMQ plan-generation worker started', {
      queueName: this.planGenerationQueue.name,
    });
  }

  getStatus() {
    return {
      enabled: !!this.redisConnection && !!this.planGenerationQueue,
      queueName: this.planGenerationQueue?.name ?? 'plan-generation',
      workerRunning: !!this.planGenerationWorker,
    };
  }

  async enqueuePlanGenerationJob(name: string, payload: Record<string, unknown>) {
    if (!this.planGenerationQueue) {
      throw new ServiceUnavailableException(
        'Redis/BullMQ is not enabled. Set REDIS_ENABLED=true and provide Redis connection settings.',
      );
    }

    const job = await this.planGenerationQueue.add(name, payload, {
      removeOnComplete: 50,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    this.logger.log('Queued plan generation job', {
      jobId: job.id,
      name: job.name,
      queueName: job.queueName,
      attempts: job.opts.attempts,
    });

    return job;
  }

  async getQueueStats() {
    if (!this.planGenerationQueue) {
      return {
        enabled: false,
        message: 'Queue system not enabled',
      };
    }

    try {
      const counts = await this.planGenerationQueue.getJobCounts(
        'active',
        'completed',
        'delayed',
        'failed',
        'paused',
        'prioritized',
        'waiting',
        'waiting-children',
      );
      return {
        enabled: true,
        planGeneration: counts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        enabled: false,
        error: error instanceof Error ? error.message : 'Failed to get queue stats',
      };
    }
  }

  private async processPlanGenerationJob(job: Job<Record<string, unknown>, unknown, string>) {
    const { AiService } = await import('../ai/ai.service');
    const aiService = this.moduleRef.get(AiService, { strict: false });

    if (!aiService) {
      throw new ServiceUnavailableException('AI service is not available for queued plan processing.');
    }

    const userId = this.getRequiredUserId(job);
    const payload = this.getJobPayload(job);

    await job.updateProgress(5);

    switch (job.name) {
      case 'workout-plan': {
        const result = await aiService.generateAndSaveWorkoutPlan(
          userId,
          payload as unknown as GenerateWorkoutPlanDto,
        );
        await job.updateProgress(100);
        return {
          queued: true,
          type: 'workout-plan',
          generatedAt: result.generatedAt,
          saved: result.saved,
          planId: result.plan.id,
        };
      }
      case 'diet-plan': {
        const result = await aiService.generateAndSaveDietPlan(
          userId,
          payload as unknown as GenerateDietPlanDto,
        );
        await job.updateProgress(100);
        return {
          queued: true,
          type: 'diet-plan',
          generatedAt: result.generatedAt,
          saved: result.saved,
          planId: result.plan.id,
        };
      }
      case 'adaptive-check-in': {
        const result = await aiService.generateAdaptivePlan(
          userId,
          payload as unknown as AdaptivePlanDto,
        );
        await job.updateProgress(100);
        return {
          queued: true,
          type: 'adaptive-check-in',
          generatedAt: result.generatedAt,
        };
      }
      default:
        throw new ServiceUnavailableException(`Unsupported queued job type: ${job.name}`);
    }
  }

  private getRequiredUserId(job: Job<Record<string, unknown>, unknown, string>) {
    const userId = job.data.userId;

    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new ServiceUnavailableException('Queued plan job is missing a valid userId.');
    }

    return userId;
  }

  private getJobPayload(job: Job<Record<string, unknown>, unknown, string>) {
    const { userId: _userId, requestedAt: _requestedAt, ...payload } = job.data;
    return payload;
  }

  async onModuleDestroy() {
    if (this.planGenerationEvents) {
      await this.planGenerationEvents.close();
    }

    if (this.planGenerationWorker) {
      await this.planGenerationWorker.close();
    }

    if (this.planGenerationQueue) {
      await this.planGenerationQueue.close();
    }
  }
}
