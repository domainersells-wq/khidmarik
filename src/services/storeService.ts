import { supabase } from '@/lib/supabase';
import type { Store, Category, ProductItem, ProductVariant } from '@/types';

export const storeService = {
  /**
   * Fetch all categories
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error.message, error.details);
      return [];
    }

    // Map DB Category columns back to original TS fields if needed
    return data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon_name, // Will be resolved to a Lucide icon component dynamically in code
      type: cat.type,
    })) as unknown as Category[];
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      icon: data.icon_name,
      type: data.type,
    } as unknown as Category;
  },

  /**
   * Fetch stores with filters, search, sorting and pagination
   */
  async getStores(filters?: {
    categorySlug?: string;
    searchQuery?: string;
    wilayaCode?: string;
    pricing?: string[];
    type?: string;
    isMadeInAlgeria?: boolean;
    sort?: 'popularity' | 'rating' | 'newest';
    limit?: number;
    offset?: number;
  }): Promise<Store[]> {
    let query = supabase
      .from('stores')
      .select(`
        *,
        owner:profiles(name, avatar_url),
        reviews(id, rating, comment, date:created_at, author_name)
      `);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.categorySlug) {
      // Resolve category slug
      const category = await this.getCategoryBySlug(filters.categorySlug);
      if (category) {
        query = query.eq('category', category.name);
      }
    }

    if (filters?.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    if (filters?.wilayaCode) {
      query = query.eq('wilaya_code', filters.wilayaCode);
    }

    if (filters?.pricing && filters.pricing.length > 0) {
      query = query.in('pricing', filters.pricing);
    }

    if (filters?.isMadeInAlgeria) {
      query = query.eq('is_made_in_algeria', true);
    }

    if (filters?.sort === 'popularity') {
      query = query.order('popularity', { ascending: false });
    } else if (filters?.sort === 'rating') {
      query = query.order('average_rating', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (filters?.limit) {
      query = query.range(
        filters.offset || 0,
        (filters.offset || 0) + filters.limit - 1
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching stores:', error.message, error.details);
      return [];
    }

    // Map reviews averages
    return data.map((store: any) => {
      const avg = store.reviews.length > 0 
        ? store.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / store.reviews.length
        : 0;

      return {
        id: store.id,
        name: store.name,
        type: store.type,
        category: store.category,
        description: store.description,
        images: store.banner_image_url ? [store.banner_image_url] : [],
        bannerImageUrl: store.banner_image_url,
        storeLogoUrl: store.store_logo_url,
        isMadeInAlgeria: store.is_made_in_algeria,
        subscriptionPlan: store.subscription_plan,
        pricing: store.pricing,
        popularity: store.popularity,
        averageRating: parseFloat(avg.toFixed(1)),
        operatingHours: store.operating_hours,
        location: {
          city: store.city,
          fullAddress: store.full_address,
          zipCode: store.zip_code,
          wilayaCode: store.wilaya_code,
        },
        contact: {
          phone: store.phone,
          email: store.email,
          website: store.website,
        },
        reviews: store.reviews.map((r: any) => ({
          id: r.id,
          author: r.author_name,
          rating: r.rating,
          comment: r.comment,
          date: r.date || new Date().toISOString(),
        })),
        servicePrice: store.service_price ? parseFloat(store.service_price) : undefined,
        standardInstallationPrice: store.standard_installation_price ? parseFloat(store.standard_installation_price) : undefined,
        supportsAppointments: store.supports_appointments,
        appointmentConfig: store.appointment_config,
        qualifications: store.qualifications,
        servicesOffered: store.services_offered,
        tagline: store.tagline,
        skills: store.skills,
      } as any;
    });
  },

  /**
   * Fetch single store detail
   */
  async getStoreById(id: string): Promise<Store | null> {
    const { data: store, error } = await supabase
      .from('stores')
      .select(`
        *,
        reviews(id, rating, comment, date:created_at, author_name)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !store) return null;

    const avg = store.reviews.length > 0 
      ? store.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / store.reviews.length
      : 0;

    // Fetch store products
    const products = await this.getStoreProducts(store.id);

    return {
      id: store.id,
      name: store.name,
      type: store.type,
      category: store.category,
      description: store.description,
      images: store.banner_image_url ? [store.banner_image_url] : [],
      bannerImageUrl: store.banner_image_url,
      storeLogoUrl: store.store_logo_url,
      isMadeInAlgeria: store.is_made_in_algeria,
      subscriptionPlan: store.subscription_plan,
      pricing: store.pricing,
      popularity: store.popularity,
      averageRating: parseFloat(avg.toFixed(1)),
      operatingHours: store.operating_hours,
      location: {
        city: store.city,
        fullAddress: store.full_address,
        zipCode: store.zip_code,
        wilayaCode: store.wilaya_code,
      },
      contact: {
        phone: store.phone,
        email: store.email,
        website: store.website,
      },
      products,
      reviews: store.reviews.map((r: any) => ({
        id: r.id,
        author: r.author_name,
        rating: r.rating,
        comment: r.comment,
        date: r.date || new Date().toISOString(),
      })),
      servicePrice: store.service_price ? parseFloat(store.service_price) : undefined,
      standardInstallationPrice: store.standard_installation_price ? parseFloat(store.standard_installation_price) : undefined,
      supportsAppointments: store.supports_appointments,
      appointmentConfig: store.appointment_config,
      qualifications: store.qualifications,
      servicesOffered: store.services_offered,
      tagline: store.tagline,
      skills: store.skills,
    } as any;
  },

  /**
   * Fetch all products in a store
   */
  async getStoreProducts(storeId: string): Promise<ProductItem[]> {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*)
      `)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error fetching products:', error.message, error.details);
      return [];
    }

    return products.map((prod: any) => ({
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      description: prod.description,
      category: prod.category_id,
      baseImageUrl: prod.base_image_url,
      dataAiHint: prod.data_ai_hint,
      requiresInstallation: prod.requires_installation,
      installationServiceCategory: prod.installation_service_category,
      installationTaskName: prod.installation_task_name,
      isMadeInAlgeria: prod.is_made_in_algeria,
      expiryDate: prod.expiry_date,
      purchaseCost: parseFloat(prod.purchase_cost || 0),
      minStock: prod.min_stock || 5,
      maxStock: prod.max_stock || 100,
      trackStock: prod.track_stock !== false,
      trackSerialNumber: !!prod.track_serial_number,
      productType: prod.product_type || 'standard',
      digitalUrl: prod.digital_url,
      serviceDuration: prod.service_duration,
      galleryImages: prod.gallery_images,
      relatedProducts: prod.related_products,
      substituteProducts: prod.substitute_products,
      variants: prod.product_variants.map((v: any) => ({
        id: v.id,
        attributes: v.attributes,
        price: parseFloat(v.price),
        discountPrice: v.discount_price ? parseFloat(v.discount_price) : undefined,
        stock: v.stock,
        image: v.image,
        sku: v.sku,
        status: v.status,
        barcode: v.barcode || '',
      })),
    })) as any[];
  },

  /**
   * Create a new store record
   */
  async createStore(store: Omit<Store, 'id' | 'reviews' | 'averageRating' | 'type'> & { owner_id: string, type: 'store' | 'professional' | 'freelancer' }): Promise<any> {
    // Generate robust slug (works for Arabic, French accents, etc.)
    let baseSlug = store.name
      .toLowerCase()
      .trim()
      .replace(/[\s\+\/\?\&\#\.\,\:\;\"\'\(\)\[\]]+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u00C0-\u017F]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) {
      baseSlug = 'provider-' + Date.now().toString().slice(-6);
    }

    // Check if slug is unique in DB
    const { data: existingStores } = await supabase
      .from('stores')
      .select('slug')
      .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

    let finalSlug = baseSlug;
    if (existingStores && existingStores.length > 0) {
      const existingSlugs = existingStores.map((s: any) => s.slug);
      if (existingSlugs.includes(baseSlug)) {
        let suffix = 1;
        while (existingSlugs.includes(`${baseSlug}-${suffix}`)) {
          suffix++;
        }
        finalSlug = `${baseSlug}-${suffix}`;
      }
    }

    const { data, error } = await supabase
      .from('stores')
      .insert({
        owner_id: store.owner_id,
        name: store.name,
        type: store.type,
        slug: finalSlug,
        category: store.category,
        description: store.description,
        phone: store.contact.phone,
        email: store.contact.email,
        website: store.contact.website,
        city: store.location.city,
        full_address: store.location.fullAddress,
        zip_code: store.location.zipCode,
        wilaya_code: store.location.wilayaCode,
        banner_image_url: store.bannerImageUrl,
        store_logo_url: store.storeLogoUrl,
        is_made_in_algeria: store.isMadeInAlgeria,
        subscription_plan: store.subscriptionPlan || 'basic',
        operating_hours: store.operatingHours,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update store settings
   */
  async updateStore(id: string, updates: Partial<Store>): Promise<any> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.operatingHours) dbUpdates.operating_hours = updates.operatingHours;
    if (updates.bannerImageUrl) dbUpdates.banner_image_url = updates.bannerImageUrl;
    if (updates.storeLogoUrl) dbUpdates.store_logo_url = updates.storeLogoUrl;
    if (updates.contact) {
      if (updates.contact.phone) dbUpdates.phone = updates.contact.phone;
      if (updates.contact.email) dbUpdates.email = updates.contact.email;
      if (updates.contact.website) dbUpdates.website = updates.contact.website;
    }
    if (updates.location) {
      if (updates.location.city) dbUpdates.city = updates.location.city;
      if (updates.location.fullAddress) dbUpdates.full_address = updates.location.fullAddress;
      if (updates.location.zipCode) dbUpdates.zip_code = updates.location.zipCode;
      if (updates.location.wilayaCode) dbUpdates.wilaya_code = updates.location.wilayaCode;
    }

    const { data, error } = await supabase
      .from('stores')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Manage Products CRUD
   */
  async createProduct(storeId: string, product: Omit<ProductItem, 'id' | 'variants'> & any): Promise<any> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        store_id: storeId,
        name: product.name,
        slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: product.description,
        category_id: product.category,
        base_image_url: product.baseImageUrl,
        data_ai_hint: product.dataAiHint,
        requires_installation: product.requiresInstallation || false,
        installation_service_category: product.installationServiceCategory,
        installation_task_name: product.installationTaskName,
        is_made_in_algeria: product.isMadeInAlgeria || false,
        expiry_date: product.expiryDate || null,
        purchase_cost: product.purchaseCost || 0.00,
        min_stock: product.minStock || 5,
        max_stock: product.maxStock || 100,
        track_stock: product.trackStock !== false,
        track_serial_number: product.trackSerialNumber || false,
        product_type: product.productType || 'standard',
        digital_url: product.digitalUrl || null,
        service_duration: product.serviceDuration || null,
        gallery_images: product.galleryImages || null,
        related_products: product.relatedProducts || null,
        substitute_products: product.substituteProducts || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateProduct(productId: string, updates: Partial<ProductItem> & any): Promise<any> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.baseImageUrl) dbUpdates.base_image_url = updates.baseImageUrl;
    if (updates.requiresInstallation !== undefined) dbUpdates.requires_installation = updates.requiresInstallation;
    if (updates.installationServiceCategory) dbUpdates.installation_service_category = updates.installationServiceCategory;
    if (updates.installationTaskName) dbUpdates.installation_task_name = updates.installationTaskName;
    if (updates.isMadeInAlgeria !== undefined) dbUpdates.is_made_in_algeria = updates.isMadeInAlgeria;
    if (updates.expiryDate) dbUpdates.expiry_date = updates.expiryDate;
    if (updates.category) dbUpdates.category_id = updates.category;
    if (updates.purchaseCost !== undefined) dbUpdates.purchase_cost = updates.purchaseCost;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    if (updates.maxStock !== undefined) dbUpdates.max_stock = updates.maxStock;
    if (updates.trackStock !== undefined) dbUpdates.track_stock = updates.trackStock;
    if (updates.trackSerialNumber !== undefined) dbUpdates.track_serial_number = updates.trackSerialNumber;
    if (updates.productType) dbUpdates.product_type = updates.productType;
    if (updates.digitalUrl !== undefined) dbUpdates.digital_url = updates.digitalUrl;
    if (updates.serviceDuration !== undefined) dbUpdates.service_duration = updates.serviceDuration;
    if (updates.galleryImages !== undefined) dbUpdates.gallery_images = updates.galleryImages;
    if (updates.relatedProducts !== undefined) dbUpdates.related_products = updates.relatedProducts;
    if (updates.substituteProducts !== undefined) dbUpdates.substitute_products = updates.substituteProducts;

    const { data, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw new Error(error.message);
  },

  async createProductVariant(productId: string, variant: Omit<ProductVariant, 'id'>): Promise<any> {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        attributes: variant.attributes,
        price: variant.price,
        discount_price: variant.discountPrice,
        stock: variant.stock,
        image: variant.image,
        sku: variant.sku,
        status: variant.status || 'available',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async createProductVariants(productId: string, variants: Omit<ProductVariant, 'id'>[]): Promise<any> {
    const payloads = variants.map(variant => ({
      product_id: productId,
      attributes: variant.attributes,
      price: variant.price,
      discount_price: variant.discountPrice,
      stock: variant.stock,
      image: variant.image,
      sku: variant.sku,
      status: variant.status || 'available',
    }));
    const { data, error } = await supabase
      .from('product_variants')
      .insert(payloads)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }
};
