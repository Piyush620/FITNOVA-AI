import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const response = context.getResponse<FastifyReply>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message?: unknown }).message
        : isHttpException
          ? exception.message
          : 'Internal server error';
    const correlationId =
      (request as FastifyRequest & { correlationId?: string }).correlationId ?? 'n/a';

    if (!isHttpException || status >= 500) {
      this.logger.error(
        `Request failed [${request.method} ${request.url}]`,
        exception instanceof Error ? exception.stack : undefined,
        {
          statusCode: status,
          method: request.method,
          path: request.url,
          correlationId,
          ip: request.ip,
        },
      );
    }

    response.code(status).send({
      statusCode: status,
      message,
      path: request.url,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
