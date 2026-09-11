import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/services/analyticsService';
import { AnalyticsTimeRange } from '@/types/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || '30d') as AnalyticsTimeRange;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await analyticsService.getProviderAnalytics(providerId, {
      range,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch provider analytics' }, { status: 500 });
  }
}
