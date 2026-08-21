import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ProductReview } from '@/types';

// GET /api/store/reviews
export async function GET() {
  try {
    const { data, error } = await supabase.from('store_settings').select('*').eq('key', 'reviews_catalog').single();
    if (error && error.code !== 'PGRST116') throw error;

    const list: ProductReview[] = data ? data.value : [];
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/store/reviews
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviews } = body as { reviews: ProductReview[] };

    if (!reviews || !Array.isArray(reviews)) {
      return NextResponse.json({ success: false, error: 'Invalid reviews payload format.' }, { status: 400 });
    }

    const { error } = await supabase.from('store_settings').upsert({
      key: 'reviews_catalog',
      value: reviews,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Reviews catalog updated successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
