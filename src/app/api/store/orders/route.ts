import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { OrderItem } from '@/types';

// GET /api/store/orders
export async function GET() {
  try {
    const { data, error } = await supabase.from('store_settings').select('*').eq('key', 'orders_catalog').single();
    if (error && error.code !== 'PGRST116') throw error;

    const list: OrderItem[] = data ? data.value : [];
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/store/orders
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orders } = body as { orders: OrderItem[] };

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ success: false, error: 'Invalid orders payload format.' }, { status: 400 });
    }

    const { error } = await supabase.from('store_settings').upsert({
      key: 'orders_catalog',
      value: orders,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Orders catalog updated successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
