import { NextResponse } from 'next/server';
import { HealthService } from '@/infrastructure/health/healthService';

export async function GET() {
  const report = await HealthService.getLiveness();
  return NextResponse.json(report, { status: 200 });
}
