import type { 
  InternalShipmentStatus, 
  ProviderCapabilities, 
  CreateShipmentInput 
} from '@/types/shipping';

export interface ShippingProviderResult {
  providerTrackingNumber: string;
  barcode?: string;
  labelUrl?: string;
  manifestNumber?: string;
  estimatedDeliveryDate?: string;
  rawResponse?: Record<string, any>;
}

export interface TrackingResult {
  status: InternalShipmentStatus;
  rawStatus: string;
  location?: string;
  driverName?: string;
  driverPhone?: string;
  deliveredAt?: string;
  events: Array<{
    status: InternalShipmentStatus;
    rawStatus: string;
    title: string;
    titleAr: string;
    description?: string;
    location?: string;
    timestamp: string;
  }>;
}

export interface PickupResult {
  success: boolean;
  pickupId?: string;
  status?: string;
  scheduledTime?: string;
  message?: string;
}

export interface ShippingFeeResult {
  fee: number;
  isCovered: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  stopDeskName?: string;
}

export interface AlgerianWilayaCoverage {
  code: string;
  name: string;
  nameAr: string;
  isHomeCovered: boolean;
  isDeskCovered: boolean;
}

/**
 * Standardized Shipping Provider Interface
 * All logistics carriers (Yalidine, ZR Express, Maystro, In-House, Manual, or custom)
 * implement this contract.
 */
export interface ShippingProvider {
  /**
   * Unique system identifier (e.g. 'manual', 'yalidine', 'zr_express')
   */
  readonly id: string;
  
  /**
   * Carrier code name
   */
  readonly code: string;

  /**
   * Carrier display name
   */
  readonly name: string;

  /**
   * Arabic display name
   */
  readonly nameAr: string;

  /**
   * Carrier capability flags
   */
  readonly capabilities: ProviderCapabilities;

  /**
   * Create a shipment in carrier API or internal tracking ledger
   */
  createShipment(data: CreateShipmentInput): Promise<ShippingProviderResult>;

  /**
   * Cancel shipment with the carrier
   */
  cancelShipment(providerTrackingNumber: string, reason?: string): Promise<{ success: boolean; message?: string }>;

  /**
   * Query real-time status and timeline from carrier
   */
  trackShipment(providerTrackingNumber: string): Promise<TrackingResult>;

  /**
   * Request carrier driver to visit warehouse for parcel collection
   */
  requestPickup(data: {
    pickupAddress: string;
    pickupWilaya: string;
    pickupCommune: string;
    pickupPhone: string;
    pickupContactName?: string;
    packageCount: number;
    readyAt?: string;
  }): Promise<PickupResult>;

  /**
   * Calculate direct carrier fee for given destination and weight
   */
  calculateShippingFee(data: {
    fromWilaya: string;
    toWilaya: string;
    weightKg: number;
    methodCode: string;
    orderTotal: number;
  }): Promise<ShippingFeeResult>;

  /**
   * Get supported wilayas list
   */
  getSupportedWilayas(): Promise<AlgerianWilayaCoverage[]>;

  /**
   * Map raw provider status string to standardized Khidmatik InternalShipmentStatus
   */
  mapStatus(providerStatus: string): InternalShipmentStatus;
}
