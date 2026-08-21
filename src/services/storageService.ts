import { supabase } from '@/lib/supabase';

export const storageService = {
  /**
   * Upload a file to a specific storage bucket
   */
  async uploadFile(
    bucket: 'avatars' | 'logos' | 'products' | 'documents' | 'parts',
    filePath: string,
    fileObj: File
  ): Promise<{ publicUrl: string; path: string }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileObj, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      publicUrl: urlData.publicUrl,
      path: data.path,
    };
  },

  /**
   * Delete a file from a bucket
   */
  async deleteFile(
    bucket: 'avatars' | 'logos' | 'products' | 'documents' | 'parts',
    filePath: string
  ): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw new Error(error.message);
  },

  /**
   * Generate a signed URL for private assets (e.g. secure invoices, proof documents)
   */
  async getSignedUrl(
    bucket: 'documents',
    filePath: string,
    expiresInSeconds: number = 60
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) throw new Error(error.message);
    return data.signedUrl;
  }
};
