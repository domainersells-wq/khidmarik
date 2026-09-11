import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';

/**
 * GET /api/v1/customer/orders
 * List customer orders with status tabs and search filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = (searchParams.get('tab') as any) || 'all';
    const search = searchParams.get('search') || undefined;
    const customerId = searchParams.get('customerId') || undefined;

    const orders = await customerOrderService.getCustomerOrders({
      customerId,
      tab,
      search,
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error('[API /api/v1/customer/orders GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}
