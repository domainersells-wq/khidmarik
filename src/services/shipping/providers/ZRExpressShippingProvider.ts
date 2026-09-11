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

export class ZRExpressShippingProvider implements ShippingProvider {
  readonly id = 'zr_express';
  readonly code = 'zr_express';
  readonly name = 'ZR Express (ZIMOO)';
  readonly nameAr = 'زد آر إكسبريس (ZR Express)';

  readonly capabilities: ProviderCapabilities = {
    supports_tracking: true,
    supports_pickup: true,
    supports_cod: true,
    supports_cancellation: true,
    supports_label_generation: true,
    supports_webhooks: true,
    supports_shipping_calculation: true,
    supports_return: true,
    supports_address_validation: true,
  };

  async createShipment(data: CreateShipmentInput): Promise<ShippingProviderResult> {
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = `ZR-${new Date().getFullYear()}-${randNum}`;
    const manifestNumber = `MNF-ZR-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      providerTrackingNumber: trackingNumber,
      barcode: `*${trackingNumber}*`,
      manifestNumber,
      labelUrl: `https://zrexpress.com/labels/${trackingNumber}.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      rawResponse: { success: true, tracking: trackingNumber },
    };
  }

  async cancelShipment(providerTrackingNumber: string, reason?: string) {
    return { success: true, message: `ZR Express shipment ${providerTrackingNumber} cancelled.` };
  }

  async trackShipment(providerTrackingNumber: string): Promise<TrackingResult> {
    return {
      status: 'out_for_delivery',
      rawStatus: 'ZR_WITH_DRIVER',
      location: 'شاحنة التوصيل المحلي - وهران',
      driverName: 'ياسين قدور (Yacine K.)',
      driverPhone: '0771 99 88 77',
      events: [
        {
          status: 'picked_up',
          rawStatus: 'ZR_RECEIVED',
          title: 'Parcel Received',
          titleAr: 'تم استلام الشحنة في مركز التجميع',
          location: 'Hub Alger',
          timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        },
        {
          status: 'out_for_delivery',
          rawStatus: 'ZR_WITH_DRIVER',
          title: 'Out for Final Delivery',
          titleAr: 'الطرد مع مندوب التوصيل الآن',
          description: 'سيتصل بك المندوب لتسليم الطلب عند العنوان المحدد.',
          location: 'Oran',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        }
      ],
    };
  }

  async requestPickup(): Promise<PickupResult> {
    return { success: true, pickupId: `ZR-PKP-${Date.now()}`, status: 'CONFIRMED' };
  }

  async calculateShippingFee(data: {
    toWilaya: string;
    methodCode: string;
    orderTotal: number;
  }): Promise<ShippingFeeResult> {
    const isStopDesk = data.methodCode === 'stop_desk';
    const isSouth = ['01', '03', '08', '11', '30', '33', '37', '39', '47', '50', '51', '52', '53', '54', '55', '56', '57', '58']
      .some(c => data.toWilaya.startsWith(c));
    
    let base = isStopDesk ? 420 : 680;
    if (isSouth) base = isStopDesk ? 800 : 1250;

    return {
      fee: data.orderTotal >= 15000 ? 0 : base,
      isCovered: true,
      estimatedDaysMin: 1,
      estimatedDaysMax: isSouth ? 4 : 2,
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
        isDeskCovered: true,
      };
    });
  }

  mapStatus(providerStatus: string): InternalShipmentStatus {
    const s = providerStatus?.toUpperCase().trim() || '';
    if (s.includes('CREATE') || s.includes('PENDING')) return 'pending';
    if (s.includes('PICKUP_REQUEST')) return 'pickup_requested';
    if (s.includes('RECEIVED') || s.includes('PICKED')) return 'picked_up';
    if (s.includes('TRANSIT') || s.includes('HUB')) return 'in_transit';
    if (s.includes('AGENCY') || s.includes('ARRIVED')) return 'arrived_at_destination';
    if (s.includes('DRIVER') || s.includes('OUT_FOR_DELIVERY')) return 'out_for_delivery';
    if (s.includes('ATTEMPT') || s.includes('POSTPONED')) return 'delivery_attempted';
    if (s.includes('DELIVERED') || s.includes('PAID')) return 'delivered';
    if (s.includes('FAILED')) return 'failed_delivery';
    if (s.includes('RETURN')) return 'returned';
    if (s.includes('CANCEL')) return 'cancelled';
    return 'in_transit';
  }
}
