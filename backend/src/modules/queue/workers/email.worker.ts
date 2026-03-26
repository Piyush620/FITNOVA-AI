import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export interface EmailJobPayload {
  email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

@Processor('email')
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  async process(job: Job<EmailJobPayload>) {
    const { email, subject, template, data } = job.data;

    this.logger.log(`Processing email job`, {
      jobId: job.id,
      email,
      template,
    });

    try {
      await job.updateProgress(25);

      // In production: compile email template
      // const html = await this.emailService.renderTemplate(template, data);

      await job.updateProgress(50);

      // In production: send via SendGrid, SES, or similar
      // await this.emailService.send({
      //   to: email,
      //   subject,
      //   html,
      // });

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 500));

      await job.updateProgress(100);

      this.logger.log(`Email sent successfully`, {
        jobId: job.id,
        email,
      });

      return {
        success: true,
        email,
        subject,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email`,
        {
          jobId: job.id,
          email,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Email job failed after all retries`,
      {
        jobId: job.id,
        email: job.data.email,
        attempts: job.attemptsMade,
        error: error.message,
      },
    );
    // In production: send alert or save to dead letter queue
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Email job started`, {
      jobId: job.id,
      email: job.data.email,
    });
  }
}
