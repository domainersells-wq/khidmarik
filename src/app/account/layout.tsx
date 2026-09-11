import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'My Account & Orders | حسابي وطلباتي',
  description: 'Manage your Khidmatik account, tracked orders, and receipts.',
  noIndex: true,
});

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
