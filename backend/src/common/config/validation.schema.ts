import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(4000),
  APP_NAME: Joi.string().default('FitNova AI'),
  APP_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  MONGODB_URI: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_TTL: Joi.string().required(),
  BCRYPT_SALT_ROUNDS: Joi.number().min(10).default(12),
  OPENAI_API_KEY: Joi.string().allow('', null),
  OPENAI_MODEL: Joi.string().default('gpt-5'),
  REDIS_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  REDIS_HOST: Joi.string().hostname().default('127.0.0.1'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_USERNAME: Joi.string().allow('', null),
  REDIS_PASSWORD: Joi.string().allow('', null),
  REDIS_DB: Joi.number().min(0).default(0),
});
