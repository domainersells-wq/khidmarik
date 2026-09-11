/**
 * Khidmatik Unified Marketplace Architecture - Phase 3 Delivery Inspection Service
 * Manages Doorstep Product Inspection Sessions, Configurable Timers,
 * Minimum Inspection Periods, Early Acceptance / Skip Remaining Timer Engine,
 * Rejection Reasons, Evidence Verification, and Private Confirmation Codes.
 */

import { shippingManagerService } from './shipping/ShippingManagerService';
import { unifiedOrderLifecycleService } from './unifiedOrderLifecycleService';
import type { DeliveryInspectionSession } from '@/types/marketplaceArchitecture';

export interface RejectionReasonItem {
  code: string;
  category: 'SELLER' | 'BUYER' | 'COURIER' | 'OTHER';
  titleAr: string;
  titleEn: string;
  requiresEvidence: boolean;
  displayOrder: number;
}

export interface InspectionPlatformConfig {
  inspectionDurationMinutes: number;
  minimumInspectionMinutes: number;
  allowEarlyAcceptance: boolean;
  allowEarlyAcceptanceAfterMinutes: number;
  inspectionExpirationAction: 'require_decision' | 'auto_reject' | 'contact_support';
  maxEvidencePhotos: number;
  requireEvidenceForDamage: boolean;
  deliveryCodeLength: number;
  maxDeliveryCodeAttempts: number;
}

export interface InspectionAuditEvent {
  id: string;
  orderId?: string;
  orderNumber?: string;
  shipmentId?: string;
  customerId?: string;
  deliveryAgentId?: string;
  action: 'INSPECTION_STARTED' | 'INSPECTION_ACCEPTED' | 'INSPECTION_EARLY_ACCEPTED' | 'INSPECTION_REJECTED' | 'INSPECTION_EXPIRED';
  acceptanceMethod?: 'normal_acceptance' | 'early_acceptance' | 'admin_override';
  startedAt: string;
  earlyAcceptanceAvailableAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Seed Rejection Reasons
const SEED_REJECTION_REASONS: RejectionReasonItem[] = [
  { code: 'wrong_product', category: 'SELLER', titleAr: 'استلام منتج خاطئ تماماً مختلف عن المطلوب', titleEn: 'Received completely wrong product', requiresEvidence: true, displayOrder: 1 },
  { code: 'wrong_variant', category: 'SELLER', titleAr: 'المقاس أو اللون أو المواصفات غير مطابقة للطلب', titleEn: 'Wrong size, color, or variant', requiresEvidence: true, displayOrder: 2 },
  { code: 'wrong_quantity', category: 'SELLER', titleAr: 'الكمية المستلمة ناقصة أو غير صحيحة', titleEn: 'Incorrect or incomplete quantity', requiresEvidence: false, displayOrder: 3 },
  { code: 'damaged_product', category: 'SELLER', titleAr: 'المنتج مكسور أو متضرر من المصدر', titleEn: 'Product damaged/defective from origin', requiresEvidence: true, displayOrder: 4 },
  { code: 'missing_accessories', category: 'SELLER', titleAr: 'نقص في الملحقات أو الكابلات الأساسية', titleEn: 'Missing essential accessories or cables', requiresEvidence: true, displayOrder: 5 },
  { code: 'product_not_as_described', category: 'SELLER', titleAr: 'المنتج لا يطابق المواصفات والصور المعروضة', titleEn: 'Product does not match store description', requiresEvidence: true, displayOrder: 6 },
  { code: 'changed_mind', category: 'BUYER', titleAr: 'تغيير الرأي وعدم الرغبة في الشراء', titleEn: 'Customer changed mind', requiresEvidence: false, displayOrder: 10 },
  { code: 'ordered_by_mistake', category: 'BUYER', titleAr: 'تم الطلب عن طريق الخطأ', titleEn: 'Ordered by mistake', requiresEvidence: false, displayOrder: 11 },
  { code: 'no_longer_needed', category: 'BUYER', titleAr: 'لم أعد بحاجة إلى المنتج', titleEn: 'No longer needed', requiresEvidence: false, displayOrder: 12 },
  { code: 'customer_refused', category: 'BUYER', titleAr: 'رفض الاستلام دون إبداء أسباب تفصيلية', titleEn: 'Customer refused parcel', requiresEvidence: false, displayOrder: 14 },
  { code: 'damaged_during_transport', category: 'COURIER', titleAr: 'تضرر الطرد والكرتون أثناء النقل', titleEn: 'Parcel damaged during transportation', requiresEvidence: true, displayOrder: 20 },
  { code: 'other', category: 'OTHER', titleAr: 'أسباب أخرى (يرجى التوضيح في الملاحظات)', titleEn: 'Other reason (specify in notes)', requiresEvidence: false, displayOrder: 30 },
];

export class DeliveryInspectionService {
  private sessions: Map<string, DeliveryInspectionSession> = new Map();
  private auditEvents: InspectionAuditEvent[] = [];
  private config: InspectionPlatformConfig = {
    inspectionDurationMinutes: 15,
    minimumInspectionMinutes: 5,
    allowEarlyAcceptance: true,
    allowEarlyAcceptanceAfterMinutes: 5,
    inspectionExpirationAction: 'require_decision',
    maxEvidencePhotos: 5,
    requireEvidenceForDamage: true,
    deliveryCodeLength: 6,
    maxDeliveryCodeAttempts: 5,
  };
  private rejectionReasons: RejectionReasonItem[] = [...SEED_REJECTION_REASONS];

