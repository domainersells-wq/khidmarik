/**
 * SEO Service - Deterministic Core & Extensible Pipeline
 * 
 * ARCHITECTURE:
 * Database / Domain Data -> SeoService (Deterministic Engine) -> [Optional Enhancer Pipeline] -> Next.js Metadata
 * 
 * In current production:
 * - DeterministicSeoEnhancer is active (100% deterministic, zero AI, zero external network calls).
 * - All SEO titles, meta descriptions, and keywords are derived from source-of-truth database records.
 * - Future AI enhancers (e.g. LXDS / OpenAI) can be plugged in seamlessly via `setEnhancer()`.
 */

import type { Metadata } from 'next';
import { constructMetadata, type MetadataProps } from '../lib/seo/metadata';
import type { SeoContext, SeoOptimizationSuggestion } from '../types/ai';
import { categories, algerianWilayas } from '../data/mock';

export interface ISeoEnhancer {
  enhance(context: SeoContext, currentMetadata: MetadataProps): Promise<MetadataProps>;
}

/**
 * Default Deterministic Enhancer:
 * Always returns the deterministic metadata as-is.
 * Completely AI-free, zero runtime overhead.
 */
export class DeterministicSeoEnhancer implements ISeoEnhancer {
  async enhance(_context: SeoContext, currentMetadata: MetadataProps): Promise<MetadataProps> {
    return currentMetadata;
  }
}

export class SeoService {
  private enhancer: ISeoEnhancer;

  constructor(enhancer: ISeoEnhancer = new DeterministicSeoEnhancer()) {
    this.enhancer = enhancer;
  }

  /**
   * Allows setting a custom enhancer (e.g. for future optional AI optimization)
   */
  public setEnhancer(enhancer: ISeoEnhancer): void {
    this.enhancer = enhancer;
  }

  /**
   * Generates deterministic SEO metadata for a Store or Business Listing
   */
  public async getStoreMetadata(store: {
    id: string;
    name: string;
    category?: string;
    description?: string;
    city?: string;
    wilayaCode?: string;
    bannerImageUrl?: string;
    images?: string[];
    type?: 'store' | 'professional' | 'freelancer' | string;
  }): Promise<Metadata> {
    const isStore = store.type === 'store';
    const city = store.city || 'Algérie';
    const title = `${store.name} - ${store.category || 'Service'} à ${city}`;
    const description =
      store.description?.slice(0, 160) ||
      `${store.name} propose des services et produits de qualité en ${store.category || 'commerce'} à ${city}. Découvrez les avis, horaires et coordonnées sur Khidmatik.`;

    const image = store.bannerImageUrl || store.images?.[0] || '/images/og-default.png';

    const baseProps: MetadataProps = {
      title,
      description,
      image,
      canonicalUrl: `/listings/${store.id}`,
      type: 'profile',
      keywords: [
        store.name,
        store.category || '',
        city,
        store.wilayaCode || '',
        isStore ? 'boutique' : 'artisan professionnel',
        'Khidmatik Algérie',
      ].filter(Boolean),
    };

    const context: SeoContext = {
      entityType: 'store',
      entityId: store.id,
      name: store.name,
      category: store.category,
      city: store.city,
      wilayaCode: store.wilayaCode,
      currentDescription: store.description,
    };

    const finalProps = await this.enhancer.enhance(context, baseProps);
    return constructMetadata(finalProps);
  }

  /**
   * Generates deterministic SEO metadata for a Marketplace Product
   */
  public async getProductMetadata(product: {
    id: string;
    name: string;
    category?: string;
    description?: string;
    price?: number;
    storeName?: string;
    images?: string[];
  }): Promise<Metadata> {
    const title = `${product.name} ${product.storeName ? `| ${product.storeName}` : ''}`;
    const description =
      product.description?.slice(0, 160) ||
      `Achetez ${product.name} ${product.price ? `à ${product.price} DA` : ''} sur Khidmatik. Livraison rapide et paiement sécurisé partout en Algérie.`;

    const image = product.images?.[0] || '/images/og-default.png';

    const baseProps: MetadataProps = {
      title,
      description,
      image,
      canonicalUrl: `/marketplace?product=${product.id}`,
      type: 'website',
      keywords: [
        product.name,
        product.category || '',
        product.storeName || '',
        'achat en ligne Algérie',
        'Khidmatik Marketplace',
      ].filter(Boolean),
    };

    const context: SeoContext = {
      entityType: 'product',
      entityId: product.id,
      name: product.name,
      category: product.category,
      currentDescription: product.description,
    };

    const finalProps = await this.enhancer.enhance(context, baseProps);
    return constructMetadata(finalProps);
  }

