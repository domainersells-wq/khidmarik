import { NextRequest, NextResponse } from 'next/server';
import { privateDeliveryCodeService } from '@/services/privateDeliveryCodeService';

/**
 * GET & PUT /api/v1/admin/settings/delivery
 * Manage platform delivery verification, code length, and inspection timer settings
 */
export async function GET() {
  try {
    const settings = privateDeliveryCodeService.getPlatformDeliverySettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[API /admin/settings/delivery GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch delivery settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = privateDeliveryCodeService.updatePlatformDeliverySettings(body);
    return NextResponse.json({
      success: true,
      message: 'Platform delivery settings updated successfully',
      settings: updated,
    });
  } catch (error: any) {
    console.error('[API /admin/settings/delivery PUT Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update delivery settings' },
      { status: 500 }
    );
  }
}
