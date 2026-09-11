import { infraConfig } from '../config/env';

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: any;
}

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'creditcard',
  'cardnumber',
  'cvv',
  'cookie',
  'session',
];

function sanitize(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class Logger {
  public static info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  public static warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  public static error(message: string, error?: any, context?: LogContext): void {
    const errorDetails = error instanceof Error
      ? { errorMessage: error.message, stack: error.stack }
      : { error };
    this.log('ERROR', message, { ...context, ...errorDetails });
  }

  public static debug(message: string, context?: LogContext): void {
    if (infraConfig.LOG_LEVEL === 'debug') {
      this.log('DEBUG', message, context);
    }
  }

  private static log(level: string, message: string, context?: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? sanitize(context) : {}),
    };

    if (level === 'ERROR') {
      console.error(JSON.stringify(entry));
    } else if (level === 'WARN') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}
