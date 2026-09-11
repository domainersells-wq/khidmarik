import { NextRequest, NextResponse } from 'next/server';
import { providerVerificationService } from '@/services/providerVerificationService';

/**
 * GET /api/v1/provider/verification/profile
 * Get verification profile, documents, and badge status for a provider
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId') || 'prv_1';

    const profile = providerVerificationService.getVerificationProfile(providerId);

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Verification profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('[API /provider/verification/profile Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch verification profile' },
      { status: 500 }
    );
  }
}
