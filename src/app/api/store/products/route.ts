import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ProductItem } from '@/types';

// GET /api/store/products
export async function GET() {
  try {
    const { data, error } = await supabase.from('store_settings').select('*').eq('key', 'products_catalog').single();
    if (error && error.code !== 'PGRST116') throw error;

    const catalog: ProductItem[] = data ? data.value : [];
    return NextResponse.json({ success: true, data: catalog });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/store/products
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product, catalog } = body as { product?: ProductItem; catalog?: ProductItem[] };

    if (catalog && Array.isArray(catalog)) {
      const { error } = await supabase.from('store_settings').upsert({
        key: 'products_catalog',
        value: catalog,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Products catalog bulk updated.' });
    }

    if (!product || !product.name) {
      return NextResponse.json({ success: false, error: 'Product details are missing or incomplete.' }, { status: 400 });
    }

    // Load current catalog
    const { data } = await supabase.from('store_settings').select('*').eq('key', 'products_catalog').single();
    let currentCatalog: ProductItem[] = data ? data.value : [];

    // Validation: Slug or Name uniqueness check
    if (currentCatalog.find(p => p.name.toLowerCase() === product.name.toLowerCase() && p.id !== product.id)) {
      return NextResponse.json({ success: false, error: 'A product with this name already exists in your catalog.' }, { status: 400 });
    }

    // Append/Edit in catalog list
    const exists = currentCatalog.find(p => p.id === product.id);
    let updatedCatalog: ProductItem[];
    if (exists) {
      updatedCatalog = currentCatalog.map(p => p.id === product.id ? product : p);
    } else {
      updatedCatalog = [product, ...currentCatalog];
    }

    // Save back to Supabase
    const { error } = await supabase.from('store_settings').upsert({
      key: 'products_catalog',
      value: updatedCatalog,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Product catalog updated successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
