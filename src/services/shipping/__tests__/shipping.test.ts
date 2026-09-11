import { shippingProviderFactory } from '../ShippingProviderFactory';
import { shippingCalculator } from '../ShippingCalculator';
import { shippingManagerService } from '../ShippingManagerService';
import { ManualShippingProvider } from '../providers/ManualShippingProvider';
import { YalidineShippingProvider } from '../providers/YalidineShippingProvider';

// Standalone runner & type declarations
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

describe('Khidmatik Enterprise Shipping System Test Suite', () => {
  describe('1. Provider Factory & Abstraction', () => {
    it('should register and retrieve default Algerian carriers', () => {
      const providers = shippingProviderFactory.getAllProviders();
      expect(providers.length).toBeGreaterThanOrEqual(5);

      const yalidine = shippingProviderFactory.getProvider('yalidine');
      expect(yalidine.id).toBe('yalidine');
      expect(yalidine.capabilities.supports_tracking).toBe(true);
      expect(yalidine.capabilities.supports_cod).toBe(true);

      const zr = shippingProviderFactory.getProvider('zr_express');
      expect(zr.id).toBe('zr_express');
    });

    it('should fallback gracefully to Manual provider when an unknown carrier is requested', () => {
      const unknown = shippingProviderFactory.getProvider('non_existent_carrier_xyz');
      expect(unknown.id).toBe('manual');
      expect(unknown.name).toContain('Manual');
    });
  });

  describe('2. Shipping Rules & Rate Calculator Engine', () => {
    it('should calculate accurate quotes for North Coastal Wilayas (Algiers)', async () => {
      const quotes = await shippingCalculator.calculateQuotes({
        seller_id: 'seller_1',
        from_wilaya: '16 - Alger',
        to_wilaya: '16 - Alger',
        weight_kg: 1.5,
        is_cod: true,
        order_total: 4500,
      });

      expect(quotes.length).toBeGreaterThan(0);
      const homeQuote = quotes.find(q => q.shipping_method_code === 'home_delivery');
      expect(homeQuote).toBeDefined();
      expect(homeQuote!.fee).toBeGreaterThan(0);
      expect(homeQuote!.is_free).toBe(false);
    });

    it('should apply Free Shipping threshold automatically when order exceeds limit', async () => {
      const quotes = await shippingCalculator.calculateQuotes(
        {
          seller_id: 'seller_1',
          from_wilaya: '16 - Alger',
          to_wilaya: '31 - Oran',
          weight_kg: 2.0,
          is_cod: true,
          order_total: 25000, // Exceeds 15,000 DA threshold
        },
        {
          id: 'cfg-1',
          seller_id: 'seller_1',
          is_shipping_enabled: true,
          is_cod_enabled: true,
          is_pickup_enabled: true,
          default_provider_id: 'yalidine',
          enabled_providers: ['yalidine', 'manual'],
          pricing_model: 'dynamic_rules',
          flat_home_rate: 600,
          flat_desk_rate: 400,
          free_shipping_threshold: 15000,
          is_free_shipping_active: true,
          pickup_address: 'Warehouse #1',
          pickup_wilaya: '16 - Alger',
          pickup_commune: 'Bab Ezzouar',
          pickup_contact_name: 'Logistics Lead',
          pickup_phone: '0550123456',
          custom_wilaya_rates: {},
        }
      );

      const homeQuote = quotes.find(q => q.shipping_method_code === 'home_delivery');
      expect(homeQuote).toBeDefined();
      expect(homeQuote!.fee).toBe(0);
      expect(homeQuote!.is_free).toBe(true);
    });
  });

  describe('3. Standardized Status Mapping Layer', () => {
    it('should map various carrier statuses to standardized Khidmatik internal status', () => {
      const yalidine = new YalidineShippingProvider();
      expect(yalidine.mapStatus('YAL_READY_FOR_COLLECTION')).toBe('pending');
      expect(yalidine.mapStatus('RAMASSE_PAR_LIVREUR')).toBe('picked_up');
      expect(yalidine.mapStatus('EXPEDIE_VERS_HUB')).toBe('in_transit');
      expect(yalidine.mapStatus('AVEC_LIVREUR_FINAL')).toBe('out_for_delivery');
      expect(yalidine.mapStatus('LIVRE_CLIENT_ENCAISSE')).toBe('delivered');
      expect(yalidine.mapStatus('CLIENT_INJOIGNABLE')).toBe('delivery_attempted');
      expect(yalidine.mapStatus('COLIS_RETOUR_EXPEDITEUR')).toBe('returned');
    });
  });

  describe('4. Shipment Lifecycle & Delivery Attempts', () => {
    it('should create a shipment and progress through lifecycle', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-TEST-9901',
        seller_id: 'seller_test_1',
        provider_id: 'manual',
        shipping_method_id: 'mth_home',
        shipping_fee: 500,
        cod_amount: 8000,
        pickup_address: 'Algiers Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Kouba',
        delivery_address: 'Constantine City',
        delivery_wilaya: '25 - Constantine',
        delivery_commune: 'Constantine',
        recipient_name: 'Test Customer',
        recipient_phone: '0550001122',
      });

      expect(shipment).toBeDefined();
      expect(shipment.status).toBe('pending');
      expect(shipment.tracking_number).toContain('KHM-');
      expect(shipment.timeline?.length).toBeGreaterThan(0);

      // Transition to in_transit
      const inTransit = await shippingManagerService.updateShipmentStatus({
        trackingNumber: shipment.tracking_number,
        newStatus: 'in_transit',
        location: 'Constantine Sorting Facility',
      });

      expect(inTransit).toBeDefined();
      expect(inTransit!.status).toBe('in_transit');
      expect(inTransit!.timeline?.some(e => e.status === 'in_transit')).toBe(true);

      // Transition to delivered
      const delivered = await shippingManagerService.updateShipmentStatus({
        trackingNumber: shipment.tracking_number,
        newStatus: 'delivered',
      });

      expect(delivered!.status).toBe('delivered');
      expect(delivered!.cod_status).toBe('collected');
      expect(delivered!.delivered_at).toBeDefined();
    });

    it('should log multiple delivery failure attempts correctly', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-ATTEMPT-01',
        seller_id: 'seller_test_1',
        provider_id: 'manual',
        shipping_method_id: 'mth_home',
        shipping_fee: 600,
        cod_amount: 5000,
        pickup_address: 'Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Centre',
        delivery_address: 'Oran Maraval',
        delivery_wilaya: '31 - Oran',
        delivery_commune: 'Maraval',
        recipient_name: 'Oran Customer',
        recipient_phone: '0770001122',
      });

      // Attempt 1
      const attempt1 = await shippingManagerService.logDeliveryAttempt({
        trackingNumber: shipment.tracking_number,
        reason: 'Customer phone unreachable',
      });
      expect(attempt1!.status).toBe('delivery_attempted');
      expect(attempt1!.delivery_attempts?.length).toBe(1);

      // Attempt 2
      const attempt2 = await shippingManagerService.logDeliveryAttempt({
        trackingNumber: shipment.tracking_number,
        reason: 'Customer requested postponement',
      });
      expect(attempt2!.delivery_attempts?.length).toBe(2);

      // Attempt 3 -> Escalates to failed_delivery
      const attempt3 = await shippingManagerService.logDeliveryAttempt({
        trackingNumber: shipment.tracking_number,
        reason: 'Wrong address provided',
      });
      expect(attempt3!.status).toBe('failed_delivery');
      expect(attempt3!.delivery_attempts?.length).toBe(3);
    });

    it('should initiate a return to seller properly', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-RET-01',
        seller_id: 'seller_test_1',
        provider_id: 'manual',
        shipping_method_id: 'mth_home',
        shipping_fee: 600,
        cod_amount: 5000,
        pickup_address: 'Depot',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Centre',
        delivery_address: 'Batna Centre',
        delivery_wilaya: '05 - Batna',
        delivery_commune: 'Batna',
        recipient_name: 'Batna Customer',
        recipient_phone: '0660001122',
      });

      const returned = await shippingManagerService.initiateReturn({
        trackingNumber: shipment.tracking_number,
        reason: 'Customer refused parcel',
      });

      expect(returned!.status).toBe('returned');
      expect(returned!.cod_status).toBe('returned');
      expect(returned!.returns?.length).toBe(1);
      expect(returned!.returns![0].return_tracking_number).toBe(`RET-${shipment.tracking_number}`);
    });
  });

  describe('5. Idempotent Webhook Processing', () => {
    it('should process webhook event idempotently without duplicate status events', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-WH-01',
        seller_id: 'seller_test_1',
        provider_id: 'yalidine',
        shipping_method_id: 'mth_home',
        shipping_fee: 700,
        cod_amount: 10000,
        pickup_address: 'Alger',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Bab Ezzouar',
        delivery_address: 'Setif',
        delivery_wilaya: '19 - Sétif',
        delivery_commune: 'Sétif',
        recipient_name: 'Customer Webhook',
        recipient_phone: '0550998877',
      });

      // 1st Webhook payload: IN_TRANSIT
      const res1 = await shippingManagerService.processWebhook('yalidine', {
        tracking_number: shipment.tracking_number,
        status: 'VERS_CENTRE_REGIONAL',
        location: 'Setif Hub',
      });
      expect(res1.success).toBe(true);

      const afterFirst = await shippingManagerService.getShipmentByTracking(shipment.tracking_number);
      expect(afterFirst!.status).toBe('in_transit');
      const timelineCount = afterFirst!.timeline?.length || 0;

      // 2nd Duplicate Webhook payload (same status) -> Should not append duplicate timeline event
      const res2 = await shippingManagerService.processWebhook('yalidine', {
        tracking_number: shipment.tracking_number,
        status: 'VERS_CENTRE_REGIONAL',
        location: 'Setif Hub',
      });
      expect(res2.success).toBe(true);

      const afterSecond = await shippingManagerService.getShipmentByTracking(shipment.tracking_number);
      expect(afterSecond!.timeline?.length).toBe(timelineCount);
    });
  });

  describe('6. Public Tracking Security & Sanitization', () => {
    it('should return a sanitized model without internal database keys or seller credentials', async () => {
      const shipment = await shippingManagerService.createShipment({
        order_id: 'ORD-SEC-01',
        seller_id: 'secret_seller_id_999',
        provider_id: 'yalidine',
        shipping_method_id: 'mth_home',
        shipping_fee: 700,
        cod_amount: 12000,
        pickup_address: 'Private Seller Address #44',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Kouba',
        delivery_address: 'Customer Street #12',
        delivery_wilaya: '31 - Oran',
        delivery_commune: 'Maraval',
        recipient_name: 'Ahmed K.',
        recipient_phone: '0770112233',
      });

      const publicTracking = await shippingManagerService.getPublicTracking(shipment.tracking_number);
      expect(publicTracking).toBeDefined();
      expect(publicTracking!.tracking_number).toBe(shipment.tracking_number);
      expect(publicTracking!.status).toBe('pending');
      expect((publicTracking as any).seller_id).toBeUndefined();
      expect((publicTracking as any).pickup_address).toBeUndefined();
      expect((publicTracking as any).configuration).toBeUndefined();
    });
  });
});
