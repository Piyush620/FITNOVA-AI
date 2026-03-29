import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { loggerFactory } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: process.env.APP_TRUST_PROXY === 'true',
    }),
    { rawBody: true },
  );
  app.useLogger(loggerFactory.createLogger('NestApplication'));
  const configService = app.get(ConfigService);
  const appLogger = loggerFactory.createLogger('Bootstrap');
  const isProduction = configService.get<boolean>('app.isProduction', false);
  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled', !isProduction);
  const allowLocalhostOrigins = configService.get<boolean>('app.corsAllowLocalhost', !isProduction);
  const configuredOrigins = configService.get<string>(
    'app.origin',
    'http://localhost:3000,http://localhost:5173',
  );
  const allowedOrigins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowLocalhostOrigins) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
  }

  const uniqueAllowedOrigins = Array.from(new Set(allowedOrigins));

  if (isProduction && uniqueAllowedOrigins.length === 0) {
    throw new Error('APP_ORIGIN must include at least one allowed origin in production.');
  }

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || uniqueAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });
  await app.register(cookie, {
    secret: configService.get<string>('auth.refreshSecret'),
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FitNova AI API')
      .setDescription('AI-powered fitness SaaS backend APIs for auth, users, coaching, and plan generation.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument, {
      useGlobalPrefix: true,
      customSiteTitle: 'FitNova AI API Docs',
    });
  }

  const port = configService.get<number>('app.port', 4000);
  await app.listen({ port, host: '0.0.0.0' });
  appLogger.log('FitNova API started', {
    port,
    env: configService.get<string>('app.env', 'development'),
    swaggerEnabled,
    allowedOrigins: uniqueAllowedOrigins,
  });
}

bootstrap();
