import { NextRequest, NextResponse } from 'next/server';
import { IdempotencyService, IdempotencyRecord } from './idempotencyService';

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  cachedResponse?: NextResponse;
  key?: string;
  fingerprint?: string;
  errorResponse?: NextResponse;
}

export async function handleIdempotencyPreCheck(
  req: NextRequest,
  rawBody: any
): Promise<IdempotencyCheckResult> {
  const idempotencyKey =
    req.headers.get('Idempotency-Key') ||
    req.headers.get('idempotency-key') ||
    req.headers.get('x-idempotency-key');

  if (!idempotencyKey) {
    // No idempotency key provided - proceed normally
    return { isDuplicate: false };
  }

  const fingerprint = IdempotencyService.generateFingerprint(
    req.method,
    req.nextUrl.pathname,
    rawBody
  );

  const existingRecord = await IdempotencyService.getRecord(idempotencyKey);

  if (existingRecord) {
    // 1. Mismatch payload check: same key with different body
    if (existingRecord.fingerprint !== fingerprint) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Idempotency Conflict',
          message: 'This Idempotency-Key was previously used with a different request payload.',
        },
        { status: 422 }
      );
      return { isDuplicate: true, errorResponse, key: idempotencyKey, fingerprint };
    }

    // 2. Currently processing
    if (existingRecord.status === 'PROCESSING') {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Request In Progress',
          message: 'A request with this Idempotency-Key is currently being processed. Please wait.',
        },
        { status: 409, headers: { 'Retry-After': '2' } }
      );
      return { isDuplicate: true, errorResponse, key: idempotencyKey, fingerprint };
    }

    // 3. Already completed - return cached response
    if (existingRecord.status === 'COMPLETED') {
      const cachedResponse = NextResponse.json(existingRecord.responseBody, {
        status: existingRecord.responseStatus || 200,
        headers: {
          'X-Idempotent-Replay': 'true',
          'Idempotency-Key': idempotencyKey,
        },
      });
      return { isDuplicate: true, cachedResponse, key: idempotencyKey, fingerprint };
    }
  }

  // First time seeing this key: acquire processing state
  const acquired = await IdempotencyService.startProcessing(idempotencyKey, fingerprint);
  if (!acquired) {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'Concurrent Request Conflict',
        message: 'Concurrent request with the same Idempotency-Key detected.',
      },
      { status: 409 }
    );
    return { isDuplicate: true, errorResponse, key: idempotencyKey, fingerprint };
  }

  return { isDuplicate: false, key: idempotencyKey, fingerprint };
}

export async function saveIdempotentResponse(
  key?: string,
  fingerprint?: string,
  status: number = 200,
  body?: any
): Promise<void> {
  if (key && fingerprint) {
    await IdempotencyService.complete(key, fingerprint, status, body);
  }
}

export async function releaseIdempotentKey(key?: string): Promise<void> {
  if (key) {
    await IdempotencyService.fail(key);
  }
}
