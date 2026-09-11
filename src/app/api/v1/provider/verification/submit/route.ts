import { NextRequest, NextResponse } from 'next/server';
import { providerVerificationService } from '@/services/providerVerificationService';

/**
 * POST /api/v1/provider/verification/submit
 * Handles profile update, document upload, or application submission for review
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'submit_profile';

    if (action === 'submit_profile') {
      const res = providerVerificationService.submitProfileInfo(body.profile);
      return NextResponse.json({ success: true, profile: res.profile });
    } else if (action === 'upload_document') {
      const res = providerVerificationService.uploadVerificationDocument(body.document);
      return NextResponse.json({ success: true, document: res.document, profile: res.profile });
    } else if (action === 'submit_for_review') {
      const res = providerVerificationService.submitApplicationForReview(body.providerId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 422 });
      }
      return NextResponse.json({ success: true, message: 'Application submitted for review', profile: res.profile });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API /provider/verification/submit Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process verification request' },
      { status: 500 }
    );
  }
}
