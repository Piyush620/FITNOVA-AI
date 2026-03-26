import { Logger as NestLogger } from '@nestjs/common';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const customFormat = printf(
  ({ level, message, timestamp: ts, ...meta }) => {
    const baseMeta = {
      timestamp: ts,
      level,
      message,
    };
    return JSON.stringify({ ...baseMeta, ...meta });
  },
);

const loggerInstance = winston.createLogger({
  format: combine(
    colorize(),
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat,
  ),
  defaultMeta: { service: 'fitnova-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        printf(({ level, message, timestamp: ts, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `[${ts}] [${level}] ${message}${metaStr}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat,
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat,
      ),
    }),
  ],
});

export class Logger extends NestLogger {
  private extractLogPayload(optionalParams: unknown[]) {
    const payload: Record<string, unknown> = {};
    let context: string | undefined;

    for (const param of optionalParams) {
      if (typeof param === 'string' && context === undefined) {
        context = param;
        continue;
      }

      if (param && typeof param === 'object') {
        Object.assign(payload, param);
      }
    }

    return {
      context,
      meta: Object.keys(payload).length > 0 ? payload : undefined,
    };
  }

  log(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.extractLogPayload(optionalParams);
    loggerInstance.info(String(message), { context, ...meta });
    super.log(message, context);
  }

  error(message: any, ...optionalParams: any[]) {
    let trace: string | undefined;
    let context: string | undefined;
    const meta: Record<string, unknown> = {};

    for (const param of optionalParams) {
      if (typeof param === 'string' && trace === undefined) {
        trace = param;
        continue;
      }

      if (typeof param === 'string' && context === undefined) {
        context = param;
        continue;
      }

      if (param && typeof param === 'object' && !Array.isArray(param)) {
        Object.assign(meta, param);
      }
    }

    loggerInstance.error(String(message), {
      ...(typeof trace === 'string' ? { stack: trace } : {}),
      ...(typeof context === 'string' ? { context } : {}),
      ...meta,
    });
    super.error(
      message,
      typeof trace === 'string' ? trace : undefined,
      typeof context === 'string' ? context : undefined,
    );
  }

  warn(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.extractLogPayload(optionalParams);
    loggerInstance.warn(String(message), { context, ...meta });
    super.warn(message, context);
  }

  debug(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.extractLogPayload(optionalParams);
    loggerInstance.debug(String(message), { context, ...meta });
    super.debug(message, context);
  }

  verbose(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.extractLogPayload(optionalParams);
    loggerInstance.verbose(String(message), { context, ...meta });
    super.verbose(message, context);
  }
}

export const loggerFactory = {
  createLogger: (context: string) => new Logger(context),
};
