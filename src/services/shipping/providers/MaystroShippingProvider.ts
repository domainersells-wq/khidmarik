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

export class MaystroShippingProvider implements ShippingProvider {
  readonly id = 'maystro';
  readonly code = 'maystro';
  readonly name = 'Maystro Delivery';
  readonly nameAr = 'مايسترو دليفري (Maystro Express)';

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
    const trackingNumber = `MAY-${new Date().getFullYear()}-${randNum}`;
    return {
      providerTrackingNumber: trackingNumber,
      barcode: `*${trackingNumber}*`,
      manifestNumber: `MNF-MAY-${Math.floor(1000 + Math.random() * 9000)}`,
      labelUrl: `https://maystro.dz/awb/${trackingNumber}`,
      estimatedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
  }

  async cancelShipment() {
    return { success: true, message: 'Maystro delivery cancelled.' };
  }

  async trackShipment(providerTrackingNumber: string): Promise<TrackingResult> {
    return {
      status: 'delivered',
      rawStatus: 'MAY_DELIVERED_SUCCESS',
      location: 'تم التسليم للزبون',
      driverName: 'كريم بلعباس (Karim B.)',
      driverPhone: '0560 12 34 56',
      deliveredAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      events: [
        {
          status: 'picked_up',
          rawStatus: 'MAY_PICKUP',
          title: 'Maystro Express Pickup',
          titleAr: 'تم استلام الشحنة من المتجر',
          location: 'Hydra, Alger',
          timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        },
        {
          status: 'delivered',
          rawStatus: 'MAY_DELIVERED_SUCCESS',
          title: 'Delivered Successfully',
          titleAr: 'تم التسليم بنجاح وتأكيد الدفع',
          description: 'تم تسليم الطرد للزبون والتحقق من كود التأكيد واستلام المبلغ.',
          location: 'Dely Ibrahim, Alger',
          timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        }
      ],
    };
  }

  async requestPickup(): Promise<PickupResult> {
    return { success: true, pickupId: `MAY-PKP-${Date.now()}`, status: 'DISPATCHED' };
  }

  async calculateShippingFee(data: {
    toWilaya: string;
    methodCode: string;
    orderTotal: number;
  }): Promise<ShippingFeeResult> {
    const isStopDesk = data.methodCode === 'stop_desk';
    const isSouth = ['01', '03', '08', '11', '30', '33', '37', '39', '47', '50', '51', '52', '53', '54', '55', '56', '57', '58']
      .some(c => data.toWilaya.startsWith(c));
    
    let base = isStopDesk ? 450 : 750;
    if (isSouth) base = isStopDesk ? 900 : 1400;

    return {
      fee: data.orderTotal >= 15000 ? 0 : base,
      isCovered: true,
      estimatedDaysMin: 1,
      estimatedDaysMax: isSouth ? 3 : 1,
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
    if (s.includes('PICKUP')) return 'picked_up';
    if (s.includes('TRANSIT')) return 'in_transit';
    if (s.includes('COURIER') || s.includes('OUT')) return 'out_for_delivery';
    if (s.includes('DELIVERED') || s.includes('SUCCESS')) return 'delivered';
    if (s.includes('FAIL') || s.includes('POSTPONED')) return 'delivery_attempted';
    if (s.includes('RETURN')) return 'returned';
    if (s.includes('CANCEL')) return 'cancelled';
    return 'in_transit';
  }
}
