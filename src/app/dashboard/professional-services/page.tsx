
'use client';

import { useSearchParams } from 'next/navigation';
// import { ProfessionalLifecycleSection } from '@/components/dashboard/professional-services/ProfessionalLifecycleSection'; // To be replaced/merged
// import { ServiceListingOversightSection } from '@/components/dashboard/professional-services/ServiceListingOversightSection'; // To be replaced/merged
// import { PlatformEngagementSection } from '@/components/dashboard/professional-services/PlatformEngagementSection'; // To be refocused or replaced by provider-specific analytics
import { SupportResolutionSection } from '@/components/dashboard/professional-services/SupportResolutionSection';
import { DynamicProfileModulesSection } from '@/components/dashboard/professional-services/DynamicProfileModulesSection';

// New Sections
import { ProviderVerificationSection } from '@/components/dashboard/professional-services/ProviderVerificationSection';
import { ProviderServiceManagementSection } from '@/components/dashboard/professional-services/ProviderServiceManagementSection';
import { ProviderBookingsCalendarSection } from '@/components/dashboard/professional-services/ProviderBookingsCalendarSection';
import { ProviderProjectManagementSection } from '@/components/dashboard/professional-services/ProviderProjectManagementSection';
import { ProviderMarketingSection } from '@/components/dashboard/professional-services/ProviderMarketingSection';
import { ProviderEarningsSection } from '@/components/dashboard/professional-services/ProviderEarningsSection';
import { ProviderCommunicationSection } from '@/components/dashboard/professional-services/ProviderCommunicationSection';
import { ProviderAnalyticsSection } from '@/components/dashboard/professional-services/ProviderAnalyticsSection';
import { ProviderSettingsSection } from '@/components/dashboard/professional-services/ProviderSettingsSection';
import { ClientsManagementSection } from '@/components/dashboard/professional-services/ClientsManagementSection'; // New
import { ProviderSubscriptionSection } from '@/components/dashboard/professional-services/ProviderSubscriptionSection';
import { CraftsmenDispatchContainer } from '@/components/craftsmen/CraftsmenDispatchContainer';

import { useEffect } from 'react';

export default function ProfessionalServicesDashboardPage() {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'profile-modules'; // Default to new profile modules

  useEffect(() => {
    let title = 'Services Admin Dashboard';
    if (currentSection) {
        const sectionName = currentSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        title = `${sectionName} | Services Admin Dashboard`;
    }
    document.title = `${title} | Khidmatik`;
  }, [currentSection]);

  const renderSection = () => {
    switch (currentSection) {
      case 'profile-modules':
        return <DynamicProfileModulesSection />;
      case 'sos-dispatch':
        return <CraftsmenDispatchContainer />;
      case 'subscription':
        return <ProviderSubscriptionSection />;
      case 'verification':
        return <ProviderVerificationSection />;
      case 'service-management':
        return <ProviderServiceManagementSection />;
      case 'bookings-calendar':
        return <ProviderBookingsCalendarSection />;
      case 'project-management':
        return <ProviderProjectManagementSection />;
      case 'marketing-promotions':
        return <ProviderMarketingSection />;
      case 'earnings-payouts':
        return <ProviderEarningsSection />;
      case 'client-communication':
        return <ProviderCommunicationSection />;
      case 'clients': // New
        return <ClientsManagementSection />;
      case 'analytics':
        return <ProviderAnalyticsSection />;
      case 'settings-integrations':
        return <ProviderSettingsSection />;
      case 'support':
        return <SupportResolutionSection />; // Existing, will be enhanced for provider perspective
      // Old sections (lifecycle, oversight, engagement) are being replaced or their functionality merged.
      // If you need to access them temporarily during transition, you can uncomment their routes.
      default:
        return <DynamicProfileModulesSection />;
    }
  };

  return <div className="py-4 space-y-6">{renderSection()}</div>;
}
