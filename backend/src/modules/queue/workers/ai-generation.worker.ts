import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export interface AiGenerationJobPayload {
  userId: string;
  type: 'workout' | 'diet';
  payload: Record<string, unknown>;
}

@Processor('ai-generation')
export class AiGenerationWorker extends WorkerHost {
  private readonly logger = new Logger(AiGenerationWorker.name);

  async process(job: Job<AiGenerationJobPayload>) {
    this.logger.log(`Processing AI generation job`, {
      jobId: job.id,
      userId: job.data.userId,
      type: job.data.type,
    });

    try {
      // Simulate AI generation - in production, this would call your AI service
      const { userId, type, payload: _payload } = job.data;

      // Log progress
      await job.updateProgress(25);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await job.updateProgress(50);

      // In production: call AI service here
      // const aiResponse = await this.aiService.generate(type, payload);

      await job.updateProgress(75);

      // In production: save to database
      // await this.plansService.savePlan(userId, aiResponse);

      await job.updateProgress(100);

      this.logger.log(
        `AI generation job completed`,
        {
          jobId: job.id,
          userId,
          type,
        },
      );

      return {
        success: true,
        userId,
        type,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `AI generation job failed`,
        {
          jobId: job.id,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job failed after all retries`,
      {
        jobId: job.id,
        attemptsMade: job.attemptsMade,
        error: error.message,
      },
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job started`, { jobId: job.id });
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.debug(`Job progress`, { jobId: job.id, progress });
  }
}
