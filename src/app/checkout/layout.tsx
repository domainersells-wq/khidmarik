import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Secure Checkout | إتمام الطلب والدفع الآمن',
  description: 'Complete your order securely with Escrow buyer protection on Khidmatik.',
  noIndex: true,
  canonicalUrl: '/checkout',
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
