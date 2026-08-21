import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to estimate size from base64
function getBase64Size(base64String: string): number {
  const padding = (base64String.endsWith('==') ? 2 : (base64String.endsWith('=') ? 1 : 0));
  const base64Length = base64String.length - (base64String.indexOf(',') + 1);
  return (base64Length * 3) / 4 - padding;
}

// POST /api/store/upload
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64Data, filename, mimeType } = body as { base64Data: string; filename: string; mimeType: string };

    if (!base64Data || !filename || !mimeType) {
      return NextResponse.json({ success: false, error: 'Upload details are missing or incomplete.' }, { status: 400 });
    }

    // 1. Validate File Size
    const fileSize = getBase64Size(base64Data);
    const maxPhotoSize = 5 * 1024 * 1024; // 5MB
    const maxFileSize = 20 * 1024 * 1024; // 20MB

    const isImage = mimeType.startsWith('image/');
    const sizeLimit = isImage ? maxPhotoSize : maxFileSize;

    if (fileSize > sizeLimit) {
      return NextResponse.json({ success: false, error: `File size exceeds the permitted limit of ${isImage ? '5MB' : '20MB'}.` }, { status: 400 });
    }

    // 2. Validate Extensions/MimeTypes
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'application/zip', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4'
    ];

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json({ success: false, error: 'File format not supported. Permitted: JPEG, PNG, WEBP, GIF, PDF, ZIP, CSV, XLSX, MP4.' }, { status: 400 });
    }

    // Mock storage write for local dev, generating public URL
    const publicUrl = `https://storage.khidmatik.dz/media/${Date.now()}_${filename}`;

    const metadata = {
      filename: `${Date.now()}_${filename}`,
      originalName: filename,
      mimeType,
      size: fileSize,
      publicUrl,
      createdDate: new Date().toISOString()
    };

    // Log the file details inside media_catalog in store_settings
    const { data: currentData } = await supabase.from('store_settings').select('*').eq('key', 'media_catalog').single();
    const list = currentData ? currentData.value : [];
    const updated = [metadata, ...list];

    await supabase.from('store_settings').upsert({
      key: 'media_catalog',
      value: updated,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'File successfully uploaded and cataloged.',
      data: metadata
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
