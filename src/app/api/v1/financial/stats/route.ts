import { NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

/**
 * GET /api/v1/financial/stats
 * Return overall platform financial metrics
 */
export async function GET() {
  try {
    const stats = financialService.getPlatformFinancialStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
