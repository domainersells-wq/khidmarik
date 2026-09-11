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

export class ManualShippingProvider implements ShippingProvider {
  readonly id = 'manual';
  readonly code = 'manual';
  readonly name = 'Manual Shipping Provider';
  readonly nameAr = 'الشحن اليدوي / المباشر';

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
    const timestamp = Date.now().toString().slice(-6);
    const trackingNumber = `MNL-${new Date().getFullYear()}-${timestamp}`;
    const manifestNumber = `MNF-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);

    return {
      providerTrackingNumber: trackingNumber,
      barcode: `*${trackingNumber}*`,
      manifestNumber,
      labelUrl: `/api/shipping/labels/${trackingNumber}`,
      estimatedDeliveryDate: deliveryDate.toISOString(),
      rawResponse: { mode: 'MANUAL_DISPATCH', createdAt: new Date().toISOString() },
    };
  }

  async cancelShipment(providerTrackingNumber: string, reason?: string): Promise<{ success: boolean; message?: string }> {
    return {
      success: true,
      message: `Shipment ${providerTrackingNumber} marked as cancelled manually. Reason: ${reason || 'User requested'}`,
    };
  }

  async trackShipment(providerTrackingNumber: string): Promise<TrackingResult> {
    return {
      status: 'pending',
      rawStatus: 'MANUAL_PENDING',
      location: 'Store Logistics Desk',
      events: [
        {
          status: 'pending',
          rawStatus: 'CREATED',
          title: 'Manual Shipment Created',
          titleAr: 'تم إنشاء الشحنة يدوياً في النظام',
          description: 'تم تسجيل الشحنة وتجهيزها في انتظار التوجيه والمتابعة اليدوية.',
          location: 'Store Warehouse',
          timestamp: new Date().toISOString(),
        }
      ],
    };
  }

  async requestPickup(data: {
    pickupAddress: string;
    pickupWilaya: string;
    pickupCommune: string;
    pickupPhone: string;
    packageCount: number;
  }): Promise<PickupResult> {
    const pickupId = `PKP-MANUAL-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      pickupId,
      status: 'SCHEDULED',
      message: `تم تسجيل موعد الاستلام اليدوي بنجاح لعدد ${data.packageCount} طرود.`,
    };
  }

  async calculateShippingFee(data: {
    fromWilaya: string;
    toWilaya: string;
    weightKg: number;
    methodCode: string;
    orderTotal: number;
  }): Promise<ShippingFeeResult> {
    const isStopDesk = data.methodCode === 'stop_desk';
    const isSouth = ['01', '03', '08', '11', '30', '33', '37', '39', '47', '50', '51', '52', '53', '54', '55', '56', '57', '58']
      .some(c => data.toWilaya.startsWith(c));
    
    let base = isStopDesk ? 400 : 600;
    if (isSouth) base = isStopDesk ? 800 : 1200;

    return {
      fee: data.orderTotal >= 15000 ? 0 : base,
      isCovered: true,
      estimatedDaysMin: 1,
      estimatedDaysMax: isSouth ? 4 : 2,
    };
  }

  async getSupportedWilayas(): Promise<AlgerianWilayaCoverage[]> {
    // Manual covers all 58 wilayas
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
    const clean = providerStatus?.toLowerCase().trim();
    switch (clean) {
      case 'pending':
      case 'created':
      case 'draft':
        return 'pending';
      case 'pickup_requested':
      case 'scheduled':
        return 'pickup_requested';
      case 'picked_up':
      case 'collected':
        return 'picked_up';
      case 'in_transit':
      case 'dispatched':
        return 'in_transit';
      case 'arrived':
      case 'at_hub':
        return 'arrived_at_destination';
      case 'out_for_delivery':
      case 'with_courier':
        return 'out_for_delivery';
      case 'attempted':
      case 'delivery_attempted':
        return 'delivery_attempted';
      case 'delivered':
      case 'completed':
        return 'delivered';
      case 'failed':
      case 'failed_delivery':
        return 'failed_delivery';
      case 'returned':
      case 'returned_to_sender':
        return 'returned';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}
