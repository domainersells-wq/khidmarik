/**
 * Khidmatik Standardized Internal Shipment Status
 * All third-party carrier status values map to this standardized enum.
 */
export type InternalShipmentStatus =
  | 'pending'
  | 'pickup_requested'
  | 'picked_up'
  | 'in_transit'
  | 'arrived_at_destination'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'
  | 'cancelled'
  | 'exception';

/**
 * Backward compatibility alias for existing code
 */
export type ShipmentStatus = InternalShipmentStatus;

export type ShipmentCodStatus =
  | 'pending'
  | 'collected'
  | 'not_collected'
  | 'refunded'
  | 'returned';

export type DeliveryType = 'home_delivery' | 'stop_desk' | 'express_delivery' | 'store_pickup';

export interface ProviderCapabilities {
  supports_tracking: boolean;
  supports_pickup: boolean;
  supports_cod: boolean;
  supports_cancellation: boolean;
  supports_label_generation: boolean;
  supports_webhooks: boolean;
  supports_shipping_calculation: boolean;
  supports_return: boolean;
  supports_address_validation: boolean;
}

export interface ShippingProviderRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  country: string;
  is_active: boolean;
  supports_api: boolean;
  api_base_url?: string;
  configuration: Record<string, any>;
  capabilities: ProviderCapabilities;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  description?: string;
  is_active: boolean;
  display_order: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  wilaya_codes: string[];
  is_active: boolean;
}

export interface ShippingRateRule {
  id: string;
  provider_id?: string;
  shipping_method_id?: string;
  zone_id?: string;
  wilaya_code?: string;
  min_weight: number;
  max_weight: number;
  base_fee: number; // in DZD
  extra_kg_fee: number; // in DZD per kg above min_weight
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  status: InternalShipmentStatus;
  title: string;
  title_ar: string;
  description?: string;
  location?: string;
  provider_status?: string; // Raw external status
  actor_role: 'SYSTEM' | 'SELLER' | 'COURIER' | 'CUSTOMER' | 'ADMIN';
  actor_name?: string;
  metadata?: Record<string, any>;
  event_at: string;
  created_at: string;
}

export interface DeliveryAttempt {
  id: string;
  shipment_id: string;
  attempt_number: number;
  status: 'failed' | 'rescheduled' | 'successful';
  reason: string;
  notes?: string;
  driver_name?: string;
  driver_phone?: string;
  attempted_at: string;
  next_attempt_at?: string;
  created_at: string;
}

export interface ShipmentReturn {
  id: string;
  shipment_id: string;
  order_id: string;
  return_reason: string;
  return_tracking_number?: string;
  status: 'return_requested' | 'return_in_transit' | 'returned_to_seller' | 'return_completed';
  return_notes?: string;
  returned_at?: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  order_number?: string;
  seller_id: string;
  seller_name?: string;
  customer_id?: string;
  provider_id: string;
  provider_name?: string;
  provider_logo?: string;
  shipping_method_id: string;
  shipping_method_code?: string;
  tracking_number: string;
  provider_tracking_number?: string;
  status: InternalShipmentStatus;
  shipping_fee: number;
  cod_amount: number;
  currency: string;
  cod_status: ShipmentCodStatus;
  cod_collected_at?: string;
  
  // Origin
  pickup_address: string;
  pickup_wilaya: string;
  pickup_commune: string;
  pickup_contact_name?: string;
  pickup_phone?: string;
  
  // Destination
  delivery_address: string;
  delivery_wilaya: string;
  delivery_commune: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_alt_phone?: string;
  delivery_instructions?: string;
  stop_desk_id?: string;
  stop_desk_name?: string;
  
  // Package
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  package_count: number;
  notes?: string;
  
  // Security & Manifest
  delivery_otp_code?: string;
  delivery_otp_verified: boolean;
  label_url?: string;
  manifest_number?: string;
  estimated_delivery_date?: string;
  
  // Driver & Hub
  driver_name?: string;
  driver_phone?: string;
  current_location?: string;
  
  // Timestamps & Timeline
  picked_up_at?: string;
  delivered_at?: string;
  returned_at?: string;
  cancelled_at?: string;
  timeline?: ShipmentEvent[];
  delivery_attempts?: DeliveryAttempt[];
  returns?: ShipmentReturn[];
  created_at: string;
  updated_at: string;
}

