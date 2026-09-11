import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Reset Password | استعادة كلمة المرور',
  description: 'Reset your Khidmatik account password securely.',
  noIndex: true,
  canonicalUrl: '/forgot-password',
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
