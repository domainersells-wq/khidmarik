
'use client';

import { useSearchParams } from 'next/navigation';
import { UserVerificationSection } from '@/components/admin/sections/UserVerificationSection';
import { ContentManagementSection } from '@/components/admin/sections/ContentManagementSection'; 
import { StoreManagementSection } from '@/components/admin/sections/StoreManagementSection';
import { ServiceProviderManagementSection } from '@/components/admin/sections/ServiceProviderManagementSection';
import { UserManagementSection } from '@/components/admin/sections/UserManagementSection';
import { FinancialOverviewSection } from '@/components/admin/sections/FinancialOverviewSection'; 
import { PlatformAnalyticsSection } from '@/components/admin/sections/PlatformAnalyticsSection';
import { PlatformCMSection } from '@/components/admin/sections/PlatformCMSection';
import { PlatformSettingsSection } from '@/components/admin/sections/PlatformSettingsSection';
import { PlatformSecuritySection } from '@/components/admin/sections/PlatformSecuritySection';
import { PlatformAdvancedToolsSection } from '@/components/admin/sections/PlatformAdvancedToolsSection';
import { PlatformSupportSection } from '@/components/admin/sections/PlatformSupportSection';
import { ReservationManagementSection } from '@/components/admin/sections/ReservationManagementSection';
import { PlatformOverviewSection } from '@/components/admin/sections/PlatformOverviewSection';

import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'overview'; 

  useEffect(() => {
    let title = 'Super Admin Dashboard';
    if (currentSection) {
        const sectionName = currentSection
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        title = `${sectionName} | Super Admin`;
    }
    document.title = `${title} | Khidmatik`;
  }, [currentSection]);

  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return <PlatformOverviewSection />;
      case 'verification-queue':
        return <UserVerificationSection />;
      case 'user-management':
        return <UserManagementSection />;
      case 'store-management':
        return <StoreManagementSection />;
      case 'reservation-management':
        return <ReservationManagementSection />;
      case 'provider-management':
        return <ServiceProviderManagementSection />;
      case 'financial-management': 
        return <FinancialOverviewSection />; 
      case 'platform-analytics':
        return <PlatformAnalyticsSection />;
      case 'content-moderation':
        return <ContentManagementSection />; 
      case 'cms-site-content':
        return <PlatformCMSection />;
      case 'system-configuration':
        return <PlatformSettingsSection />;
      case 'security-audit':
        return <PlatformSecuritySection />;
      case 'ai-advanced-tools':
        return <PlatformAdvancedToolsSection />;
      case 'support-system':
        return <PlatformSupportSection />;
      default:
        return <UserVerificationSection />;
    }
  };

  return <div className="py-4 space-y-6">{renderSection()}</div>;
}
