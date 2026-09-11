import { NextRequest, NextResponse } from 'next/server';
import { shippingManagerService } from '@/services/shipping/ShippingManagerService';
import type { InternalShipmentStatus } from '@/types/shipping';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as InternalShipmentStatus | undefined;
    const provider_id = searchParams.get('provider_id') || undefined;
    const wilaya = searchParams.get('wilaya') || undefined;
    const search_query = searchParams.get('q') || undefined;

    const shipments = await shippingManagerService.getAllShipments({
      status: status || undefined,
      provider_id,
      wilaya,
      search_query,
    });

    const kpis = await shippingManagerService.getAdminKPIs();

    return NextResponse.json({ shipments, kpis });
  } catch (error: any) {
    console.error('Admin shipments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipments', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shipment = await shippingManagerService.createShipment(body);
    return NextResponse.json({ success: true, shipment });
  } catch (error: any) {
    console.error('Admin create shipment API error:', error);
    return NextResponse.json({ error: 'Failed to create shipment', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tracking_number, status, note, location, driver_name, driver_phone } = body;

    if (!tracking_number || !status) {
      return NextResponse.json({ error: 'tracking_number and status are required' }, { status: 400 });
    }

    const updated = await shippingManagerService.updateShipmentStatus({
      trackingNumber: tracking_number,
      newStatus: status as InternalShipmentStatus,
      description: note,
      location,
      driverName: driver_name,
      driverPhone: driver_phone,
      actorRole: 'ADMIN',
      actorName: 'Admin Operations',
    });

    return NextResponse.json({ success: true, shipment: updated });
  } catch (error: any) {
    console.error('Admin update shipment status error:', error);
    return NextResponse.json({ error: 'Failed to update shipment', details: error.message }, { status: 500 });
  }
}
