import { shippingManagerService } from './ShippingManagerService';
import { shippingProviderFactory } from './ShippingProviderFactory';
import { shippingCalculator } from './ShippingCalculator';
import type { 
  Shipment, 
  InternalShipmentStatus, 
  CreateShipmentInput,
  CalculateFeeInput,
  DeliveryType
} from '@/types/shipping';

/**
 * Unified Shipping Service Facade (Enterprise)
 */
class ShippingServiceFacade {
  public async calculateShippingQuotes(params: {
    fromWilaya: string;
    toWilaya: string;
    weightKg: number;
    deliveryType: DeliveryType;
    isCod: boolean;
    orderTotal: number;
    enabledProviders?: string[];
  }) {
    return shippingCalculator.calculateQuotes({
      seller_id: 'default',
      from_wilaya: params.fromWilaya,
      to_wilaya: params.toWilaya,
      weight_kg: params.weightKg,
      shipping_method_code: params.deliveryType,
      is_cod: params.isCod,
      order_total: params.orderTotal,
      enabled_providers: params.enabledProviders,
    });
  }

  public async createShipment(input: any): Promise<Shipment> {
    return shippingManagerService.createShipment({
      order_id: input.orderId || input.order_id,
      order_number: input.orderNumber || input.order_number,
      seller_id: input.storeId || input.seller_id || 'default_store',
      seller_name: input.storeName || input.seller_name,
      customer_id: input.customerId || input.customer_id,
      provider_id: input.providerId || input.provider_id || 'manual',
      shipping_method_id: input.deliveryType === 'stop_desk' ? 'mth_desk' : 'mth_home',
      shipping_fee: input.shippingFee || input.shipping_fee || 0,
      cod_amount: input.codAmount || input.cod_amount || 0,
      currency: input.currency || 'DZD',
      pickup_address: input.pickupAddress || input.pickup_address || 'Warehouse',
      pickup_wilaya: input.pickupWilaya || input.pickup_wilaya || '16 - Alger',
      pickup_commune: input.pickupCommune || input.pickup_commune || 'Bab Ezzouar',
      pickup_contact_name: input.pickupContactName || input.pickup_contact_name,
      pickup_phone: input.pickupPhone || input.pickup_phone,
      delivery_address: input.recipientAddress || input.delivery_address || 'Address',
      delivery_wilaya: input.recipientWilaya || input.delivery_wilaya || '16 - Alger',
      delivery_commune: input.recipientCommune || input.delivery_commune || 'Commune',
      recipient_name: input.recipientName || input.recipient_name || 'Customer',
      recipient_phone: input.recipientPhone || input.recipient_phone || '0550000000',
      recipient_alt_phone: input.recipientAltPhone || input.recipient_alt_phone,
      stop_desk_id: input.stopDeskId || input.stop_desk_id,
      stop_desk_name: input.stopDeskName || input.stop_desk_name,
      weight: input.weightKg || input.weight || 1.0,
      package_count: input.packageCount || input.package_count || 1,
      notes: input.notes,
    });
  }

  public async getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    return shippingManagerService.getShipmentByTracking(trackingNumber);
  }

  public async getShipmentsByStore(storeId: string): Promise<Shipment[]> {
    return shippingManagerService.getSellerShipments(storeId);
  }

  public async getAllShipments(filters?: any): Promise<Shipment[]> {
    return shippingManagerService.getAllShipments(filters);
  }

  public async updateShipmentStatus(params: {
    trackingNumber: string;
    newStatus: InternalShipmentStatus;
    titleAr?: string;
    description?: string;
    locationWilaya?: string;
    locationCommune?: string;
    driverName?: string;
    driverPhone?: string;
    actorRole?: 'SYSTEM' | 'SELLER' | 'COURIER' | 'CUSTOMER' | 'ADMIN';
    actorName?: string;
  }): Promise<Shipment | null> {
    return shippingManagerService.updateShipmentStatus({
      trackingNumber: params.trackingNumber,
      newStatus: params.newStatus,
      titleAr: params.titleAr,
      description: params.description,
      location: params.locationWilaya,
      driverName: params.driverName,
      driverPhone: params.driverPhone,
      actorRole: params.actorRole,
      actorName: params.actorName,
    });
  }

  public async getAdminKPIs() {
    return shippingManagerService.getAdminKPIs();
  }

  public async processWebhook(providerId: string, payload: any) {
    return shippingManagerService.processWebhook(providerId, payload);
  }

  public getRegisteredProviders() {
    return shippingProviderFactory.getAllProviders().map(p => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=60',
      isActive: true,
      supportsStopDesk: p.capabilities.supports_pickup,
      supportsHomeDelivery: true,
      supportsCod: p.capabilities.supports_cod,
      defaultDeliveryDays: 2,
    }));
  }
}

export const shippingService = new ShippingServiceFacade();
