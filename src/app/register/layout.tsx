import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Register & Join Khidmatik | إنشاء حساب جديد',
  description: 'Join Khidmatik as a customer, store merchant, or verified service professional.',
  noIndex: true,
  canonicalUrl: '/register',
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
