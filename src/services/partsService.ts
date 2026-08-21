import { supabase } from '@/lib/supabase';
import type { ListedPart, PartRequest } from '@/types';

export const partsService = {
  /**
   * Fetch all listed spare parts
   */
  async getListedParts(filters?: {
    categorySlug?: string;
    searchQuery?: string;
    condition?: string;
    wilayaCode?: string;
    isSold?: boolean;
  }): Promise<ListedPart[]> {
    let query = supabase
      .from('listed_parts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.isSold !== undefined) {
      query = query.eq('is_sold', filters.isSold);
    } else {
      query = query.eq('is_sold', false);
    }

    if (filters?.categorySlug) {
      query = query.eq('category_slug', filters.categorySlug);
    }

    if (filters?.searchQuery) {
      query = query.or(`part_name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,original_device_name.ilike.%${filters.searchQuery}%`);
    }

    if (filters?.condition) {
      query = query.eq('condition', filters.condition);
    }

    if (filters?.wilayaCode) {
      query = query.eq('wilaya_code', filters.wilayaCode);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching listed parts:', error);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      partName: d.part_name,
      originalDeviceName: d.original_device_name,
      description: d.description || '',
      categorySlug: d.category_slug,
      price: parseFloat(d.price),
      condition: d.condition,
      imageUrls: d.image_urls || [],
      location: {
        city: d.city,
        wilayaCode: d.wilaya_code,
      },
      createdAt: d.created_at,
      isSold: d.is_sold,
    })) as ListedPart[];
  },

  /**
   * List a new spare part
   */
  async listPart(part: Omit<ListedPart, 'id' | 'createdAt' | 'isSold'>): Promise<any> {
    const { data, error } = await supabase
      .from('listed_parts')
      .insert({
        user_id: part.userId,
        part_name: part.partName,
        original_device_name: part.originalDeviceName,
        description: part.description,
        category_slug: part.categorySlug,
        price: part.price,
        condition: part.condition,
        image_urls: part.imageUrls,
        city: part.location?.city || '',
        wilaya_code: part.location?.wilayaCode || '',
        is_sold: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Fetch all spare part requests
   */
  async getPartRequests(filters?: {
    categorySlug?: string;
    searchQuery?: string;
    status?: 'active' | 'fulfilled' | 'cancelled';
  }): Promise<PartRequest[]> {
    let query = supabase
      .from('part_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'active');
    }

    if (filters?.categorySlug) {
      query = query.eq('category_slug', filters.categorySlug);
    }

    if (filters?.searchQuery) {
      query = query.or(`part_name.ilike.%${filters.searchQuery}%,part_description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching part requests:', error);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      partName: d.part_name,
      partDescription: d.part_description || '',
      categorySlug: d.category_slug,
      deviceModel: d.device_model || '',
      status: d.status,
      urgency: d.urgency,
      imageUrls: d.image_urls || [],
      createdAt: d.created_at,
    })) as PartRequest[];
  },

  /**
   * Submit a new part request
   */
  async requestPart(request: Omit<PartRequest, 'id' | 'createdAt' | 'status'>): Promise<any> {
    const { data, error } = await supabase
      .from('part_requests')
      .insert({
        user_id: request.userId,
        part_name: request.partName,
        part_description: request.partDescription,
        category_slug: request.categorySlug,
        device_model: request.deviceModel,
        status: 'active',
        urgency: request.urgency,
        image_urls: request.imageUrls,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update listed part status (mark sold / delete)
   */
  async updatePartSoldStatus(id: string, isSold: boolean): Promise<void> {
    const { error } = await supabase
      .from('listed_parts')
      .update({ is_sold: isSold })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};
