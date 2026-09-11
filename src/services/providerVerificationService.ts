'use client';

import {
  ProviderVerificationProfile,
  ProviderVerificationStatus,
  VerificationDocumentCategory,
  ProviderVerificationDocument,
  VerificationHistoryEvent,
  SubmitVerificationProfileInput,
  UploadDocumentInput,
  AdminReviewDecisionInput,
} from '@/types/providerVerification';
import { notificationService } from '@/services/notificationService';
import { adminDataService } from '@/services/adminDataService';

// ------------------------------------------------------------------------------------------------
// INITIAL SEED VERIFICATION PROFILES
// ------------------------------------------------------------------------------------------------

const SEED_PROFILES: ProviderVerificationProfile[] = [
  {
    id: 'verif_1',
    providerId: 'prv_1',
    userId: 'usr_p1',
    providerName: 'Sofiane Hadj (Plomberie Express)',
    providerType: 'artisan',
    status: 'UNDER_REVIEW',
    phoneVerified: true,
    phoneNumber: '+213 551 22 33 44',
    email: 'sofiane.plomb@gmail.com',
    legalName: 'Sofiane Hadj',
    nationalIdNumber: '119841602938491029',
    dateOfBirth: '1988-05-14',
    nationality: 'Algerian',
    businessTradeName: 'Plomberie Express Hadj',
    businessStructure: 'individual_artisan',
    tradeRegistryNumber: '16/00-0982312A22',
    taxIdNumber: '001916029384910',
    artisanCardNumber: 'ART-ALG-2021-8842',
    wilaya: 'Algiers (16)',
    address: '12 Rue Didouche Mourad, Alger Centre',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    verifiedBadgeActive: false,
    submittedAt: '2026-08-22 10:15',
    documents: [
      {
        id: 'doc_1',
        verificationId: 'verif_1',
        providerId: 'prv_1',
        documentCategory: 'IDENTITY_NATIONAL_ID',
        fileUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600',
        fileName: 'biometric_id_card_recto_verso.pdf',
        fileSizeBytes: 2450000,
        mimeType: 'application/pdf',
        status: 'pending',
        uploadedAt: '2026-08-22 10:10',
      },
      {
        id: 'doc_2',
        verificationId: 'verif_1',
        providerId: 'prv_1',
        documentCategory: 'ARTISAN_CARD',
        fileUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600',
        fileName: 'carte_artisan_chambre_metiers.pdf',
        fileSizeBytes: 1820000,
        mimeType: 'application/pdf',
        status: 'pending',
        uploadedAt: '2026-08-22 10:12',
      },
      {
        id: 'doc_3',
        verificationId: 'verif_1',
        providerId: 'prv_1',
        documentCategory: 'DIPLOMA_CERTIFICATE',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
        fileName: 'cap_plomberie_sanitaire.jpg',
        fileSizeBytes: 3100000,
        mimeType: 'image/jpeg',
        status: 'pending',
        uploadedAt: '2026-08-22 10:14',
      },
    ],
    history: [
      {
        id: 'h_1',
        verificationId: 'verif_1',
        actorId: 'usr_p1',
        actorName: 'Sofiane Hadj',
        actorRole: 'PROVIDER',
        action: 'PHONE_CONFIRMED',
        newStatus: 'PHONE_VERIFIED',
        notes: 'SMS OTP verified for phone +213 551 22 33 44',
        createdAt: '2026-08-22 09:45',
      },
      {
        id: 'h_2',
        verificationId: 'verif_1',
        actorId: 'usr_p1',
        actorName: 'Sofiane Hadj',
        actorRole: 'PROVIDER',
        action: 'PROFILE_SAVED',
        previousStatus: 'PHONE_VERIFIED',
        newStatus: 'PROFILE_COMPLETED',
        notes: 'Identity & business information completed',
        createdAt: '2026-08-22 10:00',
      },
      {
        id: 'h_3',
        verificationId: 'verif_1',
        actorId: 'usr_p1',
        actorName: 'Sofiane Hadj',
        actorRole: 'PROVIDER',
        action: 'SUBMITTED_FOR_REVIEW',
        previousStatus: 'DOCUMENTS_SUBMITTED',
        newStatus: 'UNDER_REVIEW',
        notes: 'Submitted 3 verification documents for official review',
        createdAt: '2026-08-22 10:15',
      },
    ],
    createdAt: '2026-08-22 09:40',
    updatedAt: '2026-08-22 10:15',
  },
  {
    id: 'verif_2',
    providerId: 'str_1',
    userId: 'usr_s1',
    providerName: 'Amina Mansouri (DzTech Electronics)',
    providerType: 'store',
    status: 'VERIFIED',
    phoneVerified: true,
    phoneNumber: '+213 550 11 22 33',
    email: 'amina.dztech@gmail.com',
    legalName: 'Amina Mansouri',
    nationalIdNumber: '119901602938491044',
    dateOfBirth: '1990-11-20',
    nationality: 'Algerian',
    businessTradeName: 'DzTech Electronics Store SARL',
    businessStructure: 'sarl_eurl',
    tradeRegistryNumber: '16/00-1194821B21',
    taxIdNumber: '002016029384999',
    wilaya: 'Algiers (16)',
    address: 'Centre Commercial Bab Ezzouar, Niveau 1',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    verifiedBadgeActive: true,
    reviewerId: 'adm_1',
    reviewerName: 'Admin Karim',
    reviewedAt: '2026-08-15 14:20',
    submittedAt: '2026-08-15 11:00',
    documents: [
      {
        id: 'doc_4',
        verificationId: 'verif_2',
        providerId: 'str_1',
        documentCategory: 'TRADE_REGISTER_RC',
        fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600',
        fileName: 'registre_commerce_cnrc.pdf',
        fileSizeBytes: 4200000,
        mimeType: 'application/pdf',
        status: 'approved',
        uploadedAt: '2026-08-15 11:00',
      },
      {
        id: 'doc_5',
        verificationId: 'verif_2',
        providerId: 'str_1',
        documentCategory: 'TAX_CARD_NIF',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
        fileName: 'carte_nif_nis_fiscal.pdf',
        fileSizeBytes: 1950000,
        mimeType: 'application/pdf',
        status: 'approved',
        uploadedAt: '2026-08-15 11:00',
      },
    ],
    history: [
      {
        id: 'h_4',
        verificationId: 'verif_2',
        actorId: 'adm_1',
        actorName: 'Admin Karim',
        actorRole: 'ADMIN',
        action: 'APPROVED',
        previousStatus: 'UNDER_REVIEW',
        newStatus: 'VERIFIED',
        notes: 'Commercial registry verified with CNRC database. Verified Badge issued.',
        createdAt: '2026-08-15 14:20',
      },
    ],
    createdAt: '2026-08-15 10:00',
    updatedAt: '2026-08-15 14:20',
  },
];

