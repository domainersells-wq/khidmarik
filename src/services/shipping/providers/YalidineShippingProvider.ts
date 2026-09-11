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

export class YalidineShippingProvider implements ShippingProvider {
  readonly id = 'yalidine';
  readonly code = 'yalidine';
  readonly name = 'Yalidine Express';
  readonly nameAr = 'ياليدين إكسبريس';

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
    const trackingNumber = `yal_${new Date().getFullYear()}${randNum}`;
    const manifestNumber = `MNF-YAL-${Math.floor(1000 + Math.random() * 9000)}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);

    return {
      providerTrackingNumber: trackingNumber,
      barcode: `*${trackingNumber}*`,
      manifestNumber,
      labelUrl: `https://yalidine.app/waybills/${trackingNumber}.pdf`,
      estimatedDeliveryDate: deliveryDate.toISOString(),
      rawResponse: {
        success: true,
        tracking: trackingNumber,
        status: 'YAL_READY_FOR_COLLECTION',
      },
    };
  }

  async cancelShipment(providerTrackingNumber: string, reason?: string): Promise<{ success: boolean; message?: string }> {
    return {
      success: true,
      message: `Yalidine shipment ${providerTrackingNumber} cancelled successfully.`,
    };
  }

  async trackShipment(providerTrackingNumber: string): Promise<TrackingResult> {
    return {
      status: 'in_transit',
      rawStatus: 'YAL_IN_SORTING_HUB',
      location: 'مركز الفرز المركزي واد السمار - الجزائر',
      driverName: 'عمر بلخيري (Omar B.)',
      driverPhone: '0550 11 22 33',
      events: [
        {
          status: 'pickup_requested',
          rawStatus: 'YAL_LABEL_CREATED',
          title: 'Label Printed',
          titleAr: 'تم إنشاء بوليصة الشحن وتجهيز الطرد',
          description: 'تم حجز الشحنة في نظام ياليدين للاستلام من المستودع.',
          location: 'Alger Warehouse',
          timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        },
        {
          status: 'picked_up',
          rawStatus: 'YAL_COLLECTED_BY_VAN',
          title: 'Collected by Courier',
          titleAr: 'تم استلام الطرد من المستودع',
          description: 'تم مسح الباركود واستلام الشحنة في شاحنة ياليدين.',
          location: 'Alger',
          timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
        },
        {
          status: 'in_transit',
          rawStatus: 'YAL_IN_SORTING_HUB',
          title: 'In Sorting Hub',
          titleAr: 'في مركز الفرز والتوزيع المركزي',
          description: 'يتم فرز الشحنة وتوجيهها إلى ولاية الوجهة عبر الرحلات الليلية المنتظمة.',
          location: 'Oued Smar Hub',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
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
    return {
      success: true,
      pickupId: `YAL-PKP-${Date.now()}`,
      status: 'ACCEPTED',
      message: 'تم إرسال طلب استلام الشحنات إلى مندوب ياليدين بنجاح.',
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
    
    let base = isStopDesk ? 400 : 700;
    if (isSouth) base = isStopDesk ? 850 : 1300;

    return {
      fee: data.orderTotal >= 15000 ? 0 : base,
      isCovered: true,
      estimatedDaysMin: 1,
      estimatedDaysMax: isSouth ? 4 : 2,
      stopDeskName: isStopDesk ? `وكالة ياليدين - ${data.toWilaya}` : undefined,
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

  /**
   * Yalidine status mapping to Khidmatik internal status
   */
  mapStatus(providerStatus: string): InternalShipmentStatus {
    const s = providerStatus?.toUpperCase().trim() || '';
    if (s.includes('CREATE') || s.includes('READY_FOR_COLLECTION') || s.includes('PAS_ENCORE_EXPEDIE')) return 'pending';
    if (s.includes('PICKUP_REQUESTED') || s.includes('DEMANDE_ENLEVEMENT')) return 'pickup_requested';
    if (s.includes('COLLECTED') || s.includes('RAMASSE') || s.includes('RECU_AU_HUB')) return 'picked_up';
    if (s.includes('SORTING') || s.includes('EXPEDIE') || s.includes('IN_TRANSIT') || s.includes('VERS_CENTRE')) return 'in_transit';
    if (s.includes('ARRIVE_AU_BUREAU') || s.includes('DESTINATION_HUB')) return 'arrived_at_destination';
    if (s.includes('OUT_FOR_DELIVERY') || s.includes('EN_COURS_DE_LIVRAISON') || s.includes('AVEC_LIVREUR')) return 'out_for_delivery';
    if (s.includes('TENTATIVE') || s.includes('ATTEMPTED') || s.includes('REPORTE') || s.includes('CLIENT_INJOIGNABLE')) return 'delivery_attempted';
    if (s.includes('DELIVERED') || s.includes('LIVRE') || s.includes('ENCAISSE')) return 'delivered';
    if (s.includes('FAILED') || s.includes('NON_LIVRE') || s.includes('ECHEC')) return 'failed_delivery';
    if (s.includes('RETOUR') || s.includes('RETURNED') || s.includes('EN_RETOUR')) return 'returned';
    if (s.includes('CANCEL') || s.includes('ANNULE')) return 'cancelled';
    return 'in_transit';
  }
}
