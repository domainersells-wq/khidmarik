import { NextRequest, NextResponse } from 'next/server';
import { rejectionCostAllocationService } from '@/services/rejectionCostAllocationService';

/**
 * GET /api/v1/admin/rejections/rules
 * List all configurable platform rejection financial rules
 */
export async function GET() {
  try {
    const rules = rejectionCostAllocationService.getFinancialRules();
    return NextResponse.json({
      success: true,
      count: rules.length,
      rules,
    });
  } catch (error: any) {
    console.error('[API /admin/rejections/rules Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch financial rules' },
      { status: 500 }
    );
  }
}