// ------------------------------------------------------------------------------------------------
// PROVIDER VERIFICATION SERVICE
// ------------------------------------------------------------------------------------------------

class ProviderVerificationService {
  private PROFILES_KEY = 'khidmatik_provider_verifications_v2';

  public getAllVerificationProfiles(): ProviderVerificationProfile[] {
    if (typeof window === 'undefined') return SEED_PROFILES;
    try {
      const saved = localStorage.getItem(this.PROFILES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return SEED_PROFILES;
  }

  public getVerificationProfile(providerId: string): ProviderVerificationProfile | null {
    const profiles = this.getAllVerificationProfiles();
    return profiles.find((p) => p.providerId === providerId || p.id === providerId) || null;
  }

  private saveProfiles(profiles: ProviderVerificationProfile[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * Provider completes Identity & Business details (Step 2)
   */
  public submitProfileInfo(
    input: SubmitVerificationProfileInput
  ): { success: boolean; profile?: ProviderVerificationProfile } {
    const profiles = this.getAllVerificationProfiles();
    let profile = profiles.find((p) => p.providerId === input.providerId);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (!profile) {
      profile = {
        id: `verif_${Date.now()}`,
        providerId: input.providerId,
        providerName: input.businessTradeName || input.legalName,
        providerType: input.artisanCardNumber ? 'artisan' : 'store',
        status: 'PROFILE_COMPLETED',
        phoneVerified: true,
        phoneNumber: '+213 555 00 00 00',
        email: 'provider@khidmatik.dz',
        legalName: input.legalName,
        nationalIdNumber: input.nationalIdNumber,
        dateOfBirth: input.dateOfBirth,
        nationality: input.nationality || 'Algerian',
        businessTradeName: input.businessTradeName,
        businessStructure: input.businessStructure,
        tradeRegistryNumber: input.tradeRegistryNumber,
        taxIdNumber: input.taxIdNumber,
        artisanCardNumber: input.artisanCardNumber,
        wilaya: input.wilaya,
        address: input.address,
        profilePhotoUrl: input.profilePhotoUrl,
        verifiedBadgeActive: false,
        documents: [],
        history: [
          {
            id: `h_${Date.now()}`,
            verificationId: `verif_${Date.now()}`,
            actorId: input.providerId,
            actorName: input.legalName,
            actorRole: 'PROVIDER',
            action: 'PROFILE_SAVED',
            newStatus: 'PROFILE_COMPLETED',
            notes: 'Initial KYC profile information saved',
            createdAt: nowStr,
          },
        ],
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      profiles.unshift(profile);
    } else {
      profile.legalName = input.legalName;
      profile.nationalIdNumber = input.nationalIdNumber || profile.nationalIdNumber;
      profile.dateOfBirth = input.dateOfBirth || profile.dateOfBirth;
      profile.nationality = input.nationality || profile.nationality;
      profile.businessTradeName = input.businessTradeName || profile.businessTradeName;
      profile.businessStructure = input.businessStructure || profile.businessStructure;
      profile.tradeRegistryNumber = input.tradeRegistryNumber || profile.tradeRegistryNumber;
      profile.taxIdNumber = input.taxIdNumber || profile.taxIdNumber;
      profile.artisanCardNumber = input.artisanCardNumber || profile.artisanCardNumber;
      profile.wilaya = input.wilaya || profile.wilaya;
      profile.address = input.address || profile.address;
      profile.profilePhotoUrl = input.profilePhotoUrl || profile.profilePhotoUrl;
      profile.updatedAt = nowStr;

      if (profile.status === 'REGISTERED' || profile.status === 'PHONE_VERIFIED') {
        profile.status = 'PROFILE_COMPLETED';
      }

      profile.history.push({
        id: `h_${Date.now()}`,
        verificationId: profile.id,
        actorId: input.providerId,
        actorName: input.legalName,
        actorRole: 'PROVIDER',
        action: 'PROFILE_SAVED',
        newStatus: profile.status,
        notes: 'Identity & business details updated',
        createdAt: nowStr,
      });
    }

    this.saveProfiles(profiles);
    return { success: true, profile };
  }

  /**
   * Upload Document & Attach to Provider KYC Dossier (Step 3)
   */
  public uploadVerificationDocument(
    input: UploadDocumentInput
  ): { success: boolean; document?: ProviderVerificationDocument; profile?: ProviderVerificationProfile } {
    const profiles = this.getAllVerificationProfiles();
    let profile = profiles.find((p) => p.providerId === input.providerId);
    if (!profile) return { success: false };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newDoc: ProviderVerificationDocument = {
      id: `doc_${Date.now()}`,
      verificationId: profile.id,
      providerId: profile.providerId,
      documentCategory: input.documentCategory,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes || 2500000,
      mimeType: input.mimeType || 'application/pdf',
      status: 'pending',
      uploadedAt: nowStr,
    };

    profile.documents.unshift(newDoc);
    if (profile.status === 'PROFILE_COMPLETED' || profile.status === 'ACTION_REQUIRED') {
      profile.status = 'DOCUMENTS_SUBMITTED';
    }
    profile.updatedAt = nowStr;

    profile.history.push({
      id: `h_${Date.now()}`,
      verificationId: profile.id,
      actorId: profile.providerId,
      actorName: profile.legalName,
      actorRole: 'PROVIDER',
      action: 'DOCUMENT_UPLOADED',
      newStatus: profile.status,
      notes: `Uploaded document: ${input.documentCategory} (${input.fileName})`,
      createdAt: nowStr,
    });

    this.saveProfiles(profiles);
    return { success: true, document: newDoc, profile };
  }

  /**
   * Provider Submits Application for Review (Step 4)
   */
  public submitApplicationForReview(
    providerId: string
  ): { success: boolean; profile?: ProviderVerificationProfile; error?: string } {
    const profiles = this.getAllVerificationProfiles();
    const profile = profiles.find((p) => p.providerId === providerId);
    if (!profile) return { success: false, error: 'Profile not found' };

    if (profile.documents.length === 0) {
      return { success: false, error: 'Please upload at least one identification or commercial document.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    profile.status = 'UNDER_REVIEW';
    profile.submittedAt = nowStr;
    profile.updatedAt = nowStr;

    profile.history.push({
      id: `h_${Date.now()}`,
      verificationId: profile.id,
      actorId: profile.providerId,
      actorName: profile.legalName,
      actorRole: 'PROVIDER',
      action: 'SUBMITTED_FOR_REVIEW',
      newStatus: 'UNDER_REVIEW',
      notes: `Application submitted with ${profile.documents.length} attached documents.`,
      createdAt: nowStr,
    });

    this.saveProfiles(profiles);

    // Send admin notification
    notificationService.sendNotification({
      userId: 'admin',
      type: 'verification_request',
      title: `🔔 طلب توثيق هوية جديد: ${profile.legalName}`,
      message: `قدم ${profile.businessTradeName || profile.providerName || profile.legalName} (${profile.providerType}) ملف توثيق الهوية والاعتماد المهني للمراجعة.`,
      data: {
        referenceId: profile.id,
        actionUrl: `/admin/dashboard?section=verification-queue`,
      },
      channel: 'all',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:kyc-updated', { detail: profile }));
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: profile }));
    }

    return { success: true, profile };
  }

  /**
   * Admin Review Decision (Approve, Reject, Request Docs, Suspend)
   */
  public adminReviewDecision(
    input: AdminReviewDecisionInput
  ): { success: boolean; profile?: ProviderVerificationProfile; error?: string } {
    const profiles = this.getAllVerificationProfiles();
    const profile = profiles.find((p) => p.id === input.verificationId || p.providerId === input.verificationId);
    if (!profile) return { success: false, error: 'Verification profile not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const previousStatus = profile.status;
    let newStatus: ProviderVerificationStatus = profile.status;

    profile.reviewerId = input.adminId;
    profile.reviewerName = input.adminName;
    profile.reviewedAt = nowStr;
    profile.updatedAt = nowStr;

    if (input.decision === 'APPROVE') {
      newStatus = 'VERIFIED';
      profile.status = 'VERIFIED';
      profile.verifiedBadgeActive = true;
      profile.rejectionReason = undefined;
      profile.actionRequiredNotes = undefined;

      // Mark all pending documents as approved
      profile.documents.forEach((d) => {
        if (d.status === 'pending') d.status = 'approved';
      });

      profile.history.push({
        id: `h_${Date.now()}`,
        verificationId: profile.id,
        actorId: input.adminId,
        actorName: input.adminName,
        actorRole: 'ADMIN',
        action: 'APPROVED',
        previousStatus,
        newStatus: 'VERIFIED',
        notes: `Verification approved. Verified Badge activated. ${input.mediatorNotes || ''}`,
        createdAt: nowStr,
      });

      // Send approved notification
      notificationService.sendNotification({
        userId: profile.providerId,
        type: 'verification_approved',
        title: 'Account Verification Approved! 🎖️',
        message: 'Your documents were approved. Verified Provider Badge is now active on your profile.',
        data: {
          referenceId: profile.id,
          status: 'VERIFIED',
          actionUrl: '/profile'
        }
      });
    } else if (input.decision === 'REJECT') {
      newStatus = 'REJECTED';
      profile.status = 'REJECTED';
      profile.verifiedBadgeActive = false;
      profile.rejectionReason = input.rejectionReason || 'Documents did not meet platform compliance requirements.';

      profile.history.push({
        id: `h_${Date.now()}`,
        verificationId: profile.id,
        actorId: input.adminId,
        actorName: input.adminName,
        actorRole: 'ADMIN',
        action: 'REJECTED',
        previousStatus,
        newStatus: 'REJECTED',
        notes: `Application rejected. Reason: ${profile.rejectionReason}`,
        createdAt: nowStr,
      });

      // Send rejection notification
      notificationService.sendNotification({
        userId: profile.providerId,
        type: 'verification_rejected',
        title: 'Verification Status Update',
        message: `Your verification application could not be approved: ${profile.rejectionReason}`,
        data: {
          referenceId: profile.id,
          status: 'REJECTED',
          reason: profile.rejectionReason,
          actionUrl: '/profile'
        }
      });
    } else if (input.decision === 'REQUEST_DOCUMENTS') {
      newStatus = 'ACTION_REQUIRED';
      profile.status = 'ACTION_REQUIRED';
      profile.actionRequiredNotes = input.actionRequiredNotes || 'Please upload updated identity and registration documents.';

      profile.history.push({
        id: `h_${Date.now()}`,
        verificationId: profile.id,
        actorId: input.adminId,
        actorName: input.adminName,
        actorRole: 'ADMIN',
        action: 'ACTION_REQUESTED',
        previousStatus,
        newStatus: 'ACTION_REQUIRED',
        notes: `Additional documents requested: ${profile.actionRequiredNotes}`,
        createdAt: nowStr,
      });
    } else if (input.decision === 'SUSPEND') {
      newStatus = 'SUSPENDED';
      profile.status = 'SUSPENDED';
      profile.verifiedBadgeActive = false;
      profile.rejectionReason = input.rejectionReason || 'Verification suspended due to compliance investigation.';

      profile.history.push({
        id: `h_${Date.now()}`,
        verificationId: profile.id,
        actorId: input.adminId,
        actorName: input.adminName,
        actorRole: 'ADMIN',
        action: 'SUSPENDED',
        previousStatus,
        newStatus: 'SUSPENDED',
        notes: `Verification suspended. Reason: ${profile.rejectionReason}`,
        createdAt: nowStr,
      });
    }

    this.saveProfiles(profiles);

    // Cross-sync with platform-wide Admin Providers registry
    try {
      const providers = adminDataService.getProviders();
      const targetProvider = providers.find(
        (p) => p.id === profile.providerId || p.ownerName.toLowerCase() === profile.legalName.toLowerCase()
      );
      if (targetProvider) {
        if (input.decision === 'APPROVE') {
          targetProvider.status = 'active';
          targetProvider.isVerified = true;
          targetProvider.identityDocumentStatus = 'verified';
        } else if (input.decision === 'REJECT') {
          targetProvider.isVerified = false;
          targetProvider.identityDocumentStatus = 'rejected';
        } else if (input.decision === 'SUSPEND') {
          targetProvider.status = 'suspended';
          targetProvider.isVerified = false;
        }
        adminDataService.saveProviders(providers);
        adminDataService.recordAudit(
          input.adminName,
          'UPDATE',
          'Provider',
          targetProvider.id,
          `KYC verification decision executed: ${input.decision} (Badge: ${targetProvider.isVerified})`
        );
      }
    } catch (err) {
      console.warn('Syncing with adminDataService failed:', err);
    }

    return { success: true, profile };
  }
}

export const providerVerificationService = new ProviderVerificationService();
