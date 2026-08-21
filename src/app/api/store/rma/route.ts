import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { RMARequest } from '@/types';

// GET /api/store/rma
export async function GET() {
  try {
    const { data, error } = await supabase.from('store_settings').select('*').eq('key', 'rma_catalog').single();
    if (error && error.code !== 'PGRST116') throw error;

    const list: RMARequest[] = data ? data.value : [];
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/store/rma
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rmas } = body as { rmas: RMARequest[] };

    if (!rmas || !Array.isArray(rmas)) {
      return NextResponse.json({ success: false, error: 'Invalid RMA payload format.' }, { status: 400 });
    }

    const { error } = await supabase.from('store_settings').upsert({
      key: 'rma_catalog',
      value: rmas,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'RMA catalog updated successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
