import type {
  ShippingProvider,
  ShippingProviderResult,
  TrackingResult,
  PickupResult,
  ShippingFeeResult,
  AlgerianWilayaCoverage
} from './ShippingProviderInterface';
import type { 
  InternalShipmentStatus, 
  ProviderCapabilities, 
  CreateShipmentInput 
} from '@/types/shipping';

export class InHouseShippingProvider implements ShippingProvider {
  readonly id = 'in_house';
  readonly code = 'in_house';
  readonly name = 'Khidmatik Direct Fleet';
  readonly nameAr = 'أسطول التوصيل المباشر للمتجر';

  readonly capabilities: ProviderCapabilities = {
    supports_tracking: true,
    supports_pickup: true,
    supports_cod: true,
    supports_cancellation: true,
    supports_label_generation: true,
    supports_webhooks: false,
    supports_shipping_calculation: true,
    supports_return: true,
    supports_address_validation: false,
  };

  async createShipment(data: CreateShipmentInput): Promise<ShippingProviderResult> {
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = `KHM-FLEET-${randNum}`;
    return {
      providerTrackingNumber: trackingNumber,
      barcode: `*${trackingNumber}*`,
      manifestNumber: `MNF-DIRECT-${Math.floor(1000 + Math.random() * 9000)}`,
      labelUrl: `/api/shipping/labels/${trackingNumber}`,
      estimatedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
  }

  async cancelShipment() {
    return { success: true, message: 'Direct delivery cancelled.' };
  }

  async trackShipment(providerTrackingNumber: string): Promise<TrackingResult> {
    return {
      status: 'out_for_delivery',
      rawStatus: 'IN_HOUSE_COURIER_ON_WAY',
      location: 'مع سائق المتجر في الدراجة النارية',
      driverName: 'حميد سعيدي (Hamid S.)',
      driverPhone: '0555 44 33 22',
      events: [
        {
          status: 'out_for_delivery',
          rawStatus: 'IN_HOUSE_COURIER_ON_WAY',
          title: 'Store Courier Out for Delivery',
          titleAr: 'خرج المندوب المباشر لتسليم طلبك',
          description: 'سائق المتجر في الطريق إليك مع الطرد، يرجى البقاء متاحاً على الهاتف.',
          location: 'Centre Ville, Alger',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        }
      ],
    };
  }

  async requestPickup(): Promise<PickupResult> {
    return { success: true, pickupId: `FLEET-PKP-${Date.now()}`, status: 'ASSIGNED' };
  }

  async calculateShippingFee(data: {
    toWilaya: string;
    orderTotal: number;
  }): Promise<ShippingFeeResult> {
    const isLocal = data.toWilaya.includes('Alger') || data.toWilaya.startsWith('16');
    return {
      fee: data.orderTotal >= 15000 ? 0 : isLocal ? 400 : 900,
      isCovered: true,
      estimatedDaysMin: isLocal ? 1 : 2,
      estimatedDaysMax: isLocal ? 1 : 3,
    };
  }

  async getSupportedWilayas(): Promise<AlgerianWilayaCoverage[]> {
    return Array.from({ length: 58 }, (_, i) => {
      const code = String(i + 1).padStart(2, '0');
      return {
        code,
        name: `Wilaya ${code}`,
        nameAr: `ولاية ${code}`,
        isHomeCovered: true,
        isDeskCovered: false,
      };
    });
  }

  mapStatus(providerStatus: string): InternalShipmentStatus {
    const s = providerStatus?.toUpperCase().trim() || '';
    if (s.includes('PENDING') || s.includes('READY')) return 'pending';
    if (s.includes('PICKUP')) return 'picked_up';
    if (s.includes('TRANSIT')) return 'in_transit';
    if (s.includes('ON_WAY') || s.includes('OUT')) return 'out_for_delivery';
    if (s.includes('DELIVERED')) return 'delivered';
    if (s.includes('FAIL')) return 'failed_delivery';
    if (s.includes('RETURN')) return 'returned';
    if (s.includes('CANCEL')) return 'cancelled';
    return 'in_transit';
  }
}
