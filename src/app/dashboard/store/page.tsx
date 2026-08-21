
'use client';

import { useSearchParams } from 'next/navigation';
import { OverviewSection } from '@/components/dashboard/store/OverviewSection';
import { OrdersSection } from '@/components/dashboard/store/OrdersSection';
import { ProductsSection } from '@/components/dashboard/store/ProductsSection';
import { CustomersSection } from '@/components/dashboard/store/CustomersSection';
import { MarketingSection } from '@/components/dashboard/store/MarketingSection';
import { AnalyticsSection } from '@/components/dashboard/store/AnalyticsSection';
import { SettingsSection } from '@/components/dashboard/store/SettingsSection';
import { FinancialsSection } from '@/components/dashboard/store/FinancialsSection'; // New
import { AISellerAssistantSection } from '@/components/dashboard/store/AISellerAssistantSection'; // New
import { ShipmentsSection } from '@/components/dashboard/store/ShipmentsSection'; // New

// New Sections
import { ScheduledOrdersSection } from '@/components/dashboard/store/ScheduledOrdersSection';
import { NewOrderSection } from '@/components/dashboard/store/NewOrderSection';
import { FailureManagementSection } from '@/components/dashboard/store/FailureManagementSection';
import { StockInventorySection } from '@/components/dashboard/store/StockInventorySection';
import { SalesChannelsSection } from '@/components/dashboard/store/SalesChannelsSection';
import { DispatchOrdersSection } from '@/components/dashboard/store/DispatchOrdersSection';
import { PaymentsSection } from '@/components/dashboard/store/PaymentsSection';
import { TeamSection } from '@/components/dashboard/store/TeamSection';
import { DeliverySettingsSection } from '@/components/dashboard/store/DeliverySettingsSection';
import { SubscriptionSection } from '@/components/dashboard/store/SubscriptionSection';
import { WebhooksSection } from '@/components/dashboard/store/WebhooksSection';
import { ProductReviewsTab } from '@/components/dashboard/store/ProductReviewsTab';
import { RMAManagementTab } from '@/components/dashboard/store/RMAManagementTab';
import { CompareProductsModal } from '@/components/dashboard/store/CompareProductsModal';
import { SuppliersSection } from '@/components/dashboard/store/SuppliersSection';

import { useEffect } from 'react';


export default function StoreDashboardPage() {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'overview';

  useEffect(() => {
    let title = 'Store Dashboard';
    if (currentSection) {
        const sectionName = currentSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        title = `${sectionName} | Store Dashboard`;
    }
    document.title = `${title} | Khidmatik`;
  }, [currentSection]);


  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return <OverviewSection />;
      case 'orders':
        return <OrdersSection />;
      case 'scheduled-orders':
        return <ScheduledOrdersSection />;
      case 'new-order':
        return <NewOrderSection />;
      case 'failure-management':
        return <FailureManagementSection />;
      case 'shipments': // New
        return <ShipmentsSection />;
      case 'products':
        return <ProductsSection />;
      case 'stock-inventory':
        return <StockInventorySection />;
      case 'sales-channels':
        return <SalesChannelsSection />;
      case 'dispatch-orders':
        return <DispatchOrdersSection />;
      case 'customers':
        return <CustomersSection />;
      case 'marketing':
        return <MarketingSection />;
      case 'financials': // New
        return <FinancialsSection />;
      case 'payments':
        return <PaymentsSection />;
      case 'team':
        return <TeamSection />;
      case 'delivery-settings':
        return <DeliverySettingsSection />;
      case 'subscription':
        return <SubscriptionSection />;
      case 'webhooks':
        return <WebhooksSection />;
      case 'ai-assistant': // New
        return <AISellerAssistantSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'reviews':
        return <ProductReviewsTab />;
      case 'rma':
        return <RMAManagementTab />;
      case 'compare-wishlist':
        return <CompareProductsModal />;
      case 'suppliers':
        return <SuppliersSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return <div className="py-4 space-y-6">{renderSection()}</div>;
}
