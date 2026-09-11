import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { categories, digitalServiceCategories, mockListings, partCategories } from '@/data/mock';
import { algerianWilayas } from '@/data/algerian-wilayas';
import { storeService } from '@/services/storeService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const now = new Date();

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/digital-services`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/parts-mine`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/banquet-halls`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/craftsmen-dispatch`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/store-express`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/service-point`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/app-roadmap`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Category Pages
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/listings?category=${encodeURIComponent(cat.slug)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 3. Digital Service Categories
  const digitalCategoryRoutes: MetadataRoute.Sitemap = digitalServiceCategories.map((cat) => ({
    url: `${baseUrl}/digital-services?category=${encodeURIComponent(cat.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 4. Part Categories
  const partCategoryRoutes: MetadataRoute.Sitemap = partCategories.map((cat) => ({
    url: `${baseUrl}/parts-mine?category=${encodeURIComponent(cat.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 5. Algerian Wilayas Location Hubs
  const locationRoutes: MetadataRoute.Sitemap = algerianWilayas.map((wilaya) => ({
    url: `${baseUrl}/listings?location=${encodeURIComponent(wilaya.code)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 6. Dynamic Stores & Service Providers (From DB or Fallback Mock)
  let dynamicListings: MetadataRoute.Sitemap = [];
  try {
    const dbStores = await storeService.getStores({ limit: 100 });
    const storesToMap = dbStores.length > 0 ? dbStores : mockListings;
    dynamicListings = storesToMap.map((item) => ({
      url: `${baseUrl}/listings/${item.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (error) {
    dynamicListings = mockListings.map((item) => ({
      url: `${baseUrl}/listings/${item.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  // 7. Dynamic Banquet Halls
  const hallIds = ['hall-1', 'hall-2'];
  const hallRoutes: MetadataRoute.Sitemap = hallIds.map((id) => ({
    url: `${baseUrl}/halls/${id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...digitalCategoryRoutes,
    ...partCategoryRoutes,
    ...locationRoutes,
    ...dynamicListings,
    ...hallRoutes,
  ];
}
