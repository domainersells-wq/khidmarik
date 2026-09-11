import { NextRequest, NextResponse } from 'next/server';
import { rejectionCostAllocationService } from '@/services/rejectionCostAllocationService';

/**
 * GET /api/v1/seller/protection
 * Return seller's subscription protection quota usage, limits, and protected claims history
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId') || 'str_1';
    const planId = searchParams.get('planId') || 'pro';

    const stats = rejectionCostAllocationService.getSellerProtectionUsage(sellerId, planId);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[API /seller/protection Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch seller protection stats' },
      { status: 500 }
    );
  }
}
