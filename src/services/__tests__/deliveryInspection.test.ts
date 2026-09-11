import { deliveryInspectionService } from '../deliveryInspectionService';
import { shippingManagerService } from '../shipping/ShippingManagerService';

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

describe('Khidmatik Unified Marketplace Phase 3 - Delivery Inspection Sessions Test Suite', () => {
  describe('1. Platform Configuration & Rejection Reasons Matrix', () => {
    it('should retrieve database-driven configurable inspection duration and reasons', () => {
      const config = deliveryInspectionService.getConfig();
      expect(config.inspectionDurationMinutes).toBeGreaterThan(0);
      expect(config.minimumInspectionMinutes).toBe(5);
      expect(config.allowEarlyAcceptance).toBe(true);

      const reasons = deliveryInspectionService.getRejectionReasons();
      expect(reasons.length).toBeGreaterThanOrEqual(10);

      // Verify categorized reasons
      const sellerReasons = deliveryInspectionService.getRejectionReasons('SELLER');
      expect(sellerReasons.some(r => r.code === 'wrong_product')).toBe(true);

      const buyerReasons = deliveryInspectionService.getRejectionReasons('BUYER');
      expect(buyerReasons.some(r => r.code === 'changed_mind')).toBe(true);
    });

    it('should allow admin to update inspection duration dynamically', () => {
      deliveryInspectionService.updateConfig({ inspectionDurationMinutes: 20, minimumInspectionMinutes: 4 });
      const updated = deliveryInspectionService.getConfig();
      expect(updated.inspectionDurationMinutes).toBe(20);
      expect(updated.minimumInspectionMinutes).toBe(4);
      // Reset back to standard
      deliveryInspectionService.updateConfig({ inspectionDurationMinutes: 15, minimumInspectionMinutes: 5 });
    });
  });

  describe('2. Courier Starts Inspection Session', () => {
    it('should start inspection session when shipment is out for delivery with server expiration', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-INSPECT-01',
        seller_id: 'str_1',
        provider_id: 'yalidine',
        shipping_method_id: 'mth_home',
        shipping_fee: 650,
        cod_amount: 14000,
        pickup_address: 'Algiers Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Kouba',
        delivery_address: 'Belcourt Street #12',
        delivery_wilaya: '16 - Alger',
        delivery_commune: 'Belouizdad',
        recipient_name: 'Farid Hamdi',
        recipient_phone: '0550998877',
      });

      const { session, alreadyActive } = await deliveryInspectionService.startInspectionSession({
        trackingNumber: shipment.tracking_number,
        deliveryAgentId: 'drv_alger_01',
      });

      expect(session).toBeDefined();
      expect(session.status).toBe('inspecting');
      expect(session.max_duration_minutes).toBe(15);
      expect(session.minimum_inspection_minutes).toBe(5);
      expect(alreadyActive).toBeUndefined();

      // Check session status via getter with remaining seconds
      const sessionData = deliveryInspectionService.getSession(shipment.tracking_number);
      expect(sessionData.session).toBeDefined();
      expect(sessionData.remainingSeconds).toBeGreaterThan(0);
      expect(sessionData.isExpired).toBe(false);
      // Because session just started (< 5 min), canEarlyAccept must be false
      expect(sessionData.canEarlyAccept).toBe(false);
      expect(sessionData.earlyAcceptanceRemainingSeconds).toBeGreaterThan(0);
    });

    it('should be idempotent and prevent multiple duplicate active sessions for same shipment', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-INSPECT-02',
        seller_id: 'str_1',
        provider_id: 'zr_express',
        shipping_method_id: 'mth_home',
        shipping_fee: 600,
        cod_amount: 9000,
        pickup_address: 'Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Centre',
        delivery_address: 'Oran',
        delivery_wilaya: '31 - Oran',
        delivery_commune: 'Maraval',
        recipient_name: 'Yacine Taleb',
        recipient_phone: '0770998877',
      });

      // 1st start
      const res1 = await deliveryInspectionService.startInspectionSession({
        trackingNumber: shipment.tracking_number,
        deliveryAgentId: 'drv_oran_01',
      });
      expect(res1.session.status).toBe('inspecting');

      // 2nd simultaneous start
      const res2 = await deliveryInspectionService.startInspectionSession({
        trackingNumber: shipment.tracking_number,
        deliveryAgentId: 'drv_oran_01',
      });
      expect(res2.session.id).toBe(res1.session.id);
      expect(res2.alreadyActive).toBe(true);
    });
  });

  describe('3. Early Acceptance / Skip Remaining Time Mechanism', () => {
    it('should reject early acceptance before minimum inspection time has elapsed on server', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-EARLY-REJECT-01',
        seller_id: 'str_1',
        customer_id: 'usr_customer_early',
        provider_id: 'yalidine',
        shipping_method_id: 'mth_home',
        shipping_fee: 700,
        cod_amount: 5000,
        pickup_address: 'Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Centre',
        delivery_address: 'Algiers',
        delivery_wilaya: '16 - Alger',
        delivery_commune: 'Hydra',
        recipient_name: 'Karim S.',
        recipient_phone: '0550112233',
      });

      await deliveryInspectionService.startInspectionSession({
        trackingNumber: shipment.tracking_number,
        deliveryAgentId: 'drv_01',
      });

      let earlyErrorThrown = false;
      try {
        await deliveryInspectionService.acceptInspectionEarly({
          trackingNumber: shipment.tracking_number,
          customerId: 'usr_customer_early',
        });
      } catch (e: any) {
        earlyErrorThrown = true;
        expect(e.message).toContain('Minimum inspection period');
      }
      expect(earlyErrorThrown).toBe(true);
    });

    it('should allow customer early acceptance after minimum time, generate private confirmation code, and record audit event', async () => {
      // Mock session KHM-2026-904128 started 6 minutes ago in seed
      const sessionData = deliveryInspectionService.getSession('KHM-2026-904128');
      expect(sessionData.canEarlyAccept).toBe(true);

      const acceptedSession = await deliveryInspectionService.acceptInspectionEarly({
        trackingNumber: 'KHM-2026-904128',
        customerId: 'usr_4',
        feedback: 'Inspected for 6 minutes, perfect condition. Skipping remaining timer.',
      });

      expect(acceptedSession.status).toBe('accepted');
      expect(acceptedSession.acceptance_method).toBe('early_acceptance');
      expect(acceptedSession.private_delivery_code).toBeDefined();
      expect(acceptedSession.private_delivery_code?.length).toBe(6);

      // Verify Audit Log
      const auditEvents = deliveryInspectionService.getAuditEvents(acceptedSession.order_id);
      expect(auditEvents.some(a => a.action === 'INSPECTION_EARLY_ACCEPTED')).toBe(true);
    });

    it('should be idempotent and not throw error if accepted session is accepted again', async () => {
      // Calling acceptInspectionEarly on already accepted session should return gracefully
      const reAccepted = await deliveryInspectionService.acceptInspectionEarly({
        trackingNumber: 'KHM-2026-904128',
        customerId: 'usr_4',
      });
      expect(reAccepted.status).toBe('accepted');
    });
  });

  describe('4. Customer Rejects Product with Categorized Reason & Evidence', () => {
    it('should reject product, enforce evidence when required, and disable delivery confirmation code', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-REJECT-01',
        seller_id: 'str_1',
        customer_id: 'usr_customer_reject',
        provider_id: 'yalidine',
        shipping_method_id: 'mth_home',
        shipping_fee: 700,
        cod_amount: 18000,
        pickup_address: 'Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Centre',
        delivery_address: 'Setif',
        delivery_wilaya: '19 - Sétif',
        delivery_commune: 'Sétif',
        recipient_name: 'Mourad Belkacem',
        recipient_phone: '0550114477',
      });

      await deliveryInspectionService.startInspectionSession({
        trackingNumber: shipment.tracking_number,
        deliveryAgentId: 'drv_setif_01',
      });

      // Attempting rejection with reason requiring evidence without photos should throw error
      let errorThrown = false;
      try {
        await deliveryInspectionService.rejectInspection({
          trackingNumber: shipment.tracking_number,
          customerId: 'usr_customer_reject',
          reasonCode: 'damaged_product', // Requires evidence
          evidencePhotos: [],
        });
      } catch (e: any) {
        errorThrown = true;
        expect(e.message).toContain('evidence proof');
      }
      expect(errorThrown).toBe(true);

      // Rejection with photo evidence succeeds
      const rejectedSession = await deliveryInspectionService.rejectInspection({
        trackingNumber: shipment.tracking_number,
        customerId: 'usr_customer_reject',
        reasonCode: 'damaged_product',
        customerNotes: 'Screen is cracked upon opening box at doorstep.',
        evidencePhotos: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300'],
      });

      expect(rejectedSession.status).toBe('rejected');
      expect(rejectedSession.decision).toBe('FULL_REJECT');
      expect(rejectedSession.rejection_reason_code).toBe('damaged_product');
      expect(rejectedSession.evidence_photos?.length).toBe(1);
      expect(rejectedSession.private_delivery_code).toBeUndefined(); // Crucial: Code disabled
    });
  });

  describe('5. Security & Authorization Checks', () => {
    it('should reject unauthorized customer attempting to manipulate inspection of another customer', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-SEC-INSPECT',
        seller_id: 'str_1',
        customer_id: 'legitimate_customer_id',
        provider_id: 'yalidine',
        shipping_method_id: 'mth_home',
        shipping_fee: 500,
        cod_amount: 0,
        pickup_address: 'Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Centre',
        delivery_address: 'Algiers',
        delivery_wilaya: '16 - Alger',
        delivery_commune: 'Hydra',
        recipient_name: 'Lyes B.',
        recipient_phone: '0550000000',
      });

      await deliveryInspectionService.startInspectionSession({
        trackingNumber: shipment.tracking_number,
        deliveryAgentId: 'drv_01',
      });

      let unauthorizedError = false;
      try {
        await deliveryInspectionService.acceptInspection({
          trackingNumber: shipment.tracking_number,
          customerId: 'malicious_attacker_id',
        });
      } catch (e: any) {
        unauthorizedError = true;
        expect(e.message).toContain('Unauthorized');
      }
      expect(unauthorizedError).toBe(true);
    });
  });
});
