const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'FitNova AI',
    env: nodeEnv,
    isProduction,
    port: Number(process.env.PORT ?? 4000),
    origin: process.env.APP_ORIGIN ?? 'http://localhost:3000,http://localhost:5173',
    trustProxy: process.env.APP_TRUST_PROXY === 'true',
    swaggerEnabled: process.env.SWAGGER_ENABLED ? process.env.SWAGGER_ENABLED === 'true' : !isProduction,
    corsAllowLocalhost:
      process.env.CORS_ALLOW_LOCALHOST ? process.env.CORS_ALLOW_LOCALHOST === 'true' : !isProduction,
  },
  database: {
    mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/fitnova-ai',
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change_me_access_secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change_me_refresh_secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  },
  ai: {
    provider: process.env.AI_PROVIDER ?? 'gemini',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  },
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB ?? 0),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceMonthly: process.env.STRIPE_PRICE_MONTHLY,
    priceYearly: process.env.STRIPE_PRICE_YEARLY,
  },
  postgres: {
    url: process.env.POSTGRES_URL,
  },
  rateLimit: {
    globalTtl: Number(process.env.GLOBAL_RATE_LIMIT_TTL ?? 60000),
    globalLimit: Number(process.env.GLOBAL_RATE_LIMIT ?? 100),
    aiTtl: Number(process.env.AI_RATE_LIMIT_TTL ?? 60000),
    aiLimit: Number(process.env.AI_RATE_LIMIT ?? 12),
  },
  logging: {
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    writeToFiles: process.env.LOG_TO_FILES === 'true',
  },
});