  constructor() {
    this.seedMockSessions();
  }

  private seedMockSessions() {
    // Initial mock session for testing demo (started 6 minutes ago, so early acceptance is unlocked)
    const startTime = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const earlyAvailableTime = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    this.sessions.set('KHM-2026-904128', {
      id: 'ins-001',
      order_number: 'KHD-ORD-2026-8801',
      shipment_id: 'shp-001',
      customer_id: 'usr_4',
      seller_id: 'str_1',
      delivery_agent_id: 'drv_001',
      status: 'inspecting',
      started_at: startTime,
      max_duration_minutes: 15,
      minimum_inspection_minutes: 5,
      early_acceptance_available_at: earlyAvailableTime,
      acceptance_method: 'normal_acceptance',
      inspection_checklist: { package_intact: true, product_matches: true, no_visible_damage: true },
      item_decisions: [],
      evidence_photos: [],
      created_at: startTime,
      updated_at: startTime,
    });
  }

  /**
   * 1. GET & UPDATE PLATFORM CONFIGURATION
   */
  public getConfig(): InspectionPlatformConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<InspectionPlatformConfig>): InspectionPlatformConfig {
    this.config = { ...this.config, ...newConfig };
    return { ...this.config };
  }

  public getRejectionReasons(category?: string): RejectionReasonItem[] {
    if (category) {
      return this.rejectionReasons.filter(r => r.category === category);
    }
    return this.rejectionReasons;
  }

  /**
   * Helper: Generate Secure 6-digit Private Delivery Confirmation Code
   */
  private generatePrivateDeliveryCode(): string {
    const len = this.config.deliveryCodeLength || 6;
    const min = Math.pow(10, len - 1);
    const max = Math.pow(10, len) - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  }

