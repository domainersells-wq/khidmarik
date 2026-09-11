import { NextResponse } from 'next/server';
import { HealthService } from '@/infrastructure/health/healthService';

export async function GET() {
  const report = await HealthService.getReadiness();
  const statusCode = report.status === 'unhealthy' ? 503 : 200;
  return NextResponse.json(report, { status: statusCode });
}
