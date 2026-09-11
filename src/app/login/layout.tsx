import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Log In | تسجيل الدخول',
  description: 'Log in to your Khidmatik account.',
  noIndex: true,
  canonicalUrl: '/login',
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
