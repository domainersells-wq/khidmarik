'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
  ChevronLeft,
  Store,
  DollarSign,
  Sparkles,
  Truck,
  CalendarClock,
  PlusCircle,
  AlertCircle,
  Layers,
  Share2,
  Compass,
  CreditCard,
  MapPin,
  Award,
  Webhook,
  MessageSquare,
  RotateCcw,
  GitCompare,
  ShieldCheck
} from 'lucide-react';
import { AppLogo } from '@/components/layout/AppLogo';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface DashboardSidebarProps {
  onLinkClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const navItems = [
  { href: 'overview', label: 'Dashboard', translationKey: 'overview', icon: LayoutDashboard },
  { href: 'orders', label: 'All Orders', translationKey: 'ordersReturns', icon: ShoppingCart },
  { href: 'scheduled-orders', label: 'Scheduled Orders', translationKey: 'scheduledOrders', icon: CalendarClock },
  { href: 'new-order', label: 'New Order', translationKey: 'newOrder', icon: PlusCircle },
  { href: 'failure-management', label: 'Failure Management', translationKey: 'failureManagement', icon: AlertCircle },
  { href: 'analytics', label: 'Statistics', translationKey: 'analyticsReports', icon: LineChart },
  { href: 'stock-inventory', label: 'Stock & Inventory', translationKey: 'stockInventory', icon: Layers },
  { href: 'products', label: 'Products & Categories', translationKey: 'productsInventory', icon: Package },
  { href: 'shipments', label: 'Shipments & Returns', translationKey: 'shipmentsDelivery', icon: Truck },
  { href: 'reviews', label: 'Reviews & Ratings', translationKey: 'reviewsFeedback', icon: MessageSquare },
  { href: 'rma', label: 'Returns & RMA', translationKey: 'returnsRma', icon: RotateCcw },
  { href: 'compare-wishlist', label: 'Compare & Wishlist', translationKey: 'compareWishlist', icon: GitCompare },
  { href: 'sales-channels', label: 'Sales Channels', translationKey: 'salesChannels', icon: Share2 },
  { href: 'dispatch-orders', label: 'Order Dispatch', translationKey: 'dispatchOrders', icon: Compass },
  { href: 'financials', label: 'Finances', translationKey: 'financialsPayouts', icon: DollarSign },
  { href: 'payments', label: 'Payments', translationKey: 'payments', icon: CreditCard },
  { href: 'settings', label: 'Settings', translationKey: 'storeSettingsConfig', icon: Settings },
  { href: 'suppliers', label: 'Suppliers', translationKey: 'suppliers', icon: Truck },
  { href: 'team', label: 'Team', translationKey: 'teamManagement', icon: Users },
  { href: 'delivery-settings', label: 'Delivery Settings', translationKey: 'deliverySettings', icon: MapPin },
  { href: 'subscription', label: 'Subscription', translationKey: 'subscription', icon: Award },
  { href: 'webhooks', label: 'Webhooks', translationKey: 'webhooks', icon: Webhook }
];

const navItemPermissions: Record<string, string> = {
  'overview': 'view_store_dashboard',
  'orders': 'view_store_dashboard',
  'scheduled-orders': 'view_store_dashboard',
  'new-order': 'create_order',
  'failure-management': 'view_store_dashboard',
  'analytics': 'view_analytics',
  'stock-inventory': 'manage_products',
  'products': 'manage_products',
  'shipments': 'view_store_dashboard',
  'reviews': 'view_store_dashboard',
  'rma': 'view_store_dashboard',
  'compare-wishlist': 'view_store_dashboard',
  'sales-channels': 'manage_settings',
  'dispatch-orders': 'view_store_dashboard',
  'financials': 'view_store_dashboard',
  'payments': 'view_store_dashboard',
  'settings': 'manage_settings',
  'suppliers': 'manage_products',
  'team': 'manage_settings',
  'delivery-settings': 'manage_settings',
  'subscription': 'manage_settings',
  'webhooks': 'manage_settings'
};

export function DashboardSidebar({ onLinkClick, isCollapsed = false, onToggleCollapse, className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'overview';
  const { translate } = useLanguage();
  const { hasPermission } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    const requiredPermission = navItemPermissions[item.href];
    if (!requiredPermission) return true;
    return hasPermission(requiredPermission);
  });

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={cn(
        "fixed inset-y-0 z-20 flex h-full flex-col border-r bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out overflow-hidden custom-sidebar-scrollbar",
        "ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l",
        isCollapsed ? "w-[80px]" : "w-[300px]",
        className
      )}>
        {/* Header container */}
        <div className={cn(
          "flex h-16 items-center px-4 border-b transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <Link href="/dashboard/store" className="flex items-center gap-3 font-semibold truncate" onClick={onLinkClick}>
              <AppLogo className="h-8 w-8 text-primary shrink-0" />
              <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 transition-all duration-300">
                {translate('storeDashboard', 'Store Dashboard')}
              </span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard/store" onClick={onLinkClick} className="flex justify-center items-center shrink-0">
              <AppLogo className="h-8 w-8 text-primary" />
            </Link>
          )}
          
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={cn(
                "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted hidden md:flex shrink-0 rounded-lg transition-all duration-200",
                isCollapsed && "absolute ltr:-right-4 rtl:-left-4 top-4 bg-background border rounded-full shadow-sm z-50 h-7 w-7"
              )}
            >
              {isCollapsed ? (
                <ChevronLeft className="h-4 w-4 rotate-180" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 custom-sidebar-scrollbar">
          <ul className="flex flex-col gap-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.href;
              const labelText = translate(item.translationKey, item.label);
              
              const linkContent = (
                <Link
                  href={`/dashboard/store?section=${item.href}`}
                  className={cn(
                    "flex items-center w-full h-[52px] px-3.5 rounded-xl transition-all duration-300 ease-in-out font-sans text-sm font-medium",
                    isCollapsed ? 'justify-center px-0' : 'justify-start',
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm hover:translate-x-0'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:translate-x-1 rtl:hover:-translate-x-1 hover:shadow-sm'
                  )}
                  onClick={onLinkClick}
                >
                  <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", !isCollapsed && "ltr:mr-3.5 rtl:ml-3.5")} />
                  {!isCollapsed && <span className="truncate">{labelText}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <li key={item.href} className="flex justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-950 text-white text-xs border-none py-1.5 px-3 shadow-md font-sans rounded-md">
                        {labelText}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.href}>{linkContent}</li>;
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={cn("mt-auto border-t p-3 transition-all duration-300 flex flex-col gap-2", isCollapsed ? "items-center p-2" : "p-4")}>
          {hasPermission('view_admin_dashboard') && (
            isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/dashboard"
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'icon' }),
                      'h-10 w-10 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    )}
                  >
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-950 text-white text-xs border-none py-1.5 px-3 shadow-md font-sans rounded-md">
                  Super Admin Hub
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="default" className="w-full justify-start h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold" asChild>
                <Link href="/admin/dashboard">
                  <ShieldCheck className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="truncate text-xs">Super Admin Hub</span>
                </Link>
              </Button>
            )
          )}

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'icon' }),
                    'h-[52px] w-[52px] rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-300'
                  )}
                >
                  <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-950 text-white text-xs border-none py-1.5 px-3 shadow-md font-sans rounded-md">
                {translate('backToMainSite', 'Back to Main Site')}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="outline" className="w-full justify-start h-[52px] px-3.5 rounded-xl hover:bg-muted/60 transition-all duration-300" asChild>
              <Link href="/">
                <ChevronLeft className="ltr:mr-3.5 rtl:ml-3.5 h-5 w-5 shrink-0 rtl:rotate-180" /> 
                <span className="truncate">{translate('backToMainSite', 'Back to Main Site')}</span>
              </Link>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
