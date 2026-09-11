import { createHmac, timingSafeEqual } from 'crypto';
import { redisManager } from '../redis/redisClient';
import { infraConfig } from '../config/env';

export class WebhookProtectionService {
  private static processedWebhookIds: Set<string> = new Set();

  /**
   * Verify HMAC-SHA256 signature against incoming raw payload
   */
  public static verifySignature(
    payload: string,
    signatureHeader: string,
    secret: string = infraConfig.WEBHOOK_SECRET_KEY
  ): boolean {
    if (!signatureHeader || !payload) return false;

    try {
      const computedSignature = createHmac('sha256', secret).update(payload).digest('hex');
      const signatureBuffer = Buffer.from(signatureHeader, 'hex');
      const computedBuffer = Buffer.from(computedSignature, 'hex');

      if (signatureBuffer.length !== computedBuffer.length) {
        return false;
      }

      return timingSafeEqual(signatureBuffer, computedBuffer);
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if a webhook event has already been processed to prevent duplicate processing
   */
  public static async checkAndRecordEvent(
    provider: string,
    eventId: string
  ): Promise<{ alreadyProcessed: boolean }> {
    const key = `khidmatik:webhook:${provider}:${eventId}`;
    const acquired = await redisManager.setnx(key, 'PROCESSED', 86400 * 1000 * 7); // 7 days retention

    if (!acquired) {
      return { alreadyProcessed: true };
    }

    if (this.processedWebhookIds.has(key)) {
      return { alreadyProcessed: true };
    }
    this.processedWebhookIds.add(key);

    return { alreadyProcessed: false };
  }
}
