import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { Logger } from '../logger/logger.service';

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
  setHeader?: (name: string, value: string) => void;
  on: (event: 'finish', listener: () => void) => void;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogging');

  use(req: RequestWithCorrelationId, res: ResponseLike, next: NextFunction) {
    const incomingCorrelationIdHeader = req.headers?.['x-correlation-id'];
    const correlationId =
      (Array.isArray(incomingCorrelationIdHeader)
        ? incomingCorrelationIdHeader[0]
        : incomingCorrelationIdHeader) || uuidv4();
    req.correlationId = correlationId;
    res.setHeader?.('x-correlation-id', correlationId);

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

      this.logger.log(
        `Outgoing response`,
        {
          correlationId,
          method,
          url,
          statusCode,
          durationMs: duration,
          contentLength,
        },
        'RequestLogging',
      );
    });

    next();
  }
}
