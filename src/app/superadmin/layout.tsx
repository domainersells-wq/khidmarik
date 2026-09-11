import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Super Admin Secret Portal | Khidmatik',
  description: 'Khidmatik Platform Confidential Super Admin Gateway.',
  noIndex: true,
});

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
