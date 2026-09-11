/**
 * Provider Verification & KYC Management Domain Types
 * Khidmatik Marketplace
 */

export type ProviderVerificationStatus =
  | 'REGISTERED'
  | 'PHONE_VERIFIED'
  | 'PROFILE_COMPLETED'
  | 'DOCUMENTS_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED'
  | 'SUSPENDED';

export type VerificationDocumentCategory =
  | 'IDENTITY_NATIONAL_ID'
  | 'IDENTITY_PASSPORT'
  | 'TRADE_REGISTER_RC'
  | 'TAX_CARD_NIF'
  | 'ARTISAN_CARD'
  | 'DIPLOMA_CERTIFICATE'
  | 'PROFESSIONAL_LICENSE'
  | 'PROOF_OF_ADDRESS'
  | 'PROFILE_PHOTO';

export interface ProviderVerificationDocument {
  id: string;
  verificationId: string;
  providerId: string;
  documentCategory: VerificationDocumentCategory;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface VerificationHistoryEvent {
  id: string;
  verificationId: string;
  actorId: string;
  actorName: string;
  actorRole: 'PROVIDER' | 'ADMIN' | 'SYSTEM';
  action: string;
  previousStatus?: ProviderVerificationStatus;
  newStatus: ProviderVerificationStatus;
  notes?: string;
  createdAt: string;
}

export interface ProviderVerificationProfile {
  id: string;
  providerId: string;
  userId?: string;
  providerName: string;
  providerType: 'artisan' | 'store' | 'freelancer' | 'company';
  status: ProviderVerificationStatus;
  phoneVerified: boolean;
  phoneNumber: string;
  email: string;
  
  // Identity Details
  legalName: string;
  nationalIdNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  
  // Business Details
  businessTradeName?: string;
  businessStructure?: 'individual_artisan' | 'registered_sole_proprietorship' | 'sarl_eurl' | 'other';
  tradeRegistryNumber?: string; // RC Number
  taxIdNumber?: string; // NIF / NIS Number
  artisanCardNumber?: string;
  wilaya: string;
  address?: string;
  profilePhotoUrl?: string;

  // Verification & Review Metadata
  verifiedBadgeActive: boolean;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  actionRequiredNotes?: string;
  submittedAt?: string;
  
  documents: ProviderVerificationDocument[];
  history: VerificationHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitVerificationProfileInput {
  providerId: string;
  legalName: string;
  nationalIdNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  businessTradeName?: string;
  businessStructure?: 'individual_artisan' | 'registered_sole_proprietorship' | 'sarl_eurl' | 'other';
  tradeRegistryNumber?: string;
  taxIdNumber?: string;
  artisanCardNumber?: string;
  wilaya: string;
  address?: string;
  profilePhotoUrl?: string;
}

export interface UploadDocumentInput {
  providerId: string;
  documentCategory: VerificationDocumentCategory;
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface AdminReviewDecisionInput {
  verificationId: string;
  adminId: string;
  adminName: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_DOCUMENTS' | 'SUSPEND';
  rejectionReason?: string;
  actionRequiredNotes?: string;
  mediatorNotes?: string;
}
