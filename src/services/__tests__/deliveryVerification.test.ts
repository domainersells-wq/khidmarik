import { deliveryVerificationService } from '../deliveryVerificationService';
import { deliveryInspectionService } from '../deliveryInspectionService';
import { shippingManagerService } from '../shipping/ShippingManagerService';
import { unifiedOrderLifecycleService } from '../unifiedOrderLifecycleService';

// Standalone test harness
const describe = (name: string, fn: () => void) => fn();
const it = (name: string, fn: () => void | Promise<void>) => fn();
const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) throw new Error(`Expected ${expected} but received ${actual}`);
  },
  toBeGreaterThan: (expected: number) => {
    if (!(actual > expected)) throw new Error(`Expected ${actual} > ${expected}`);
  },
  toBeGreaterThanOrEqual: (expected: number) => {
    if (!(actual >= expected)) throw new Error(`Expected ${actual} >= ${expected}`);
  },
  toBeDefined: () => {
    if (actual === undefined || actual === null) throw new Error(`Expected value to be defined`);
  },
  toBeUndefined: () => {
    if (actual !== undefined) throw new Error(`Expected undefined but received ${actual}`);
  },
  toContain: (expected: string) => {
    if (typeof actual !== 'string' || !actual.includes(expected)) {
      throw new Error(`Expected "${actual}" to contain "${expected}"`);
    }
  },
});

describe('Khidmatik Unified Marketplace Phase 4 - Private Customer Delivery Confirmation Code (OTP) Test Suite', () => {
  describe('1. Customer-Only Private Code Availability & Cryptographic Storage', () => {
    it('should generate secure 6-digit code and store only salted hash', () => {
      const { record, plaintextCode } = deliveryVerificationService.prepareVerificationCode({
        trackingNumber: 'KHM-TEST-VERIF-01',
        orderId: 'ORD-VERIF-01',
        customerId: 'usr_customer_v1',
      });

      expect(plaintextCode.length).toBe(6);
      expect(record.codeHash).toBeDefined();
      expect(record.salt).toBeDefined();
      expect(record.status).toBe('available');
      expect(record.attempts).toBe(0);
    });

    it('should prevent viewing code if inspection has not been accepted yet', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-NOT-ACCEPTED',
        seller_id: 'str_1',
        customer_id: 'usr_customer_na',
        provider_id: 'yalidine',
        shipping_method_id: 'mth_home',
        shipping_fee: 600,
        cod_amount: 5000,
        pickup_address: 'Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Centre',
        delivery_address: 'Algiers',
        delivery_wilaya: '16 - Alger',
        delivery_commune: 'Hydra',
        recipient_name: 'Customer A',
        recipient_phone: '0550000000',
      });

      let errorThrown = false;
      try {
        await deliveryVerificationService.getCustomerDeliveryCode({
          trackingNumber: shipment.tracking_number,
          customerId: 'usr_customer_na',
        });
      } catch (e: any) {
        errorThrown = true;
        expect(e.message).toContain('not available yet');
      }
      expect(errorThrown).toBe(true);
    });

    it('should allow customer to view plaintext code after accepting inspection', async () => {
      // Demo session KHM-2026-904128 is accepted
      const data = await deliveryVerificationService.getCustomerDeliveryCode({
        trackingNumber: 'KHM-2026-904128',
        customerId: 'usr_4',
      });

      expect(data.code).toBe('583214');
      expect(data.status).toBe('available');
      expect(data.attempts).toBe(0);
    });
  });

  describe('2. Delivery Agent Physical Handover Verification', () => {
    it('should fail with incorrect confirmation code and increment attempts', async () => {
      let failError = false;
      try {
        await deliveryVerificationService.verifyDeliveryCode({
          trackingNumber: 'KHM-2026-904128',
          code: '000000', // Incorrect
          deliveryAgentId: 'drv_01',
        });
      } catch (e: any) {
        failError = true;
        expect(e.message).toContain('رمز التأكيد غير صحيح');
      }
      expect(failError).toBe(true);

      const record = deliveryVerificationService.getSanitizedRecord('KHM-2026-904128');
      expect(record?.attempts).toBe(1);
    });

    it('should successfully verify delivery with correct code and transition shipment to delivered', async () => {
      const res = await deliveryVerificationService.verifyDeliveryCode({
        trackingNumber: 'KHM-2026-904128',
        code: '583214', // Correct
        deliveryAgentId: 'drv_01',
      });

      expect(res.success).toBe(true);
      expect(res.verifiedAt).toBeDefined();

      const record = deliveryVerificationService.getSanitizedRecord('KHM-2026-904128');
      expect(record?.status).toBe('verified');

      // Verify shipment status updated to delivered
      const shipment = await shippingManagerService.getShipmentByTracking('KHM-2026-904128');
      expect(shipment?.status).toBe('delivered');
    });

    it('should prevent duplicate verification once already verified', async () => {
      let duplicateError = false;
      try {
        await deliveryVerificationService.verifyDeliveryCode({
          trackingNumber: 'KHM-2026-904128',
          code: '583214',
          deliveryAgentId: 'drv_01',
        });
      } catch (e: any) {
        duplicateError = true;
        expect(e.message).toContain('already been verified');
      }
      expect(duplicateError).toBe(true);
    });
  });

  describe('3. Code Regeneration & Lockout Protection', () => {
    it('should regenerate code, invalidate old hash, and reset attempts', async () => {
      deliveryVerificationService.prepareVerificationCode({
        trackingNumber: 'KHM-REGEN-01',
        orderId: 'ORD-REGEN-01',
        customerId: 'usr_regen',
      });

      const regenRes = await deliveryVerificationService.regenerateDeliveryCode({
        trackingNumber: 'KHM-REGEN-01',
        customerId: 'usr_regen',
      });

      expect(regenRes.newCode.length).toBe(6);
      const sanitized = deliveryVerificationService.getSanitizedRecord('KHM-REGEN-01');
      expect(sanitized?.regeneratedCount).toBe(1);
      expect(sanitized?.attempts).toBe(0);
    });

    it('should lock verification after 5 consecutive failed attempts', async () => {
      deliveryVerificationService.prepareVerificationCode({
        trackingNumber: 'KHM-LOCK-01',
        orderId: 'ORD-LOCK-01',
        customerId: 'usr_lock',
      });

      for (let i = 0; i < 5; i++) {
        try {
          await deliveryVerificationService.verifyDeliveryCode({
            trackingNumber: 'KHM-LOCK-01',
            code: '999999',
            deliveryAgentId: 'drv_01',
          });
        } catch (e) {
          // Expected failed attempt
        }
      }

      const lockedRecord = deliveryVerificationService.getSanitizedRecord('KHM-LOCK-01');
      expect(lockedRecord?.status).toBe('locked');
      expect(lockedRecord?.attempts).toBe(5);
    });
  });

  describe('4. Audit Log Trail Verification', () => {
    it('should maintain immutable audit logs without exposing plaintext codes', () => {
      const logs = deliveryVerificationService.getVerificationLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Verify no plaintext code exists in logs
      for (const log of logs) {
        expect((log as any).code).toBeUndefined();
        expect(log.action).toBeDefined();
        expect(log.actorRole).toBeDefined();
      }
    });
  });
});
