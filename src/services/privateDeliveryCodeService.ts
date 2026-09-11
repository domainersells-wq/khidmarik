'use client';

import {
  PlatformDeliverySettings,
  PrivateDeliveryCodeView,
  DeliveryInspectionSession,
  SellerDeliveryVerificationView,
} from '@/types/privateDeliveryCode';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';
import { customerOrderService } from '@/services/customerOrderService';

// ------------------------------------------------------------------------------------------------
// DEFAULT PLATFORM DELIVERY SETTINGS
// ------------------------------------------------------------------------------------------------

const DEFAULT_PLATFORM_SETTINGS: PlatformDeliverySettings = {
  id: 'default',
  deliveryConfirmationEnabled: true,
  deliveryCodeLength: 6,
  deliveryCodeExpirationDays: 15,
  maxDeliveryCodeAttempts: 5,
  deliveryInspectionMinutes: 10,
  requireCustomerInspection: true,
  allowCodeRegeneration: true,
};

// ------------------------------------------------------------------------------------------------
// PRIVATE DELIVERY CODE SERVICE
// ------------------------------------------------------------------------------------------------

class PrivateDeliveryCodeService {
  private SETTINGS_KEY = 'khidmatik_platform_delivery_settings_v2';
  private SESSIONS_KEY = 'khidmatik_inspection_sessions_v2';

  public getPlatformDeliverySettings(): PlatformDeliverySettings {
    if (typeof window === 'undefined') return DEFAULT_PLATFORM_SETTINGS;
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_PLATFORM_SETTINGS;
  }

  public updatePlatformDeliverySettings(settings: Partial<PlatformDeliverySettings>): PlatformDeliverySettings {
    const current = this.getPlatformDeliverySettings();
    const updated = { ...current, ...settings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    return updated;
  }

  /**
   * Start a live Doorstep Delivery Inspection Session for an arriving parcel
   */
  public async startInspectionSession(
    orderIdOrNumber: string,
    customerId: string = 'usr_1'
  ): Promise<DeliveryInspectionSession> {
    const order = await customerOrderService.getOrderDetails(orderIdOrNumber);
    const settings = this.getPlatformDeliverySettings();
    const durationMinutes = settings.deliveryInspectionMinutes;

    const session: DeliveryInspectionSession = {
      status: 'inspecting',
      startedAt: new Date().toISOString(),
      durationMinutes,
      remainingSeconds: durationMinutes * 60,
      isExpired: false,
    };

    if (typeof window !== 'undefined' && order) {
      try {
        const saved = localStorage.getItem(this.SESSIONS_KEY);
        const sessions = saved ? JSON.parse(saved) : {};
        sessions[order.id] = session;
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error(e);
      }
    }

    return session;
  }

  /**
   * Record Customer Inspection Decision (Accept vs Reject)
   */
  public async recordInspectionDecision(
    orderIdOrNumber: string,
    decision: 'accepted' | 'rejected'
  ): Promise<{ success: boolean; session: DeliveryInspectionSession }> {
    const order = await customerOrderService.getOrderDetails(orderIdOrNumber);
    const settings = this.getPlatformDeliverySettings();

    let session: DeliveryInspectionSession = {
      status: decision,
      startedAt: new Date().toISOString(),
      durationMinutes: settings.deliveryInspectionMinutes,
      remainingSeconds: 0,
      isExpired: false,
    };

    if (typeof window !== 'undefined' && order) {
      try {
        const saved = localStorage.getItem(this.SESSIONS_KEY);
        const sessions = saved ? JSON.parse(saved) : {};
        session = { ...(sessions[order.id] || session), status: decision };
        sessions[order.id] = session;
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error(e);
      }
    }

    return { success: true, session };
  }

  /**
   * Securely retrieve the Private Delivery Confirmation Code for the authenticated customer
   */
  public async getCustomerPrivateCode(
    orderIdOrNumber: string,
    customerId: string = 'usr_1'
  ): Promise<PrivateDeliveryCodeView | null> {
    const order = await customerOrderService.getOrderDetails(orderIdOrNumber);
    if (!order) return null;

    const settings = this.getPlatformDeliverySettings();
    let rawCodeInfo: any = null;
    try {
      rawCodeInfo = await deliveryVerificationService.getCustomerDeliveryCode(order.id, customerId);
    } catch (e) {
      // Code is not yet active (e.g. order in transit or inspection not yet finished)
      rawCodeInfo = {
        code: '',
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        canRegenerate: false,
      };
    }

    if (!rawCodeInfo) {
      rawCodeInfo = {
        code: '',
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        canRegenerate: false,
      };
    }

    // Load active inspection session
    let inspectionSession: DeliveryInspectionSession = {
      status: order.status === 'delivered' || order.status === 'completed' ? 'accepted' : 'not_started',
      durationMinutes: settings.deliveryInspectionMinutes,
      remainingSeconds: settings.deliveryInspectionMinutes * 60,
      isExpired: false,
    };

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.SESSIONS_KEY);
        if (saved) {
          const sessions = JSON.parse(saved);
          if (sessions[order.id]) {
            const sess = sessions[order.id];
            if (sess.startedAt && sess.status === 'inspecting') {
              const elapsedSec = Math.floor((Date.now() - new Date(sess.startedAt).getTime()) / 1000);
              const remainingSec = Math.max(0, sess.durationMinutes * 60 - elapsedSec);
              inspectionSession = {
                ...sess,
                remainingSeconds: remainingSec,
                isExpired: remainingSec === 0,
              };
            } else {
              inspectionSession = sess;
            }
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber, // Public Order Number (e.g. "KHM-2026-000001")
      code: rawCodeInfo.code || '', // Secret Private Confirmation Code (e.g. "583214")
      isMasked: true, // Hidden by default
      status: rawCodeInfo.status || 'pending',
      inspectionSession,
      attemptsRemaining: Math.max(0, (rawCodeInfo.maxAttempts || 3) - (rawCodeInfo.attempts || 0)),
      maxAttempts: rawCodeInfo.maxAttempts || 3,
      canRegenerate: !!(rawCodeInfo.canRegenerate && settings.allowCodeRegeneration),
      verifiedAt: rawCodeInfo.verifiedAt || order.deliveredAt,
      verifiedBy: (order as any).verifiedBy || 'Courier Verification',
    };
  }

  /**
   * Sanitized Delivery Verification View for Sellers (Zero plaintext OTP, zero hash)
   */
  public async getSellerDeliveryStatus(
    orderIdOrNumber: string
  ): Promise<SellerDeliveryVerificationView | null> {
    const order = await customerOrderService.getOrderDetails(orderIdOrNumber);
    if (!order) return null;

    const isVerified = order.status === 'delivered' || order.status === 'completed';

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      verificationStatus: isVerified ? 'verified' : 'pending',
      verifiedAt: order.deliveredAt,
      verifiedBy: (order as any).verifiedBy || 'Courier Verification Handover',
    };
  }
}

export const privateDeliveryCodeService = new PrivateDeliveryCodeService();
