import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export interface MetadataProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  authors?: string[];
  keywords?: string[];
}

export function constructMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  canonicalUrl,
  noIndex = false,
  type = 'website',
  publishedTime,
  authors,
  keywords,
}: MetadataProps = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name} - ${siteConfig.tagline}`;

  const cleanCanonical = canonicalUrl
    ? canonicalUrl.startsWith('http')
      ? canonicalUrl
      : `${siteConfig.url}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`
    : undefined;

  const resolvedImage = image.startsWith('http')
    ? image
    : `${siteConfig.url}${image.startsWith('/') ? '' : '/'}${image}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords || siteConfig.keywords,
    metadataBase: new URL(siteConfig.url),
    ...(cleanCanonical && {
      alternates: {
        canonical: cleanCanonical,
        languages: {
          'ar-DZ': cleanCanonical,
          'fr-DZ': cleanCanonical,
          'en-US': cleanCanonical,
        },
      },
    }),
    openGraph: {
      title: fullTitle,
      description,
      type,
      url: cleanCanonical || siteConfig.url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      alternateLocale: siteConfig.alternateLocales,
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(authors && { authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [resolvedImage],
      creator: '@khidmatik_dz',
      site: '@khidmatik_dz',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