export interface ProviderStatusMapping {
  id: string;
  provider_id: string;
  external_status: string;
  internal_status: InternalShipmentStatus;
  notes?: string;
}

export interface ProviderApiLog {
  id: string;
  provider_id: string;
  shipment_id?: string;
  request_type: 'CREATE_SHIPMENT' | 'TRACK' | 'CANCEL' | 'PICKUP' | 'CALCULATE_FEE' | 'WEBHOOK';
  endpoint: string;
  request_id?: string;
  status_code?: number;
  request_payload?: Record<string, any>;
  response_payload?: Record<string, any>;
  error?: string;
  created_at: string;
}

export interface SellerShippingSettings {
  id: string;
  seller_id: string;
  is_shipping_enabled: boolean;
  is_cod_enabled: boolean;
  is_pickup_enabled: boolean;
  default_provider_id?: string;
  enabled_providers: string[];
  pricing_model: 'flat' | 'dynamic_rules' | 'zone_based';
  flat_home_rate: number;
  flat_desk_rate: number;
  free_shipping_threshold: number;
  is_free_shipping_active: boolean;
  pickup_address: string;
  pickup_wilaya: string;
  pickup_commune: string;
  pickup_contact_name: string;
  pickup_phone: string;
  custom_wilaya_rates: Record<string, { home_rate: number; desk_rate: number; is_covered: boolean }>;
}

export interface ShippingFeeQuote {
  provider_id: string;
  provider_name: string;
  provider_code: string;
  provider_logo?: string;
  shipping_method_id: string;
  shipping_method_code: string;
  shipping_method_name: string;
  shipping_method_name_ar: string;
  fee: number; // in DZD
  is_free: boolean;
  estimated_days_min: number;
  estimated_days_max: number;
  stop_desk_name?: string;
}

export interface CalculateFeeInput {
  seller_id: string;
  from_wilaya: string;
  to_wilaya: string;
  to_commune?: string;
  weight_kg: number;
  shipping_method_code?: string;
  is_cod: boolean;
  order_total: number;
  enabled_providers?: string[];
}

export interface CreateShipmentInput {
  order_id: string;
  order_number?: string;
  seller_id: string;
  seller_name?: string;
  customer_id?: string;
  provider_id: string;
  shipping_method_id: string;
  shipping_fee: number;
  cod_amount: number;
  currency?: string;
  pickup_address: string;
  pickup_wilaya: string;
  pickup_commune: string;
  pickup_contact_name?: string;
  pickup_phone?: string;
  delivery_address: string;
  delivery_wilaya: string;
  delivery_commune: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_alt_phone?: string;
  delivery_instructions?: string;
  stop_desk_id?: string;
  stop_desk_name?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  package_count?: number;
  notes?: string;
}

export interface AdminShippingDashboardKPIs {
  total_shipments: number;
  pending_count: number;
  pickup_requested_count: number;
  in_transit_count: number;
  out_for_delivery_count: number;
  delivered_count: number;
  failed_delivery_count: number;
  returned_count: number;
  delivery_success_rate: number; // percentage
  failed_delivery_rate: number;
  return_rate: number;
  average_delivery_hours: number;
  total_cod_pending: number; // in DZD
  total_cod_collected: number; // in DZD
  total_shipping_revenue: number; // in DZD
  shipments_by_provider: Array<{
    provider_id: string;
    provider_name: string;
    count: number;
    delivered_count: number;
    success_rate: number;
    avg_hours: number;
  }>;
  shipments_by_wilaya: Array<{
    wilaya: string;
    count: number;
    delivered_count: number;
  }>;
}

/**
 * Public Sanitized Tracking Model (Safe for public access without leaking secrets/seller data)
 */
export interface PublicTrackingResult {
  tracking_number: string;
  provider_name: string;
  provider_logo?: string;
  status: InternalShipmentStatus;
  status_label: string;
  status_label_ar: string;
  origin_wilaya: string;
  destination_wilaya: string;
  destination_commune: string;
  delivery_type_name: string;
  delivery_type_name_ar: string;
  estimated_delivery_date?: string;
  driver_name?: string;
  driver_phone?: string;
  current_location?: string;
  delivery_otp_required: boolean;
  delivery_otp_verified: boolean;
  delivered_at?: string;
  timeline: Array<{
    id: string;
    status: InternalShipmentStatus;
    title: string;
    title_ar: string;
    description?: string;
    location?: string;
    event_at: string;
  }>;
}
