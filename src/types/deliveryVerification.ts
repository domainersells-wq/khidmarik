/**
 * Delivery Verification OTP & Anti-Fraud Domain Types
 * Khidmatik Marketplace
 */

export type DeliveryVerificationStatus =
  | 'pending'
  | 'verified'
  | 'expired'
  | 'locked'
  | 'cancelled';

export type DeliveryMethod =
  | 'shipping_company'
  | 'seller_delivery'
  | 'store_pickup';

export interface DeliveryVerificationRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  codeHash: string;
  salt: string;
  plaintextCode?: string; // Only populated transiently for the authenticated customer
  status: DeliveryVerificationStatus;
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedByRole?: 'DELIVERY_AGENT' | 'STORE_EMPLOYEE' | 'ADMIN' | 'SYSTEM';
  deliveryAgentId?: string;
  deliveryCompanyId?: string;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryVerificationLog {
  id: string;
  orderId: string;
  verificationId?: string;
  actorId: string;
  actorRole: 'CUSTOMER' | 'DELIVERY_AGENT' | 'STORE_EMPLOYEE' | 'ADMIN' | 'SYSTEM';
  action:
    | 'code_generated'
    | 'verification_attempt'
    | 'verification_failed'
    | 'verification_locked'
    | 'verification_success'
    | 'code_regenerated'
    | 'verification_cancelled';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CustomerDeliveryCodeView {
  orderId: string;
  orderNumber: string;
  code: string; // 6-digit numeric OTP e.g. "583214"
  status: DeliveryVerificationStatus;
  deliveryMethod: DeliveryMethod;
  expiresAt: string;
  verifiedAt?: string;
  attempts: number;
  maxAttempts: number;
  canRegenerate: boolean;
}

export interface VerifyDeliveryInput {
  orderId: string;
  code: string;
  agentId: string;
  agentRole: 'DELIVERY_AGENT' | 'STORE_EMPLOYEE' | 'ADMIN';
  agentName: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyDeliveryResult {
  success: boolean;
  status: DeliveryVerificationStatus;
  orderNumber?: string;
  error?: string;
  remainingAttempts?: number;
  isLocked?: boolean;
  verifiedAt?: string;
}
