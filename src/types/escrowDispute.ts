/**
 * Escrow & Dispute Resolution Domain Types
 * Khidmatik Marketplace
 */

export type EscrowStatus =
  | 'HELD'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'CONFIRMED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'WAITING_CUSTOMER'
  | 'WAITING_PROVIDER'
  | 'RESOLVED'
  | 'REFUNDED'
  | 'RELEASED'
  | 'CLOSED';

export type DisputeReasonCode =
  | 'NOT_DELIVERED'
  | 'DAMAGED_ITEMS'
  | 'WRONG_ITEMS'
  | 'POOR_QUALITY'
  | 'UNAUTHORIZED_CHARGE'
  | 'OTHER';

export type DisputeResolutionAction =
  | 'FULL_REFUND_CUSTOMER'
  | 'PARTIAL_REFUND_SPLIT'
  | 'RELEASE_TO_PROVIDER';

export interface DisputeEvidenceItem {
  id: string;
  disputeId: string;
  uploaderId: string;
  uploaderRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  fileUrl: string;
  fileName: string;
  fileType: string;
  description?: string;
  uploadedAt: string;
}

export interface DisputeTimelineEvent {
  id: string;
  disputeId: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PlatformDisputeRecord {
  id: string;
  disputeNumber: string; // e.g. "DSP-2026-000412"
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  providerId: string;
  providerName?: string;
  reasonCode: DisputeReasonCode;
  status: DisputeStatus;
  disputedAmount: number;
  currency: string;
  customerClaimDescription: string;
  providerResponseText?: string;
  providerProposedRefundAmount?: number;
  assignedMediatorId?: string;
  mediatorNotes?: string;
  resolutionAction?: DisputeResolutionAction;
  customerRefundAmount?: number;
  providerPayoutAmount?: number;
  evidence: DisputeEvidenceItem[];
  timeline: DisputeTimelineEvent[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformEscrowRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  payerId: string;
  providerId: string;
  escrowAmount: number;
  currency: string;
  status: EscrowStatus;
  protectionExpiresAt?: string;
  releasedAt?: string;
  releasedBy?: string;
  releaseType?: 'automatic' | 'customer_confirmed' | 'early_release' | 'admin_mediated';
  createdAt: string;
  updatedAt: string;
}

export interface OpenDisputeInput {
  orderId: string;
  customerId: string;
  customerName?: string;
  reasonCode: DisputeReasonCode;
  claimDescription: string;
  evidenceUrls?: string[];
}

export interface SubmitProviderResponseInput {
  disputeId: string;
  providerId: string;
  responseText: string;
  proposedRefundAmount?: number;
  evidenceUrls?: string[];
}

export interface ResolveDisputeInput {
  disputeId: string;
  adminId: string;
  adminName?: string;
  resolutionAction: DisputeResolutionAction;
  customerRefundAmount?: number;
  providerPayoutAmount?: number;
  mediatorNotes: string;
}
