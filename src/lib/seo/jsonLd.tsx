import React from 'react';
import { siteConfig } from '@/config/site';
import type { Store, Professional, ProductItem, FreelancerProfile } from '@/types';

export function JsonLd({ data }: { data: Record<string, any> | Array<Record<string, any>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

/**
 * Global Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    alternateName: [siteConfig.nameAr, siteConfig.nameFr],
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/images/logo.png`,
      caption: 'Khidmatik Logo',
    },
    description: siteConfig.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address.streetAddress,
      addressLocality: siteConfig.contact.address.addressLocality,
      addressRegion: siteConfig.contact.address.addressRegion,
      postalCode: siteConfig.contact.address.postalCode,
      addressCountry: siteConfig.contact.address.addressCountry,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteConfig.contact.phone,
      contactType: 'customer support',
      areaServed: 'DZ',
      availableLanguage: ['Arabic', 'French', 'English'],
    },
    sameAs: [
      siteConfig.links.facebook,
      siteConfig.links.instagram,
      siteConfig.links.twitter,
      siteConfig.links.linkedin,
    ],
  };
}

/**
 * Global WebSite schema with Sitelinks SearchBox
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      '@id': `${siteConfig.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['ar-DZ', 'fr-DZ', 'en-US'],
  };
}

/**
 * BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}

/**
 * Product schema (e-commerce & marketplace)
 */
export function generateProductSchema(
  product: ProductItem | { id: string; name: string; description?: string; price?: number; image?: string; isMadeInAlgeria?: boolean },
  seller?: { id: string; name: string; wilaya?: string }
) {
  const price = 'variants' in product && product.variants && product.variants.length > 0
    ? product.variants[0].price
    : ('price' in product && typeof product.price === 'number' ? product.price : 0);

  const imageUrl = 'baseImageUrl' in product && product.baseImageUrl
    ? product.baseImageUrl
    : ('image' in product && product.image ? product.image : `${siteConfig.url}/placeholder.svg`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [imageUrl.startsWith('http') ? imageUrl : `${siteConfig.url}${imageUrl}`],
    description: ('description' in product && product.description) || `${product.name} available on Khidmatik Algérie.`,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.isMadeInAlgeria ? 'Fabriqué en Algérie / صنع في الجزائر' : 'Khidmatik Marketplace',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}/marketplace`,
      priceCurrency: 'DZD',
      price: price > 0 ? price : 1000,
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: seller?.name || siteConfig.name,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      reviewCount: '18',
    },
  };
}

/**
 * LocalBusiness / Store / ProfessionalService schema
 */
export function generateLocalBusinessSchema(listing: Store | Professional | any) {
  const isStore = listing.type === 'store';
  const businessType = isStore
    ? (listing.category === 'Restaurants' ? 'Restaurant' : 'Store')
    : 'ProfessionalService';

  const avgRating = listing.averageRating || (listing.reviews && listing.reviews.length > 0
    ? listing.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / listing.reviews.length
    : 4.5);

  const reviewCount = listing.reviews ? listing.reviews.length : 5;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': businessType,
    '@id': `${siteConfig.url}/listings/${listing.id}`,
    name: listing.name,
    description: listing.description || `${listing.name} on Khidmatik Algérie`,
    url: `${siteConfig.url}/listings/${listing.id}`,
    image: listing.bannerImageUrl || (listing.images && listing.images[0]) || `${siteConfig.url}/images/og-default.png`,
    telephone: listing.contact?.phone || siteConfig.contact.phone,
    email: listing.contact?.email || siteConfig.contact.email,
    priceRange: listing.pricing || '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.location?.fullAddress || listing.location?.city || 'Algeria',
      addressLocality: listing.location?.city || 'Alger',
      addressRegion: listing.location?.wilayaCode || 'Alger',
      postalCode: listing.location?.zipCode || '16000',
      addressCountry: 'DZ',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Algeria',
    },
  };

  if (listing.operatingHours) {
    schema.openingHours = listing.operatingHours;
  }

  if (reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviewCount.toString(),
      bestRating: '5',
      worstRating: '1',
    };
  }

  // If store has products, add hasOfferCatalog
  if (isStore && listing.products && listing.products.length > 0) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: `${listing.name} Products`,
      itemListElement: listing.products.slice(0, 10).map((prod: ProductItem) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: prod.name,
          image: prod.baseImageUrl,
        },
        price: prod.variants?.[0]?.price || 0,
        priceCurrency: 'DZD',
      })),
    };
  }

  return schema;
}

/**
 * Service schema (Digital Services, Craftsmen, etc.)
 */
export function generateServiceSchema(
  service: { id: string; name: string; description?: string; category?: string; price?: number },
  provider?: { id: string; name: string; avatarUrl?: string; wilaya?: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${siteConfig.url}/digital-services/${service.id}`,
    name: service.name,
    serviceType: service.category || 'Professional Service',
    description: service.description || `${service.name} offered by verified professionals on Khidmatik.`,
    provider: {
      '@type': 'Person',
      name: provider?.name || 'Verified Khidmatik Professional',
      image: provider?.avatarUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Algeria',
    },
    offers: {
      '@type': 'Offer',
      price: service.price || 5000,
      priceCurrency: 'DZD',
      availability: 'https://schema.org/InStock',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
    },
  };
}

/**
 * Freelancer / Person schema
 */
export function generateFreelancerSchema(freelancer: FreelancerProfile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteConfig.url}/digital-services/${freelancer.id}`,
    name: freelancer.name,
    description: freelancer.description || `${freelancer.tagline || freelancer.name} on Khidmatik`,
    image: freelancer.images?.[0] || `${siteConfig.url}/images/og-default.png`,
    url: `${siteConfig.url}/digital-services/${freelancer.id}`,
    priceRange: freelancer.pricing || '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (freelancer.averageRating || 4.8).toFixed(1),
      reviewCount: (freelancer.reviews?.length || 5).toString(),
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: freelancer.location?.city || 'Alger',
      addressRegion: freelancer.location?.wilayaCode || 'Alger',
      addressCountry: 'DZ',
    },
  };
}

/**
 * EventVenue / Hall schema
 */
export function generateEventVenueSchema(hall: {
  id: string;
  name: string;
  description: string;
  location?: string;
  capacity?: number;
  price?: number;
  images?: string[];
  rating?: number;
  contact?: { phone?: string; email?: string };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    '@id': `${siteConfig.url}/halls/${hall.id}`,
    name: hall.name,
    description: hall.description,
    image: hall.images || [`${siteConfig.url}/placeholder.svg`],
    maximumAttendeeCapacity: hall.capacity || 300,
    priceRange: hall.price ? `${hall.price} DZD` : '$$$',
    telephone: hall.contact?.phone || siteConfig.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hall.location || 'Alger, Algérie',
      addressCountry: 'DZ',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (hall.rating || 4.8).toString(),
      reviewCount: '12',
    },
  };
}