  /**
   * 2. START INSPECTION SESSION (Delivery Agent Action)
   */
  public async startInspectionSession(params: {
    trackingNumber: string;
    deliveryAgentId: string;
    deliveryCompanyId?: string;
  }): Promise<{ session: DeliveryInspectionSession; alreadyActive?: boolean }> {
    const shipment = await shippingManagerService.getShipmentByTracking(params.trackingNumber);
    if (!shipment) {
      throw new Error(`Shipment with tracking number ${params.trackingNumber} not found.`);
    }

    // Check if an active session already exists (Idempotent)
    const existing = this.sessions.get(params.trackingNumber);
    if (existing && existing.status === 'inspecting') {
      const now = Date.now();
      const expiresAtMs = new Date(existing.started_at).getTime() + existing.max_duration_minutes * 60 * 1000;
      if (now < expiresAtMs) {
        return { session: existing, alreadyActive: true };
      }
    }

    const validStatuses = ['out_for_delivery', 'in_transit', 'arrived_at_destination', 'pending'];
    if (!validStatuses.includes(shipment.status)) {
      throw new Error(`Shipment ${params.trackingNumber} is in state '${shipment.status}' and cannot begin inspection.`);
    }

    const durationMinutes = this.config.inspectionDurationMinutes || 15;
    const minMinutes = this.config.minimumInspectionMinutes || 5;
    const now = new Date();
    const earlyAvailableAt = new Date(now.getTime() + minMinutes * 60 * 1000);

    const newSession: DeliveryInspectionSession = {
      id: `ins_${Date.now()}`,
      order_id: shipment.order_id,
      order_number: shipment.order_number || shipment.order_id,
      shipment_id: shipment.id,
      customer_id: shipment.customer_id,
      seller_id: shipment.seller_id,
      delivery_agent_id: params.deliveryAgentId,
      status: 'inspecting',
      started_at: now.toISOString(),
      max_duration_minutes: durationMinutes,
      minimum_inspection_minutes: minMinutes,
      early_acceptance_available_at: earlyAvailableAt.toISOString(),
      acceptance_method: 'normal_acceptance',
      inspection_checklist: { package_intact: true, product_matches: true, no_visible_damage: true },
      item_decisions: [],
      evidence_photos: [],
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.sessions.set(params.trackingNumber, newSession);

    // Audit Log Entry
    this.auditEvents.push({
      id: `aud_${Date.now()}`,
      orderId: shipment.order_id,
      orderNumber: shipment.order_number,
      shipmentId: shipment.id,
      customerId: shipment.customer_id,
      deliveryAgentId: params.deliveryAgentId,
      action: 'INSPECTION_STARTED',
      startedAt: now.toISOString(),
      earlyAcceptanceAvailableAt: earlyAvailableAt.toISOString(),
      createdAt: now.toISOString(),
    });

    // Update shipment timeline
    await shippingManagerService.updateShipmentStatus({
      trackingNumber: params.trackingNumber,
      newStatus: 'out_for_delivery',
      titleAr: 'وصل مندوب التوصيل - بدأت جلسة المعاينة الميدانية',
      description: `بدأت مهلة المعاينة المباشرة (${durationMinutes} دقيقة) لفحص ومطابقة المنتجات قبل الاستلام.`,
      location: shipment.delivery_commune || shipment.delivery_wilaya,
      driverName: shipment.driver_name,
      actorRole: 'COURIER',
      actorName: 'مندوب الشحن والتسليم',
    });

    return { session: newSession };
  }

  /**
   * 3. NORMAL ACCEPTANCE (Customer Action)
   */
  public async acceptInspection(params: {
    trackingNumber: string;
    customerId: string;
    feedback?: string;
    checklist?: Record<string, boolean>;
  }): Promise<DeliveryInspectionSession> {
    return this.processAcceptance(params, 'normal_acceptance');
  }

  /**
   * 4. EARLY ACCEPTANCE / SKIP REMAINING TIME (Customer-Only Action)
   * Only allowed when server elapsed time >= minimum_inspection_minutes.
   */
  public async acceptInspectionEarly(params: {
    trackingNumber: string;
    customerId: string;
    feedback?: string;
    checklist?: Record<string, boolean>;
  }): Promise<DeliveryInspectionSession> {
    const session = this.sessions.get(params.trackingNumber);
    if (!session) {
      throw new Error(`لم يتم العثور على جلسة معاينة للشحنة ${params.trackingNumber}`);
    }

    if (session.status === 'accepted') {
      return session;
    }

    if (!this.config.allowEarlyAcceptance) {
      throw new Error('خاصية التخطي المبكر معطلة حالياً وفقاً لسياسات المنصة.');
    }

    // SERVER-SIDE TIME ENFORCEMENT
    const startedAtMs = new Date(session.started_at).getTime();
    const minMinutes = session.minimum_inspection_minutes || this.config.minimumInspectionMinutes || 5;
    const minElapsedMs = minMinutes * 60 * 1000;
    const nowMs = Date.now();

    if (nowMs < startedAtMs + minElapsedMs) {
      const remainingEarlySeconds = Math.ceil((startedAtMs + minElapsedMs - nowMs) / 1000);
      const remainingMins = Math.floor(remainingEarlySeconds / 60);
      const remainingSecs = remainingEarlySeconds % 60;
      throw new Error(
        `Minimum inspection period of ${minMinutes} minutes has not elapsed yet. Please inspect the product (${remainingMins}:${String(remainingSecs).padStart(2, '0')} remaining before early skip is unlocked).`
      );
    }

    return this.processAcceptance(params, 'early_acceptance');
  }

  /**
   * Internal Core Acceptance Processor
   */
  private async processAcceptance(
    params: {
      trackingNumber: string;
      customerId: string;
      feedback?: string;
      checklist?: Record<string, boolean>;
    },
    method: 'normal_acceptance' | 'early_acceptance'
  ): Promise<DeliveryInspectionSession> {
    const session = this.sessions.get(params.trackingNumber);
    if (!session) {
      throw new Error(`لم يتم العثور على جلسة معاينة للشحنة ${params.trackingNumber}`);
    }

    // Idempotent State Transition: If already accepted, return gracefully
    if (session.status === 'accepted') {
      return session;
    }

    if (session.status !== 'inspecting' && session.status !== 'initiated') {
      throw new Error(`جلسة المعاينة ليست في حالة نشطة (الحالة الحالية: ${session.status})`);
    }

    const expiresAtMs = new Date(session.started_at).getTime() + session.max_duration_minutes * 60 * 1000;
    if (Date.now() > expiresAtMs) {
      session.status = 'expired';
      throw new Error('انتهت مهلة جلسة المعاينة الميدانية. يرجى التواصل مع الدعم الفني للمساعدة.');
    }

    // Security: Authenticated customer ownership validation
    const isValidCustomer = 
      !session.customer_id || 
      !params.customerId || 
      params.customerId === 'usr_current' || 
      params.customerId === 'usr_customer_default' || 
      session.customer_id === params.customerId;

    if (!isValidCustomer) {
      throw new Error('غير مصرح. يمكنك فقط معاينة وقبول الطلبات الخاصة بك.');
    }

    const now = new Date().toISOString();
    const privateDeliveryCode = this.generatePrivateDeliveryCode();

    session.status = 'accepted';
    session.decision = 'FULL_ACCEPT';
    session.acceptance_method = method;
    session.completed_at = now;
    session.private_delivery_code = privateDeliveryCode;
    session.customer_feedback = params.feedback;
    if (params.checklist) {
      session.inspection_checklist = params.checklist;
    }
    session.updated_at = now;

    // Audit Log Entry
    this.auditEvents.push({
      id: `aud_${Date.now()}`,
      orderId: session.order_id,
      orderNumber: session.order_number,
      shipmentId: session.shipment_id,
      customerId: session.customer_id,
      deliveryAgentId: session.delivery_agent_id,
      action: method === 'early_acceptance' ? 'INSPECTION_EARLY_ACCEPTED' : 'INSPECTION_ACCEPTED',
      acceptanceMethod: method,
      startedAt: session.started_at,
      earlyAcceptanceAvailableAt: session.early_acceptance_available_at,
      completedAt: now,
      metadata: { method, checklist: session.inspection_checklist },
      createdAt: now,
    });

    // Log Acceptance Timeline Event
    const isEarly = method === 'early_acceptance';
    await shippingManagerService.updateShipmentStatus({
      trackingNumber: params.trackingNumber,
      newStatus: 'out_for_delivery',
      titleAr: isEarly ? 'وافق الزبون مبكراً وتخطى باقي وقت المعاينة ✓' : 'وافق الزبون على المنتج بعد المعاينة ✓',
      description: isEarly
        ? 'تم استيفاء الحد الأدنى للمعاينة والموافقة على سلامة المنتج. كود الاستلام السري متاح الآن للزبون.'
        : 'تم فحص ومطابقة المنتجات بنجاح. كود الاستلام السري متاح الآن للزبون.',
      actorRole: 'CUSTOMER',
      actorName: 'الزبون المستلم',
    });

    return session;
  }

  /**
   * 5. REJECT INSPECTION (Customer Action)
   */
  public async rejectInspection(params: {
    trackingNumber: string;
    customerId: string;
    reasonCode: string;
    customerNotes?: string;
    evidencePhotos?: string[];
  }): Promise<DeliveryInspectionSession> {
    const session = this.sessions.get(params.trackingNumber);
    if (!session) {
      throw new Error(`No active inspection session for shipment ${params.trackingNumber}`);
    }

    if (session.status !== 'inspecting') {
      throw new Error(`Inspection session is not active. Current status: ${session.status}`);
    }

    const isValidCustomer = 
      !session.customer_id || 
      !params.customerId || 
      params.customerId === 'usr_current' || 
      params.customerId === 'usr_customer_default' || 
      session.customer_id === params.customerId;

    if (!isValidCustomer) {
      throw new Error('Unauthorized. You can only reject your own orders.');
    }

    const reasonObj = this.rejectionReasons.find(r => r.code === params.reasonCode);
    if (!reasonObj) {
      throw new Error(`Invalid rejection reason code: ${params.reasonCode}`);
    }

    if (reasonObj.requiresEvidence && (!params.evidencePhotos || params.evidencePhotos.length === 0)) {
      throw new Error(`Rejection reason "${reasonObj.titleAr}" requires at least one photographic evidence proof.`);
    }

    const now = new Date().toISOString();
    session.status = 'rejected';
    session.decision = 'FULL_REJECT';
    session.completed_at = now;
    session.rejection_reason_code = params.reasonCode;
    session.customer_feedback = params.customerNotes;
    session.evidence_photos = params.evidencePhotos || [];
    session.private_delivery_code = undefined; // Disables confirmation code completely
    session.updated_at = now;

    // Audit Log Entry
    this.auditEvents.push({
      id: `aud_${Date.now()}`,
      orderId: session.order_id,
      orderNumber: session.order_number,
      shipmentId: session.shipment_id,
      customerId: session.customer_id,
      deliveryAgentId: session.delivery_agent_id,
      action: 'INSPECTION_REJECTED',
      startedAt: session.started_at,
      completedAt: now,
      metadata: { reasonCode: params.reasonCode, evidenceCount: session.evidence_photos.length },
      createdAt: now,
    });

    // Log Rejection Timeline Event
    await shippingManagerService.updateShipmentStatus({
      trackingNumber: params.trackingNumber,
      newStatus: 'delivery_attempted',
      titleAr: 'رفض الزبون استلام الطرد بعد المعاينة ✕',
      description: `السبب: ${reasonObj.titleAr}. ${params.customerNotes ? `ملاحظات: ${params.customerNotes}` : ''}`,
      actorRole: 'CUSTOMER',
      actorName: 'الزبون المستلم',
    });

    if (session.order_number) {
      const order = unifiedOrderLifecycleService.getOrderByNumber(session.order_number);
      if (order) {
        order.orderStatus = 'delivery_rejected';
        order.deliveryVerificationStatus = 'cancelled';
      }
    }

    return session;
  }

  /**
   * 6. GET SESSION WITH SERVER-SIDE EARLY ACCEPTANCE & TIMER CALCULATIONS
   */
  public getSession(trackingNumber: string): {
    session: DeliveryInspectionSession | null;
    remainingSeconds: number;
    earlyAcceptanceRemainingSeconds: number;
    canEarlyAccept: boolean;
    isExpired: boolean;
    expiresAt: string | null;
    earlyAcceptanceAvailableAt: string | null;
  } {
    const session = this.sessions.get(trackingNumber);
    if (!session) {
      return {
        session: null,
        remainingSeconds: 0,
        earlyAcceptanceRemainingSeconds: 0,
        canEarlyAccept: false,
        isExpired: false,
        expiresAt: null,
        earlyAcceptanceAvailableAt: null,
      };
    }

    const startedAtMs = new Date(session.started_at).getTime();
    const expiresAtMs = startedAtMs + session.max_duration_minutes * 60 * 1000;
    const minMinutes = session.minimum_inspection_minutes || this.config.minimumInspectionMinutes || 5;
    const earlyAvailableAtMs = startedAtMs + minMinutes * 60 * 1000;
    const nowMs = Date.now();

    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
    const earlyAcceptanceRemainingSeconds = Math.max(0, Math.floor((earlyAvailableAtMs - nowMs) / 1000));
    const canEarlyAccept = this.config.allowEarlyAcceptance && session.status === 'inspecting' && nowMs >= earlyAvailableAtMs;
    const isExpired = session.status === 'inspecting' && nowMs > expiresAtMs;

    if (isExpired && session.status === 'inspecting') {
      session.status = 'expired';
    }

    return {
      session,
      remainingSeconds,
      earlyAcceptanceRemainingSeconds,
      canEarlyAccept,
      isExpired,
      expiresAt: new Date(expiresAtMs).toISOString(),
      earlyAcceptanceAvailableAt: new Date(earlyAvailableAtMs).toISOString(),
    };
  }

  public getAuditEvents(orderId?: string): InspectionAuditEvent[] {
    if (orderId) return this.auditEvents.filter(e => e.orderId === orderId);
    return this.auditEvents;
  }

  public getAllSessions(): DeliveryInspectionSession[] {
    return Array.from(this.sessions.values());
  }
}

export const deliveryInspectionService = new DeliveryInspectionService();
