/**
 * Private Delivery Confirmation Code, Inspection Session & Platform Settings Types
 * Khidmatik Marketplace
 */

export interface PlatformDeliverySettings {
  id: string;
  deliveryConfirmationEnabled: boolean;
  deliveryCodeLength: number; // default 6
  deliveryCodeExpirationDays: number; // default 15
  maxDeliveryCodeAttempts: number; // default 5
  deliveryInspectionMinutes: number; // default 10
  requireCustomerInspection: boolean; // default true
  allowCodeRegeneration: boolean; // default true
}

export type InspectionStatus =
  | 'not_started'
  | 'inspecting'
  | 'accepted'
  | 'rejected';

export interface DeliveryInspectionSession {
  status: InspectionStatus;
  startedAt?: string;
  durationMinutes: number;
  remainingSeconds: number;
  isExpired: boolean;
}

export interface PrivateDeliveryCodeView {
  orderId: string;
  orderNumber: string; // Public reference e.g. "KHM-2026-001245"
  code: string; // Private secret e.g. "583214"
  isMasked: boolean;
  status: 'available' | 'pending' | 'verified' | 'expired' | 'locked' | 'cancelled';
  inspectionSession: DeliveryInspectionSession;
  attemptsRemaining: number;
  maxAttempts: number;
  canRegenerate: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface SellerDeliveryVerificationView {
  orderId: string;
  orderNumber: string;
  verificationStatus: 'pending' | 'verified' | 'locked';
  verifiedAt?: string;
  verifiedBy?: string;
}