  /**
   * Generates deterministic SEO metadata for Category Pages
   */
  public async getCategoryMetadata(categorySlug: string, wilayaCode?: string): Promise<Metadata> {
    const categoryObj = categories.find((c) => c.slug === categorySlug);
    const categoryName = categoryObj ? categoryObj.name : categorySlug;
    const wilayaObj = wilayaCode ? algerianWilayas.find((w) => w.code === wilayaCode) : null;
    const locationSuffix = wilayaObj ? ` en ${wilayaObj.name} (${wilayaObj.code})` : ' en Algérie';

    const title = `${categoryName}${locationSuffix} - Meilleurs Prestataires & Boutiques`;
    const description = `Trouvez et contactez les meilleurs professionnels et commerces en ${categoryName}${locationSuffix}. Avis vérifiés et réservation rapide sur Khidmatik.`;

    const baseProps: MetadataProps = {
      title,
      description,
      canonicalUrl: `/listings?category=${categorySlug}${wilayaCode ? `&location=${wilayaCode}` : ''}`,
      keywords: [
        categoryName,
        'artisans',
        'services',
        wilayaObj?.name || 'Algérie',
        'Khidmatik',
      ],
    };

    const context: SeoContext = {
      entityType: 'category',
      name: categoryName,
      category: categorySlug,
      wilayaCode,
    };

    const finalProps = await this.enhancer.enhance(context, baseProps);
    return constructMetadata(finalProps);
  }

  /**
   * Generates deterministic SEO metadata for Dynamic Search & Filter pages
   */
  public async getSearchMetadata(params: {
    q?: string;
    category?: string;
    location?: string;
    type?: string;
  }): Promise<Metadata> {
    const { q, category, location, type } = params;

    let title = 'Recherche de Commerces et Artisans';
    let description = 'Découvrez et réservez auprès des meilleurs commerces et professionnels qualifiés en Algérie.';

    if (type === 'store') {
      title = 'Boutiques et Commerces en Algérie';
      description = 'Explorez les boutiques locales, magasins et commerces vérifiés dans toutes les wilayas d’Algérie.';
    } else if (type === 'professional') {
      title = 'Artisans et Professionnels Qualifiés en Algérie';
      description = 'Prenez rendez-vous avec des plombiers, électriciens, mécaniciens et artisans certifiés.';
    }

    if (category) {
      const catObj = categories.find((c) => c.slug === category);
      if (catObj) {
        title = `${catObj.name} en Algérie`;
        description = `Trouvez les meilleurs services et boutiques en ${catObj.name} sur Khidmatik Algérie.`;
      }
    }

    if (q) {
      title = `Résultats pour "${q}"`;
      description = `Résultats de recherche pour "${q}" sur la plateforme Khidmatik Algérie.`;
    }

    if (location) {
      const wilayaObj = algerianWilayas.find((w) => w.code === location);
      const locName = wilayaObj ? wilayaObj.name : `Wilaya ${location}`;
      title = `${title} à ${locName}`;
      description = `${description} Services disponibles à ${locName}.`;
    }

    const baseProps: MetadataProps = {
      title,
      description,
      keywords: [q, category, location, 'Khidmatik Algérie'].filter(Boolean) as string[],
    };

    const context: SeoContext = {
      entityType: 'search',
      name: q || category || 'Recherche',
      category,
      wilayaCode: location,
    };

    const finalProps = await this.enhancer.enhance(context, baseProps);
    return constructMetadata(finalProps);
  }
}

export const seoService = new SeoService();
