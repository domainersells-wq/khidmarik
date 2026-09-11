'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedComponent } from '@/components/auth/ProtectedComponent';
import { UnauthorizedState } from '@/components/auth/UnauthorizedState';

// Admin Sections
import { PlatformOverviewSection } from '@/components/admin/sections/PlatformOverviewSection';
import { PlatformAnalyticsSection } from '@/components/admin/sections/PlatformAnalyticsSection';
import { PlatformReportsSection } from '@/components/admin/sections/PlatformReportsSection';
import { AuditLogsSection } from '@/components/admin/sections/AuditLogsSection';
import { UserManagementSection } from '@/components/admin/sections/UserManagementSection';
import { ServiceProviderManagementSection } from '@/components/admin/sections/ServiceProviderManagementSection';
import { StoreManagementSection } from '@/components/admin/sections/StoreManagementSection';
import { UserVerificationSection } from '@/components/admin/sections/UserVerificationSection';
import { ProductManagementSection } from '@/components/admin/sections/ProductManagementSection';
import { ServiceManagementSection } from '@/components/admin/sections/ServiceManagementSection';
import { CategoryManagementSection } from '@/components/admin/sections/CategoryManagementSection';
import { LocationManagementSection } from '@/components/admin/sections/LocationManagementSection';
import { OrderManagementSection } from '@/components/admin/sections/OrderManagementSection';
import { ReservationManagementSection } from '@/components/admin/sections/ReservationManagementSection';
import { DisputeResolutionSection } from '@/components/admin/sections/DisputeResolutionSection';
import { ReviewModerationSection } from '@/components/admin/sections/ReviewModerationSection';
import { TopUpManagementSection } from '@/components/admin/sections/TopUpManagementSection';
import { PaymentManagementSection } from '@/components/admin/sections/PaymentManagementSection';
import { TransactionLedgerSection } from '@/components/admin/sections/TransactionLedgerSection';
import { CommissionManagementSection } from '@/components/admin/sections/CommissionManagementSection';
import { WithdrawalManagementSection } from '@/components/admin/sections/WithdrawalManagementSection';
import { RefundManagementSection } from '@/components/admin/sections/RefundManagementSection';
import { NotificationCenterSection } from '@/components/admin/sections/NotificationCenterSection';
import { MessagingCenterSection } from '@/components/admin/sections/MessagingCenterSection';
import { PlatformSupportSection } from '@/components/admin/sections/PlatformSupportSection';
import { PlatformSettingsSection } from '@/components/admin/sections/PlatformSettingsSection';
import { PlatformSecuritySection } from '@/components/admin/sections/PlatformSecuritySection';
import { PlatformCMSection } from '@/components/admin/sections/PlatformCMSection';
import { PlatformAdvancedToolsSection } from '@/components/admin/sections/PlatformAdvancedToolsSection';
import { AdminShippingDashboardSection } from '@/components/admin/sections/AdminShippingDashboardSection';
import { SubscriptionManagementSection } from '@/components/admin/sections/SubscriptionManagementSection';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'overview';

  useEffect(() => {
    let title = 'Admin Dashboard';
    if (currentSection) {
      const sectionName = currentSection
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      title = `${sectionName} | Admin Dashboard`;
    }
    document.title = `${title} | Khidmatik`;
  }, [currentSection]);

  const renderSection = () => {
    switch (currentSection) {
      // 1. Overview & Intelligence
      case 'overview':
        return <PlatformOverviewSection />;
      case 'platform-analytics':
      case 'analytics':
        return (
          <ProtectedComponent requiredPermission="view_analytics" fallback={<UnauthorizedState requiredPermission="view_analytics" />}>
            <PlatformAnalyticsSection />
          </ProtectedComponent>
        );
      case 'platform-reports':
      case 'reports':
        return (
          <ProtectedComponent requiredPermission="view_analytics" fallback={<UnauthorizedState requiredPermission="view_analytics" />}>
            <PlatformReportsSection />
          </ProtectedComponent>
        );
      case 'audit-logs':
        return (
          <ProtectedComponent requiredPermission="manage_all" fallback={<UnauthorizedState requiredPermission="manage_all (SUPER_ADMIN)" />}>
            <AuditLogsSection />
          </ProtectedComponent>
        );

      // 2. User & Entity Directory
      case 'user-management':
      case 'users':
        return (
          <ProtectedComponent requiredPermission="manage_users" fallback={<UnauthorizedState requiredPermission="manage_users" />}>
            <UserManagementSection />
          </ProtectedComponent>
        );
      case 'provider-management':
      case 'providers':
        return (
          <ProtectedComponent requiredPermission="manage_providers" fallback={<UnauthorizedState requiredPermission="manage_providers" />}>
            <ServiceProviderManagementSection />
          </ProtectedComponent>
        );
      case 'store-management':
      case 'stores':
        return (
          <ProtectedComponent requiredPermission="manage_stores" fallback={<UnauthorizedState requiredPermission="manage_stores" />}>
            <StoreManagementSection />
          </ProtectedComponent>
        );
      case 'verification-queue':
        return (
          <ProtectedComponent requiredPermission="manage_users" fallback={<UnauthorizedState requiredPermission="manage_users" />}>
            <UserVerificationSection />
          </ProtectedComponent>
        );

      // 3. Commerce & Catalog
      case 'product-management':
      case 'products':
        return (
          <ProtectedComponent requiredPermission="manage_products" fallback={<UnauthorizedState requiredPermission="manage_products" />}>
            <ProductManagementSection />
          </ProtectedComponent>
        );
      case 'service-management':
      case 'services':
        return (
          <ProtectedComponent requiredPermission="manage_providers" fallback={<UnauthorizedState requiredPermission="manage_providers" />}>
            <ServiceManagementSection />
          </ProtectedComponent>
        );
      case 'category-management':
      case 'categories':
        return (
          <ProtectedComponent requiredPermission="manage_content" fallback={<UnauthorizedState requiredPermission="manage_content" />}>
            <CategoryManagementSection />
          </ProtectedComponent>
        );
      case 'location-management':
      case 'locations':
        return (
          <ProtectedComponent requiredPermission="manage_settings" fallback={<UnauthorizedState requiredPermission="manage_settings" />}>
            <LocationManagementSection />
          </ProtectedComponent>
        );

      // 4. Operations & Orders
      case 'order-management':
      case 'orders':
        return (
          <ProtectedComponent requiredPermission="manage_orders" fallback={<UnauthorizedState requiredPermission="manage_orders" />}>
            <OrderManagementSection />
          </ProtectedComponent>
        );
      case 'shipping-management':
      case 'shipping':
      case 'shipments':
      case 'logistics':
        return (
          <ProtectedComponent requiredPermission="manage_orders" fallback={<UnauthorizedState requiredPermission="manage_orders" />}>
            <AdminShippingDashboardSection />
          </ProtectedComponent>
        );
      case 'reservation-management':
      case 'bookings':
        return (
          <ProtectedComponent requiredPermission="manage_bookings" fallback={<UnauthorizedState requiredPermission="manage_bookings" />}>
            <ReservationManagementSection />
          </ProtectedComponent>
        );
      case 'dispute-resolution':
      case 'disputes':
        return (
          <ProtectedComponent requiredPermission="manage_disputes" fallback={<UnauthorizedState requiredPermission="manage_disputes" />}>
            <DisputeResolutionSection />
          </ProtectedComponent>
        );
      case 'review-moderation':
      case 'reviews':
      case 'content-moderation':
        return (
          <ProtectedComponent requiredPermission="manage_reviews" fallback={<UnauthorizedState requiredPermission="manage_reviews" />}>
            <ReviewModerationSection />
          </ProtectedComponent>
        );

      // 5. Financial Hub
      case 'subscription-management':
      case 'subscriptions':
      case 'subscription-plans':
        return (
          <ProtectedComponent requiredPermission="manage_payments" fallback={<UnauthorizedState requiredPermission="manage_payments" />}>
            <SubscriptionManagementSection />
          </ProtectedComponent>
        );
      case 'topup-management':
      case 'topups':
      case 'topup-requests':
        return (
          <ProtectedComponent requiredPermission="manage_payments" fallback={<UnauthorizedState requiredPermission="manage_payments" />}>
            <TopUpManagementSection />
          </ProtectedComponent>
        );
      case 'payment-management':
      case 'payments':
      case 'financial-management':
        return (
          <ProtectedComponent requiredPermission="manage_payments" fallback={<UnauthorizedState requiredPermission="manage_payments" />}>
            <PaymentManagementSection />
          </ProtectedComponent>
        );
      case 'transaction-ledger':
      case 'transactions':
        return (
          <ProtectedComponent requiredPermission="manage_payments" fallback={<UnauthorizedState requiredPermission="manage_payments" />}>
            <TransactionLedgerSection />
          </ProtectedComponent>
        );
      case 'commission-management':
      case 'commissions':
        return (
          <ProtectedComponent requiredPermission="manage_payments" fallback={<UnauthorizedState requiredPermission="manage_payments" />}>
            <CommissionManagementSection />
          </ProtectedComponent>
        );
      case 'withdrawal-management':
      case 'withdrawals':
        return (
          <ProtectedComponent requiredPermission="manage_withdrawals" fallback={<UnauthorizedState requiredPermission="manage_withdrawals" />}>
            <WithdrawalManagementSection />
          </ProtectedComponent>
        );
      case 'refund-management':
      case 'refunds':
        return (
          <ProtectedComponent requiredPermission="manage_payments" fallback={<UnauthorizedState requiredPermission="manage_payments" />}>
            <RefundManagementSection />
          </ProtectedComponent>
        );

      // 6. Communication & Support
      case 'notification-center':
      case 'notifications':
        return (
          <ProtectedComponent requiredPermission="manage_content" fallback={<UnauthorizedState requiredPermission="manage_content" />}>
            <NotificationCenterSection />
          </ProtectedComponent>
        );
      case 'messaging-center':
      case 'messages':
        return (
          <ProtectedComponent requiredPermission="manage_disputes" fallback={<UnauthorizedState requiredPermission="manage_disputes" />}>
            <MessagingCenterSection />
          </ProtectedComponent>
        );
      case 'support-system':
        return (
          <ProtectedComponent requiredPermission="manage_disputes" fallback={<UnauthorizedState requiredPermission="manage_disputes" />}>
            <PlatformSupportSection />
          </ProtectedComponent>
        );

      // 7. System & Administration
      case 'system-configuration':
      case 'settings':
        return (
          <ProtectedComponent requiredPermission="manage_settings" fallback={<UnauthorizedState requiredPermission="manage_settings" />}>
            <PlatformSettingsSection />
          </ProtectedComponent>
        );
      case 'security-audit':
      case 'security':
        return (
          <ProtectedComponent requiredPermission="manage_all" fallback={<UnauthorizedState requiredPermission="manage_all (SUPER_ADMIN)" />}>
            <PlatformSecuritySection />
          </ProtectedComponent>
        );
      case 'cms-site-content':
        return (
          <ProtectedComponent requiredPermission="manage_content" fallback={<UnauthorizedState requiredPermission="manage_content" />}>
            <PlatformCMSection />
          </ProtectedComponent>
        );
      case 'ai-advanced-tools':
        return (
          <ProtectedComponent requiredPermission="manage_all" fallback={<UnauthorizedState requiredPermission="manage_all (SUPER_ADMIN)" />}>
            <PlatformAdvancedToolsSection />
          </ProtectedComponent>
        );

      default:
        return <PlatformOverviewSection />;
    }
  };

  return <div className="py-2 space-y-6">{renderSection()}</div>;
}
