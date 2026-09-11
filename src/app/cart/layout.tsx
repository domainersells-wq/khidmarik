import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Shopping Cart | سلة المشتريات',
  description: 'View and manage items in your Khidmatik shopping cart.',
  noIndex: true,
  canonicalUrl: '/cart',
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
