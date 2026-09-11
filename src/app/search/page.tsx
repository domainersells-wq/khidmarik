import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { SearchPageClient } from '@/components/search/SearchPageClient';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Unified Search - Discover Stores, Services & Parts | البحث الشامل',
  description:
    'Search across all verified local stores, emergency craftsmen, auto spare parts, digital services, and banquet halls in Algeria.',
  canonicalUrl: '/search',
  noIndex: true, // Prevents thin/dynamic search filter combinations from polluting index while allowing Google to follow links
});

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
