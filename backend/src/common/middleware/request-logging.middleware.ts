import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface RequestWithCorrelationId {
  correlationId?: string;
  method?: string;
  url?: string;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
}

interface ResponseLike {
  statusCode?: number;
  getHeader?: (name: string) => number | string | string[] | undefined;
  on: (event: 'finish', listener: () => void) => void;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogging');

  use(req: RequestWithCorrelationId, res: ResponseLike, next: NextFunction) {
    const correlationId = uuidv4();
    req.correlationId = correlationId;

    const startTime = Date.now();
    const method = req.method ?? 'UNKNOWN';
    const url = req.url ?? '';
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const userAgentHeader = req.headers?.['user-agent'];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader.join(', ')
      : userAgentHeader;

    this.logger.log(
      `Incoming request`,
      {
        correlationId,
        method,
        url,
        ip,
        userAgent,
      },
    );

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode ?? 200;
      const contentLength = res.getHeader?.('content-length');

      Logger.log(
        `Outgoing response`,
        JSON.stringify({
          correlationId,
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          contentLength,
        }),
        'RequestLogging',
      );
    });

    next();
  }
}
