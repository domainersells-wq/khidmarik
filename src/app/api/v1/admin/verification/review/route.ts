import { NextRequest, NextResponse } from 'next/server';
import { providerVerificationService } from '@/services/providerVerificationService';

/**
 * POST /api/v1/admin/verification/review
 * Admin reviews provider KYC application (Approve, Reject, Request Docs, Suspend)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.verificationId || !body.decision) {
      return NextResponse.json(
        { success: false, error: 'Verification ID and decision are required.' },
        { status: 400 }
      );
    }

    const res = providerVerificationService.adminReviewDecision({
      verificationId: body.verificationId,
      adminId: body.adminId || 'adm_1',
      adminName: body.adminName || 'Senior Compliance Officer',
      decision: body.decision,
      rejectionReason: body.rejectionReason,
      actionRequiredNotes: body.actionRequiredNotes,
      mediatorNotes: body.mediatorNotes,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification decision executed: ${body.decision}`,
      profile: res.profile,
    });
  } catch (error: any) {
    console.error('[API /admin/verification/review Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to review verification application' },
      { status: 500 }
    );
  }
}
