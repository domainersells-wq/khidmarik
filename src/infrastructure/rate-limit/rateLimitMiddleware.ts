import { NextRequest, NextResponse } from 'next/server';
import { TokenBucketLimiter, RateLimitResult, RateLimitConfig } from './tokenBucketLimiter';
import { infraConfig } from '../config/env';

export const RateLimitPresets: Record<string, RateLimitConfig> = {
  // Auth routes (Login, register, OTP): 5 req max, 1 token refilled every 12 sec (0.0833/sec)
  AUTH: {
    capacity: infraConfig.RATE_LIMIT_LOGIN,
    refillRatePerSec: infraConfig.RATE_LIMIT_LOGIN / infraConfig.RATE_LIMIT_WINDOW_SECS,
  },
  // Public browsing / search: 30 req max, 0.5 tokens/sec
  PUBLIC: {
    capacity: infraConfig.RATE_LIMIT_PUBLIC,
    refillRatePerSec: infraConfig.RATE_LIMIT_PUBLIC / infraConfig.RATE_LIMIT_WINDOW_SECS,
  },
  // Authenticated business operations (Orders, bookings, reviews): 60 req max, 1 token/sec
  AUTHENTICATED: {
    capacity: infraConfig.RATE_LIMIT_API,
    refillRatePerSec: infraConfig.RATE_LIMIT_API / infraConfig.RATE_LIMIT_WINDOW_SECS,
  },
  // High-sensitivity financial operations (Payments, withdrawals, refunds): 5 req max
  SENSITIVE: {
    capacity: infraConfig.RATE_LIMIT_PAYMENT,
    refillRatePerSec: infraConfig.RATE_LIMIT_PAYMENT / infraConfig.RATE_LIMIT_WINDOW_SECS,
  },
  // Admin dashboard operations
  ADMIN: {
    capacity: 120,
    refillRatePerSec: 2,
  },
};

export function extractClientIdentifier(req: NextRequest): string {
  // 1. Authenticated User ID from authorization header / custom user header
  const authUserId = req.headers.get('x-user-id');
  if (authUserId) return `user:${authUserId}`;

  // 2. Client IP Address from standard proxies (Vercel, Cloudflare, Nginx)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    return `ip:${firstIp}`;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp}`;

  return 'ip:127.0.0.1';
}

export async function checkRateLimit(
  req: NextRequest,
  preset: keyof typeof RateLimitPresets = 'AUTHENTICATED',
  customIdentifier?: string
): Promise<{ allowed: boolean; response?: NextResponse; result: RateLimitResult }> {
  const config = RateLimitPresets[preset] || RateLimitPresets.AUTHENTICATED;
  const identifier = customIdentifier || extractClientIdentifier(req);
  const endpointGroup = `${req.method}:${req.nextUrl.pathname}`;

  const result = await TokenBucketLimiter.consume(endpointGroup, identifier, config);

  if (!result.allowed) {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded for ${endpointGroup}. Please retry in ${result.retryAfterSeconds} seconds.`,
        retryAfter: result.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetInSeconds.toString(),
          'Retry-After': result.retryAfterSeconds.toString(),
        },
      }
    );

    return { allowed: false, response: errorResponse, result };
  }

  return { allowed: true, result };
}

export function applyRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetInSeconds.toString());
  return response;
}
