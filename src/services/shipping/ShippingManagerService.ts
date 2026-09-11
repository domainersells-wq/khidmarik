import { supabase } from '@/lib/supabase';
import type {
  Shipment,
  InternalShipmentStatus,
  ShipmentEvent,
  DeliveryAttempt,
  ShipmentReturn,
  CreateShipmentInput,
  SellerShippingSettings,
  AdminShippingDashboardKPIs,
  PublicTrackingResult,
  ProviderApiLog
} from '@/types/shipping';
import { shippingProviderFactory } from './ShippingProviderFactory';
import { shippingCalculator } from './ShippingCalculator';

const STORAGE_KEY_SHIPMENTS = 'khidmatik_enterprise_shipments_v2';
const STORAGE_KEY_SELLER_SETTINGS = 'khidmatik_enterprise_seller_settings_v2';
const STORAGE_KEY_LOGS = 'khidmatik_enterprise_provider_logs_v2';

const SEED_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-001',
    order_id: 'KHD-ORD-2026-8801',
    order_number: 'KHD-ORD-2026-8801',
    seller_id: 'str_1',
    seller_name: 'DzTech Electronics Store',
    customer_id: 'usr_001',
    provider_id: 'yalidine',
    provider_name: 'Yalidine Express',
    provider_logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=60',
    shipping_method_id: 'mth_home',
    shipping_method_code: 'home_delivery',
    tracking_number: 'KHM-2026-904128',
    provider_tracking_number: 'yal_2026904128',
    status: 'in_transit',
    shipping_fee: 700,
    cod_amount: 18500,
    currency: 'DZD',
    cod_status: 'pending',
    pickup_address: 'Zone Industrielle Oued Smar, Lot 14',
    pickup_wilaya: '16 - Alger',
    pickup_commune: 'Oued Smar',
    pickup_contact_name: 'سعيد لوجستيك',
    pickup_phone: '0550 12 34 56',
    delivery_address: 'حي 1000 مسكن، عمارة C، شقة 14',
    delivery_wilaya: '19 - Sétif',
    delivery_commune: 'Sétif Ville',
    recipient_name: 'ياسمين طالب (Yasmine Taleb)',
    recipient_phone: '0540 88 99 00',
    weight: 1.8,
    package_count: 1,
    delivery_otp_code: '682145',
    delivery_otp_verified: false,
    label_url: 'https://yalidine.app/waybills/yal_2026904128.pdf',
    manifest_number: 'MNF-YAL-8891',
    estimated_delivery_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    driver_name: 'عمر بلخيري (Omar B.)',
    driver_phone: '0550 11 22 33',
    current_location: 'مركز فرز سطيف المركزي',
    timeline: [
      {
        id: 'evt-101',
        shipment_id: 'shp-001',
        status: 'pending',
        title: 'Shipment Created',
        title_ar: 'تم إنشاء الشحنة وتجهيز الطرد',
        description: 'تم إصدار بوليصة الشحن وتجهيز الطرد في مستودع المتجر.',
        location: 'Alger Warehouse',
        actor_role: 'SELLER',
        actor_name: 'DzTech Logistics',
        event_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      },
      {
        id: 'evt-102',
        shipment_id: 'shp-001',
        status: 'picked_up',
        title: 'Collected by Courier',
        title_ar: 'تم استلام الشحنة من المتجر',
        description: 'تم استلام الطرد في شاحنة النقل اللوجستي لياليدين.',
        location: 'Oued Smar Hub',
        actor_role: 'COURIER',
        actor_name: 'مندوب ياليدين',
        event_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      },
      {
        id: 'evt-103',
        shipment_id: 'shp-001',
        status: 'in_transit',
        title: 'In Transit to Destination Wilaya',
        title_ar: 'في الطريق إلى ولاية الوجهة',
        description: 'غادرت الشحنة مركز التوزيع بالعاصمة متجهة نحو مركز سطيف.',
        location: 'Sétif Central Hub',
        actor_role: 'COURIER',
        actor_name: 'فريق الفرز الليلي',
        event_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      }
    ],
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shp-002',
    order_id: 'KHD-ORD-2026-8802',
    order_number: 'KHD-ORD-2026-8802',
    seller_id: 'str_2',
    seller_name: 'El Bahdja Sports',
    customer_id: 'usr_002',
    provider_id: 'zr_express',
    provider_name: 'ZR Express (ZIMOO)',
    provider_logo: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=120&auto=format&fit=crop&q=60',
    shipping_method_id: 'mth_home',
    shipping_method_code: 'home_delivery',
    tracking_number: 'KHM-2026-583912',
    provider_tracking_number: 'ZR-2026-583912',
    status: 'out_for_delivery',
    shipping_fee: 680,
    cod_amount: 9800,
    currency: 'DZD',
    cod_status: 'pending',
    pickup_address: 'حي القبة، شارع ديدوش مراد',
    pickup_wilaya: '16 - Alger',
    pickup_commune: 'Kouba',
    delivery_address: 'شارع العقيد لطفي، إقامة النخيل',
    delivery_wilaya: '31 - Oran',
    delivery_commune: 'Maraval',
    recipient_name: 'كريم مرابط (Karim M.)',
    recipient_phone: '0770 44 55 66',
    weight: 3.2,
    package_count: 1,
    delivery_otp_code: '491823',
    delivery_otp_verified: false,
    label_url: 'https://zrexpress.com/labels/ZR-2026-583912.pdf',
    estimated_delivery_date: new Date().toISOString(),
    driver_name: 'ياسين قدور (Yacine K.)',
    driver_phone: '0771 99 88 77',
    current_location: 'شاحنة المندوب #08 - وهران',
    timeline: [
      {
        id: 'evt-201',
        shipment_id: 'shp-002',
        status: 'picked_up',
        title: 'Picked Up by ZR Express',
        title_ar: 'تم استلام الشحنة من المتجر',
        location: 'Kouba, Alger',
        actor_role: 'COURIER',
        event_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      },
      {
        id: 'evt-202',
        shipment_id: 'shp-002',
        status: 'out_for_delivery',
        title: 'Out for Final Delivery',
        title_ar: 'الطرد مع مندوب التوصيل الآن',
        description: 'المندوب في طريقه لعنوان الزبون، يرجى تجهيز كود الأمان 491823 ومبلغ الدفع.',
        location: 'Maraval, Oran',
        actor_role: 'COURIER',
        actor_name: 'ياسين قدور',
        event_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      }
    ],
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shp-003',
    order_id: 'KHD-ORD-2026-8803',
    order_number: 'KHD-ORD-2026-8803',
    seller_id: 'str_1',
    seller_name: 'DzTech Electronics Store',
    customer_id: 'usr_003',
    provider_id: 'maystro',
    provider_name: 'Maystro Delivery',
    provider_logo: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=120&auto=format&fit=crop&q=60',
    shipping_method_id: 'mth_desk',
    shipping_method_code: 'stop_desk',
    tracking_number: 'KHM-2026-119482',
    provider_tracking_number: 'MAY-2026-119482',
    status: 'delivered',
    shipping_fee: 450,
    cod_amount: 6400,
    currency: 'DZD',
    cod_status: 'collected',
    cod_collected_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    pickup_address: 'Zone Industrielle Oued Smar',
    pickup_wilaya: '16 - Alger',
    pickup_commune: 'Oued Smar',
    delivery_address: 'مكتب مايسترو دلي إبراهيم',
    delivery_wilaya: '16 - Alger',
    delivery_commune: 'Dely Ibrahim',
    stop_desk_id: 'MAY-DESK-DELY-01',
    stop_desk_name: 'مكتب مايسترو دلي إبراهيم',
    recipient_name: 'أمير بن علي (Amir B.)',
    recipient_phone: '0550 99 11 22',
    weight: 0.5,
    package_count: 1,
    delivery_otp_code: '118492',
    delivery_otp_verified: true,
    delivered_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: 'evt-301',
        shipment_id: 'shp-003',
        status: 'picked_up',
        title: 'Picked Up',
        title_ar: 'تم استلام الشحنة',
        location: 'Hydra, Alger',
        actor_role: 'COURIER',
        event_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
      {
        id: 'evt-302',
        shipment_id: 'shp-003',
        status: 'delivered',
        title: 'Delivered at Stop Desk',
        title_ar: 'تم استلام الطرد من المكتب بنجاح',
        description: 'تم تسليم الطرد للزبون بعد التحقق من كود التأكيد واستلام المبلغ.',
        location: 'Dely Ibrahim',
        actor_role: 'CUSTOMER',
        actor_name: 'أمير بن علي',
        event_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      }
    ],
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export class ShippingManagerService {
  private getStoredShipments(): Shipment[] {
    if (typeof window === 'undefined') return SEED_SHIPMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(SEED_SHIPMENTS));
      return SEED_SHIPMENTS;
    } catch {
      return SEED_SHIPMENTS;
    }
  }

  private saveStoredShipments(shipments: Shipment[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
    } catch (e) {
      console.warn('Error saving shipments:', e);
    }
  }

  /**
   * Create a new shipment from an order
   */
  public async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    const provider = shippingProviderFactory.getProvider(input.provider_id);

    // Call carrier adapter
    const carrierRes = await provider.createShipment(input);

    const platformTrackingNumber = `KHM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const newShipment: Shipment = {
      id: `shp-${Date.now()}`,
      order_id: input.order_id,
      order_number: input.order_number || input.order_id,
      seller_id: input.seller_id,
      seller_name: input.seller_name || 'Store Seller',
      customer_id: input.customer_id,
      provider_id: provider.id,
      provider_name: provider.name,
      provider_logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=60',
      shipping_method_id: input.shipping_method_id,
      shipping_method_code: input.shipping_method_id === 'mth_desk' ? 'stop_desk' : 'home_delivery',
      tracking_number: platformTrackingNumber,
      provider_tracking_number: carrierRes.providerTrackingNumber,
      status: 'pending',
      shipping_fee: input.shipping_fee,
      cod_amount: input.cod_amount,
      currency: input.currency || 'DZD',
      cod_status: 'pending',
      pickup_address: input.pickup_address,
      pickup_wilaya: input.pickup_wilaya,
      pickup_commune: input.pickup_commune,
      pickup_contact_name: input.pickup_contact_name,
      pickup_phone: input.pickup_phone,
      delivery_address: input.delivery_address,
      delivery_wilaya: input.delivery_wilaya,
      delivery_commune: input.delivery_commune,
      recipient_name: input.recipient_name,
      recipient_phone: input.recipient_phone,
      recipient_alt_phone: input.recipient_alt_phone,
      delivery_instructions: input.delivery_instructions,
      stop_desk_id: input.stop_desk_id,
      stop_desk_name: input.stop_desk_name,
      weight: input.weight || 1.0,
      length: input.length,
      width: input.width,
      height: input.height,
      package_count: input.package_count || 1,
      notes: input.notes,
      delivery_otp_code: randomOtp,
      delivery_otp_verified: false,
      label_url: carrierRes.labelUrl,
      manifest_number: carrierRes.manifestNumber,
      estimated_delivery_date: carrierRes.estimatedDeliveryDate,
      timeline: [
        {
          id: `evt-${Date.now()}`,
          shipment_id: `shp-${Date.now()}`,
          status: 'pending',
          title: 'Shipment Created',
          title_ar: 'تم إنشاء الشحنة وتجهيز الطرد في المتجر',
          description: `تم إسناد الشحنة لشركة ${provider.nameAr} برقم تتبع: ${carrierRes.providerTrackingNumber}`,
          location: input.pickup_wilaya,
          actor_role: 'SELLER',
          actor_name: input.seller_name || 'Store Seller',
          event_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const all = this.getStoredShipments();
    this.saveStoredShipments([newShipment, ...all]);

    return newShipment;
  }

  /**
   * Get shipment by tracking number or order number
   */
  public async getShipmentByTracking(trackingNumber: string): Promise<Shipment | null> {
    const clean = (trackingNumber || '').trim().toUpperCase();
    const all = this.getStoredShipments();
    const found = all.find(s => 
      s.tracking_number.toUpperCase() === clean || 
      (s.provider_tracking_number && s.provider_tracking_number.toUpperCase() === clean) ||
      (s.order_number && s.order_number.toUpperCase() === clean) ||
      s.order_id.toUpperCase() === clean
    );
    return found || null;
  }

  /**
   * Get public sanitized tracking view (Safe for public access)
   */
  public async getPublicTracking(trackingNumber: string): Promise<PublicTrackingResult | null> {
    const shipment = await this.getShipmentByTracking(trackingNumber);
    if (!shipment) return null;

    const statusLabels: Record<InternalShipmentStatus, { en: string; ar: string }> = {
      pending: { en: 'Order Processing', ar: 'قيد التجهيز في المتجر' },
      pickup_requested: { en: 'Pickup Requested', ar: 'طلب استلام من المستودع' },
      picked_up: { en: 'Picked Up by Carrier', ar: 'تم الاستلام من طرف شركة الشحن' },
      in_transit: { en: 'In Transit', ar: 'في الطريق بين مراكز الفرز' },
      arrived_at_destination: { en: 'Arrived at Destination Hub', ar: 'وصل لمركز التوزيع بالولاية' },
      out_for_delivery: { en: 'Out for Delivery', ar: 'مع المندوب للتسليم الآن' },
      delivery_attempted: { en: 'Delivery Attempted', ar: 'محاولة تسليم غير مكتملة' },
      delivered: { en: 'Delivered', ar: 'تم التسليم بنجاح' },
      failed_delivery: { en: 'Failed Delivery', ar: 'تعذر التسليم (مؤجل)' },
      returned: { en: 'Returned to Seller', ar: 'مرتجع إلى المتجر' },
      cancelled: { en: 'Cancelled', ar: 'تم إلغاء الشحنة' },
      exception: { en: 'Exception on Hold', ar: 'شحنة معلقة استثنائياً' },
    };

    return {
      tracking_number: shipment.tracking_number,
      provider_name: shipment.provider_name || 'Khidmatik Carrier',
      provider_logo: shipment.provider_logo,
      status: shipment.status,
      status_label: statusLabels[shipment.status]?.en || 'In Progress',
      status_label_ar: statusLabels[shipment.status]?.ar || 'قيد المعالجة',
      origin_wilaya: shipment.pickup_wilaya,
      destination_wilaya: shipment.delivery_wilaya,
      destination_commune: shipment.delivery_commune,
      delivery_type_name: shipment.shipping_method_code === 'stop_desk' ? 'Pickup Point (Stop Desk)' : 'Home Delivery',
      delivery_type_name_ar: shipment.shipping_method_code === 'stop_desk' ? 'استلام من المكتب (Stop Desk)' : 'توصيل لباب المنزل (À Domicile)',
      estimated_delivery_date: shipment.estimated_delivery_date,
      driver_name: shipment.driver_name,
      driver_phone: shipment.driver_phone,
      current_location: shipment.current_location,
      delivery_otp_required: !shipment.delivery_otp_verified,
      delivery_otp_verified: shipment.delivery_otp_verified,
      delivered_at: shipment.delivered_at,
      timeline: (shipment.timeline || []).map(e => ({
        id: e.id,
        status: e.status,
        title: e.title,
        title_ar: e.title_ar,
        description: e.description,
        location: e.location,
        event_at: e.event_at,
      })),
    };
  }

  /**
   * Update shipment status and append timeline event
   */
  public async updateShipmentStatus(params: {
    trackingNumber: string;
    newStatus: InternalShipmentStatus;
    titleAr?: string;
    description?: string;
    location?: string;
    driverName?: string;
    driverPhone?: string;
    actorRole?: 'SYSTEM' | 'SELLER' | 'COURIER' | 'CUSTOMER' | 'ADMIN';
    actorName?: string;
  }): Promise<Shipment | null> {
    const all = this.getStoredShipments();
    const index = all.findIndex(s => 
      s.tracking_number === params.trackingNumber || 
      s.provider_tracking_number === params.trackingNumber
    );
    if (index === -1) return null;

    const shipment = all[index];
    shipment.status = params.newStatus;
    shipment.updated_at = new Date().toISOString();

    if (params.driverName) shipment.driver_name = params.driverName;
    if (params.driverPhone) shipment.driver_phone = params.driverPhone;
    if (params.location) shipment.current_location = params.location;

    if (params.newStatus === 'picked_up' && !shipment.picked_up_at) {
      shipment.picked_up_at = new Date().toISOString();
    }
    if (params.newStatus === 'delivered') {
      shipment.delivered_at = new Date().toISOString();
      shipment.delivery_otp_verified = true;
      shipment.cod_status = 'collected';
      shipment.cod_collected_at = new Date().toISOString();
    }
    if (params.newStatus === 'returned') {
      shipment.returned_at = new Date().toISOString();
      shipment.cod_status = 'returned';
    }
    if (params.newStatus === 'cancelled') {
      shipment.cancelled_at = new Date().toISOString();
    }

    const defaultTitles: Record<InternalShipmentStatus, string> = {
      pending: 'تجهيز الشحنة في المتجر',
      pickup_requested: 'تم طلب استلام الشحنة من المستودع',
      picked_up: 'تم استلام الشحنة من المتجر',
      in_transit: 'في الطريق بين مراكز الفرز والتوزيع',
      arrived_at_destination: 'وصل الطرد إلى مركز توزيع ولاية الوجهة',
      out_for_delivery: 'الطرد مع مندوب التوصيل للتسليم',
      delivery_attempted: 'محاولة تسليم غير مكتملة',
      delivered: 'تم تسليم الشحنة للزبون بنجاح',
      failed_delivery: 'تعذر تسليم الشحنة',
      returned: 'تم إرجاع الشحنة إلى المتجر',
      cancelled: 'تم إلغاء الشحنة',
      exception: 'تحديث استثنائي للشحنة',
    };

    const newEvent: ShipmentEvent = {
      id: `evt-${Date.now()}`,
      shipment_id: shipment.id,
      status: params.newStatus,
      title: params.newStatus,
      title_ar: params.titleAr || defaultTitles[params.newStatus] || 'تحديث حالة الشحنة',
      description: params.description,
      location: params.location || shipment.delivery_wilaya,
      actor_role: params.actorRole || 'COURIER',
      actor_name: params.actorName || 'مندوب التوصيل',
      event_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    shipment.timeline = [...(shipment.timeline || []), newEvent];
    all[index] = shipment;
    this.saveStoredShipments(all);

    return shipment;
  }

  /**
   * Log Delivery Failure Attempt
   */
  public async logDeliveryAttempt(params: {
    trackingNumber: string;
    reason: string;
    notes?: string;
    driverName?: string;
    driverPhone?: string;
    nextAttemptAt?: string;
  }): Promise<Shipment | null> {
    const shipment = await this.getShipmentByTracking(params.trackingNumber);
    if (!shipment) return null;

    const attemptsCount = (shipment.delivery_attempts?.length || 0) + 1;
    const attempt: DeliveryAttempt = {
      id: `att-${Date.now()}`,
      shipment_id: shipment.id,
      attempt_number: attemptsCount,
      status: attemptsCount >= 3 ? 'failed' : 'rescheduled',
      reason: params.reason,
      notes: params.notes,
      driver_name: params.driverName || shipment.driver_name,
      driver_phone: params.driverPhone || shipment.driver_phone,
      attempted_at: new Date().toISOString(),
      next_attempt_at: params.nextAttemptAt,
      created_at: new Date().toISOString(),
    };

    shipment.delivery_attempts = [...(shipment.delivery_attempts || []), attempt];

    const nextStatus: InternalShipmentStatus = attemptsCount >= 3 ? 'failed_delivery' : 'delivery_attempted';
    return await this.updateShipmentStatus({
      trackingNumber: shipment.tracking_number,
      newStatus: nextStatus,
      titleAr: `محاولة تسليم رقم (${attemptsCount}): ${params.reason}`,
      description: params.notes || `تعذر تسليم الطرد للسبب: ${params.reason}`,
      actorRole: 'COURIER',
      actorName: params.driverName || 'سائق التوصيل',
    });
  }

  /**
   * Initiate Shipment Return to Seller
   */
  public async initiateReturn(params: {
    trackingNumber: string;
    reason: string;
    notes?: string;
  }): Promise<Shipment | null> {
    const shipment = await this.getShipmentByTracking(params.trackingNumber);
    if (!shipment) return null;

    const returnTrackingNumber = `RET-${shipment.tracking_number}`;
    const returnRecord: ShipmentReturn = {
      id: `ret-${Date.now()}`,
      shipment_id: shipment.id,
      order_id: shipment.order_id,
      return_reason: params.reason,
      return_tracking_number: returnTrackingNumber,
      status: 'return_in_transit',
      return_notes: params.notes,
      returned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    shipment.returns = [...(shipment.returns || []), returnRecord];
    return await this.updateShipmentStatus({
      trackingNumber: shipment.tracking_number,
      newStatus: 'returned',
      titleAr: `إرجاع الشحنة للمتجر: ${params.reason}`,
      description: params.notes || 'تم بدء إجراءات إعادة الطرد لمستودع البائع.',
      actorRole: 'COURIER',
      actorName: 'قسم الإرجاع واللوجستيك العكسي',
    });
  }

  /**
   * Request warehouse pickup
   */
  public async requestPickup(trackingNumber: string): Promise<boolean> {
    const shipment = await this.getShipmentByTracking(trackingNumber);
    if (!shipment) return false;

    const provider = shippingProviderFactory.getProvider(shipment.provider_id);
    await provider.requestPickup({
      pickupAddress: shipment.pickup_address,
      pickupWilaya: shipment.pickup_wilaya,
      pickupCommune: shipment.pickup_commune,
      pickupPhone: shipment.pickup_phone || '',
      packageCount: shipment.package_count || 1,
    });

    await this.updateShipmentStatus({
      trackingNumber,
      newStatus: 'pickup_requested',
      titleAr: 'تم طلب زيارة مندوب الشحن لاستلام الطرد',
      description: 'تم إخطار شركة الشحن بوجود شحنة جاهزة للاستلام في المستودع.',
      actorRole: 'SELLER',
      actorName: shipment.seller_name,
    });

    return true;
  }

  /**
   * Get all shipments for a specific seller
   */
  public async getSellerShipments(sellerId: string): Promise<Shipment[]> {
    const all = this.getStoredShipments();
    return all.filter(s => s.seller_id === sellerId);
  }

  /**
   * Get all shipments with search and filters (Admin)
   */
  public async getAllShipments(filters?: {
    status?: InternalShipmentStatus;
    provider_id?: string;
    wilaya?: string;
    search_query?: string;
  }): Promise<Shipment[]> {
    let list = this.getStoredShipments();

    if (filters?.status) {
      list = list.filter(s => s.status === filters.status);
    }
    if (filters?.provider_id && filters.provider_id !== 'all') {
      list = list.filter(s => s.provider_id === filters.provider_id);
    }
    if (filters?.wilaya && filters.wilaya !== 'all') {
      list = list.filter(s => s.delivery_wilaya.includes(filters.wilaya!));
    }
    if (filters?.search_query) {
      const q = filters.search_query.toLowerCase();
      list = list.filter(s =>
        s.tracking_number.toLowerCase().includes(q) ||
        (s.provider_tracking_number && s.provider_tracking_number.toLowerCase().includes(q)) ||
        s.order_id.toLowerCase().includes(q) ||
        s.recipient_name.toLowerCase().includes(q) ||
        s.recipient_phone.includes(q)
      );
    }

    return list;
  }

  /**
   * Compute comprehensive Admin KPIs
   */
  public async getAdminKPIs(): Promise<AdminShippingDashboardKPIs> {
    const all = this.getStoredShipments();
    const total = all.length;
    const pending = all.filter(s => s.status === 'pending').length;
    const pickupRequested = all.filter(s => s.status === 'pickup_requested').length;
    const inTransit = all.filter(s => s.status === 'in_transit' || s.status === 'arrived_at_destination').length;
    const outForDelivery = all.filter(s => s.status === 'out_for_delivery').length;
    const delivered = all.filter(s => s.status === 'delivered').length;
    const failed = all.filter(s => s.status === 'failed_delivery' || s.status === 'delivery_attempted').length;
    const returned = all.filter(s => s.status === 'returned').length;

    const totalCodPending = all
      .filter(s => s.status !== 'delivered' && s.cod_amount > 0)
      .reduce((sum, s) => sum + s.cod_amount, 0);

    const totalCodCollected = all
      .filter(s => s.status === 'delivered' && s.cod_amount > 0)
      .reduce((sum, s) => sum + s.cod_amount, 0);

    const totalShippingRev = all.reduce((sum, s) => sum + s.shipping_fee, 0);

    const successRate = total > 0 ? Math.round((delivered / total) * 1000) / 10 : 96.5;
    const returnRate = total > 0 ? Math.round((returned / total) * 1000) / 10 : 3.5;

    // Carrier breakdowns
    const providers = shippingProviderFactory.getAllProviders();
    const shipmentsByProvider = providers.map(p => {
      const pShipments = all.filter(s => s.provider_id === p.id || s.provider_id === p.code);
      const pDelivered = pShipments.filter(s => s.status === 'delivered').length;
      const count = pShipments.length;

      return {
        provider_id: p.id,
        provider_name: p.name,
        count,
        delivered_count: pDelivered,
        success_rate: count > 0 ? Math.round((pDelivered / count) * 100) : 98,
        avg_hours: p.id === 'maystro' ? 18 : p.id === 'in_house' ? 12 : 36,
      };
    });

    // Wilaya breakdowns
    const wilayaMap: Record<string, { count: number; delivered: number }> = {};
    for (const s of all) {
      const w = s.delivery_wilaya || '16 - Alger';
      if (!wilayaMap[w]) wilayaMap[w] = { count: 0, delivered: 0 };
      wilayaMap[w].count += 1;
      if (s.status === 'delivered') wilayaMap[w].delivered += 1;
    }

    const shipmentsByWilaya = Object.entries(wilayaMap).map(([wilaya, data]) => ({
      wilaya,
      count: data.count,
      delivered_count: data.delivered,
    }));

    return {
      total_shipments: total,
      pending_count: pending,
      pickup_requested_count: pickupRequested,
      in_transit_count: inTransit,
      out_for_delivery_count: outForDelivery,
      delivered_count: delivered,
      failed_delivery_count: failed,
      returned_count: returned,
      delivery_success_rate: successRate,
      failed_delivery_rate: 100 - successRate,
      return_rate: returnRate,
      average_delivery_hours: 28,
      total_cod_pending: totalCodPending,
      total_cod_collected: totalCodCollected,
      total_shipping_revenue: totalShippingRev,
      shipments_by_provider: shipmentsByProvider,
      shipments_by_wilaya: shipmentsByWilaya,
    };
  }

  /**
   * Process Provider Webhook Idempotently
   */
  public async processWebhook(providerId: string, payload: any): Promise<{ success: boolean; trackingNumber?: string }> {
    const trackingNumber = payload.tracking_number || payload.trackingNumber || payload.code || payload.tracking;
    const rawStatus = payload.status || payload.event_type || payload.state;

    if (!trackingNumber || !rawStatus) {
      return { success: false };
    }

    const provider = shippingProviderFactory.getProvider(providerId);
    const internalStatus = provider.mapStatus(rawStatus);

    const shipment = await this.getShipmentByTracking(trackingNumber);
    if (!shipment) return { success: false };

    // Idempotency: Don't create duplicate timeline events if status hasn't changed
    if (shipment.status === internalStatus) {
      return { success: true, trackingNumber: shipment.tracking_number };
    }

    await this.updateShipmentStatus({
      trackingNumber: shipment.tracking_number,
      newStatus: internalStatus,
      titleAr: payload.title_ar || payload.status_name_ar,
      description: payload.note || payload.description,
      location: payload.location || payload.wilaya,
      driverName: payload.driver_name,
      driverPhone: payload.driver_phone,
      actorRole: 'COURIER',
      actorName: `${provider.name} Webhook Sync`,
    });

    return { success: true, trackingNumber: shipment.tracking_number };
  }
}

export const shippingManagerService = new ShippingManagerService();
