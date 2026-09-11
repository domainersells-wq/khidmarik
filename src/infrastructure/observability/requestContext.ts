import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

export interface RequestContextData {
  requestId: string;
  correlationId: string;
  userId?: string;
  startTime: number;
}

export class RequestContext {
  public static extract(req: NextRequest): RequestContextData {
    const requestId =
      req.headers.get('x-request-id') ||
      req.headers.get('request-id') ||
      randomUUID();

    const correlationId =
      req.headers.get('x-correlation-id') ||
      req.headers.get('correlation-id') ||
      requestId;

    const userId = req.headers.get('x-user-id') || undefined;

    return {
      requestId,
      correlationId,
      userId,
      startTime: Date.now(),
    };
  }
}
