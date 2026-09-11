import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().default('khidmatik'),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().default(5000),
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().default(3000),
  REDIS_MAX_RETRIES: z.coerce.number().default(5),

  // Database Connection Pool
  DATABASE_URL: z.string().optional(),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(20),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  DB_SLOW_QUERY_THRESHOLD_MS: z.coerce.number().default(200),

  // Rate Limiting (Token Bucket)
  RATE_LIMIT_LOGIN: z.coerce.number().default(5), // 5 requests per window
  RATE_LIMIT_REGISTER: z.coerce.number().default(3),
  RATE_LIMIT_API: z.coerce.number().default(60), // standard authenticated API
  RATE_LIMIT_PUBLIC: z.coerce.number().default(30), // public search & browsing
  RATE_LIMIT_PAYMENT: z.coerce.number().default(5),
  RATE_LIMIT_WITHDRAWAL: z.coerce.number().default(3),
  RATE_LIMIT_WINDOW_SECS: z.coerce.number().default(60),

  // Distributed Lock
  LOCK_DEFAULT_TTL_MS: z.coerce.number().default(10000),
  LOCK_RETRY_DELAY_MS: z.coerce.number().default(100),
  LOCK_MAX_RETRIES: z.coerce.number().default(30),

  // Idempotency
  IDEMPOTENCY_TTL_SECS: z.coerce.number().default(86400), // 24 hours

  // Queues & Workers
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  WORKER_MAX_RETRIES: z.coerce.number().default(3),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().default(2000),
  OUTBOX_BATCH_SIZE: z.coerce.number().default(50),

  // Observability & Security
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  WEBHOOK_SECRET_KEY: z.string().default('khidmatik_default_webhook_secret_2026'),
});

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.format());
    return envSchema.parse({}); // fallback to defaults in development
  }
  return parsed.data;
}

export const infraConfig = parseEnv();
export type InfraConfig = typeof infraConfig;
