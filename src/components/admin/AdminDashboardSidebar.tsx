'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { financialService } from '@/services/financialService';
import { providerVerificationService } from '@/services/providerVerificationService';
import { escrowDisputeService } from '@/services/escrowDisputeService';
import { adminDataService } from '@/services/adminDataService';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  UserCog,
  Store,
  Building,
  Briefcase,
  DollarSign,
  BarChart3,
  FileWarning,
  FileText,
  Settings,
  Fingerprint,
  Sparkles,
  Headset,
  ChevronLeft,
  LogOut,
  LayoutDashboard,
  UserCheck as VerificationIcon,
  Package,
  Wrench,
  ShoppingCart,
  Receipt,
  Percent,
  Landmark,
  RotateCcw,
  Scale,
  Star,
  Bell,
  MessageSquare,
  FolderTree,
  MapPin,
  Search,
  X,
  ChevronDown,
  Layers,
  Truck,
  Wallet
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { AppPermission, AppRole } from '@/types/rbac';

interface AdminDashboardSidebarProps {
  onLinkClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface NavItemDef {
  href: string;
  label: string;
  translationKey: string;
  icon: any;
  requiredPermission?: AppPermission;
  requiredRoles?: AppRole[];
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
  isExternalRoute?: boolean;
}

export interface NavGroupDef {
  groupTitle: string;
  items: NavItemDef[];
}

export const navGroups: NavGroupDef[] = [
  {
    groupTitle: 'Overview & Intelligence',
    items: [
      { href: 'overview', label: 'Dashboard', translationKey: 'overview', icon: LayoutDashboard },
      { href: 'platform-analytics', label: 'Analytics', translationKey: 'platformAnalytics', icon: BarChart3, requiredPermission: 'view_analytics' },
      { href: 'platform-reports', label: 'Reports', translationKey: 'reports', icon: FileText, requiredPermission: 'view_analytics' },
      { href: 'audit-logs', label: 'Audit Logs', translationKey: 'auditLogs', icon: Fingerprint, requiredPermission: 'manage_all' },
    ],
  },
  {
    groupTitle: 'User & Entity Directory',
    items: [
      { href: 'user-management', label: 'Users', translationKey: 'userManagement', icon: UserCog, requiredPermission: 'manage_users' },
      { href: 'provider-management', label: 'Providers', translationKey: 'providerManagement', icon: Briefcase, requiredPermission: 'manage_providers' },
      { href: 'store-management', label: 'Stores', translationKey: 'storeManagement', icon: Store, requiredPermission: 'manage_stores' },
      { href: 'verification-queue', label: 'Approval Center', translationKey: 'verificationQueue', icon: VerificationIcon, requiredPermission: 'manage_users' },
    ],
  },
  {
    groupTitle: 'Commerce & Catalog',
    items: [
      { href: 'product-management', label: 'Products', translationKey: 'productManagement', icon: Package, requiredPermission: 'manage_products' },
      { href: 'service-management', label: 'Services', translationKey: 'serviceManagement', icon: Wrench, requiredPermission: 'manage_providers' },
      { href: 'category-management', label: 'Categories', translationKey: 'categoryManagement', icon: FolderTree, requiredPermission: 'manage_content' },
      { href: 'location-management', label: 'Locations (58 Wilayas)', translationKey: 'locationManagement', icon: MapPin, requiredPermission: 'manage_settings' },
    ],
  },
  {
    groupTitle: 'Operations & Orders',
    items: [
      { href: 'order-management', label: 'Orders', translationKey: 'orderManagement', icon: ShoppingCart, requiredPermission: 'manage_orders' },
      { href: 'shipping-management', label: 'Shipping & Logistics', translationKey: 'shippingManagement', icon: Truck, requiredPermission: 'manage_orders' },
      { href: 'reservation-management', label: 'Bookings', translationKey: 'reservationManagement', icon: Building, requiredPermission: 'manage_bookings' },
      { href: 'dispute-resolution', label: 'Disputes', translationKey: 'disputeResolution', icon: Scale, requiredPermission: 'manage_disputes' },
      { href: 'review-moderation', label: 'Reviews', translationKey: 'reviewModeration', icon: Star, requiredPermission: 'manage_reviews' },
    ],
  },
  {
    groupTitle: 'Financial Hub',
    items: [
      { href: 'topup-management', label: 'Top-Up Requests', translationKey: 'topupManagement', icon: Wallet, requiredPermission: 'manage_payments' },
      { href: 'payment-management', label: 'Payments', translationKey: 'paymentManagement', icon: DollarSign, requiredPermission: 'manage_payments' },
      { href: 'transaction-ledger', label: 'Transactions', translationKey: 'transactionLedger', icon: Receipt, requiredPermission: 'manage_payments' },
      { href: 'commission-management', label: 'Commissions', translationKey: 'commissionManagement', icon: Percent, requiredPermission: 'manage_payments' },
      { href: 'withdrawal-management', label: 'Withdrawals', translationKey: 'withdrawalManagement', icon: Landmark, requiredPermission: 'manage_withdrawals' },
      { href: 'refund-management', label: 'Refunds', translationKey: 'refundManagement', icon: RotateCcw, requiredPermission: 'manage_payments' },
    ],
  },
  {
    groupTitle: 'Communication & Support',
    items: [
      { href: 'notification-center', label: 'Notifications', translationKey: 'notificationCenter', icon: Bell, requiredPermission: 'manage_content' },
      { href: 'messaging-center', label: 'Messages', translationKey: 'messagingCenter', icon: MessageSquare, requiredPermission: 'manage_disputes' },
      { href: 'support-system', label: 'Support & Tickets', translationKey: 'supportSystem', icon: Headset, requiredPermission: 'manage_disputes' },
    ],
  },
  {
    groupTitle: 'System & Security',
    items: [
      { href: 'system-configuration', label: 'Platform Settings', translationKey: 'systemConfiguration', icon: Settings, requiredPermission: 'manage_settings' },
      { href: 'security-audit', label: 'Security & Access', translationKey: 'securityAudit', icon: ShieldCheck, requiredPermission: 'manage_all' },
      { href: 'cms-site-content', label: 'CMS & Templates', translationKey: 'cmsSiteContent', icon: FileWarning, requiredPermission: 'manage_content' },
      { href: 'ai-advanced-tools', label: 'Plugins & APIs', translationKey: 'aiAdvancedTools', icon: Sparkles, requiredPermission: 'manage_all' },
    ],
  },
  {
    groupTitle: 'Role Portals (لوحات التجار والمقدمين)',
    items: [
      { href: '/dashboard/store', label: 'Store Owner Dashboard', translationKey: 'storeDashboard', icon: Store, isExternalRoute: true },
      { href: '/dashboard/professional-services', label: 'Services Provider Dashboard', translationKey: 'servicesAdmin', icon: Briefcase, isExternalRoute: true },
    ],
  },
];

export function AdminDashboardSidebar({ 
  onLinkClick,
  isCollapsed = false,
  onToggleCollapse
}: AdminDashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { translate } = useLanguage();
  const { user, hasPermission, hasAnyRole, logout } = useAuth();
  const currentSection = searchParams.get('section') || 'overview';
  const [navSearch, setNavSearch] = useState('');

  // Live real-time action counts
  const [counts, setCounts] = useState({
    topups: 0,
    kyc: 0,
    disputes: 0,
    withdrawals: 0,
  });

  const refreshCounts = useCallback(async () => {
    try {
      const topups = financialService.getTopUpRequests().filter(
        r => r.status === 'UNDER_REVIEW' || r.status === 'PENDING_PAYMENT_CONFIRMATION' || r.status === 'PENDING_VERIFICATION'
      ).length;
      const kyc = providerVerificationService.getAllVerificationProfiles().filter(
        p => p.status === 'UNDER_REVIEW'
      ).length;
      const disputes = escrowDisputeService.getDisputes().filter(
        d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW' || d.status === 'WAITING_CUSTOMER' || d.status === 'WAITING_PROVIDER'
      ).length;
      const withdrawals = adminDataService.getWithdrawals().filter(
        w => w.status === 'pending'
      ).length;
      setCounts({ topups, kyc, disputes, withdrawals });

      try {
        const synced = await financialService.syncTopUpsFromServer();
        const serverTopups = synced.filter(
          r => r.status === 'UNDER_REVIEW' || r.status === 'PENDING_PAYMENT_CONFIRMATION' || r.status === 'PENDING_VERIFICATION'
        ).length;
        setCounts(prev => ({ ...prev, topups: serverTopups }));
      } catch {}
    } catch {}
  }, []);

  useEffect(() => {
    refreshCounts();

    window.addEventListener('khidmatik:topup-updated', refreshCounts);
    window.addEventListener('khidmatik:admin-new-topup', refreshCounts);
    window.addEventListener('storage', refreshCounts);

    const interval = setInterval(refreshCounts, 3000);
    return () => {
      window.removeEventListener('khidmatik:topup-updated', refreshCounts);
      window.removeEventListener('khidmatik:admin-new-topup', refreshCounts);
      window.removeEventListener('storage', refreshCounts);
      clearInterval(interval);
    };
  }, [refreshCounts]);

  const handleLogout = () => {
    logout();
    if (onLinkClick) onLinkClick();
  };

  // Filter groups based on permissions, search, and attach dynamic real-time badges
  const filteredGroups = navGroups.map((group) => {
    const visibleItems = group.items.filter((item) => {
      // Permission check
      if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false;
      if (item.requiredRoles && !hasAnyRole(item.requiredRoles)) return false;

      // Nav search filter
      if (navSearch.trim()) {
        const query = navSearch.toLowerCase();
        return item.label.toLowerCase().includes(query) || item.href.toLowerCase().includes(query);
      }
      return true;
    }).map(item => {
      // Attach real-time computed badge
      let badge: string | number | undefined = undefined;
      let badgeVariant: 'default' | 'secondary' | 'destructive' = 'secondary';

      if (item.href === 'topup-management' && counts.topups > 0) {
        badge = counts.topups;
        badgeVariant = 'destructive';
      } else if (item.href === 'verification-queue' && counts.kyc > 0) {
        badge = counts.kyc;
        badgeVariant = 'destructive';
      } else if (item.href === 'dispute-resolution' && counts.disputes > 0) {
        badge = counts.disputes;
        badgeVariant = 'destructive';
      } else if (item.href === 'withdrawal-management' && counts.withdrawals > 0) {
        badge = counts.withdrawals;
        badgeVariant = 'secondary';
      }

      return {
        ...item,
        badge,
        badgeVariant
      };
    });

    return {
      ...group,
      items: visibleItems,
    };
  }).filter((group) => group.items.length > 0);

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={cn(
        "fixed inset-y-0 z-20 flex h-full flex-col border-r bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out overflow-hidden custom-sidebar-scrollbar",
        "ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l",
        isCollapsed ? "w-[80px]" : "w-[300px]"
      )}>
        {/* Header container */}
        <div className={cn(
          "flex h-16 items-center px-4 border-b transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-3 font-semibold truncate" onClick={onLinkClick}>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-foreground truncate">
                  Khidmatik Admin
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Platform v2.4</span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/admin/dashboard" onClick={onLinkClick} className="flex justify-center items-center shrink-0">
              <ShieldCheck className="h-7 w-7 text-primary" />
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

        {/* Quick Module Search (when not collapsed) */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Find module..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs bg-muted/40 rounded-lg border-muted"
              />
              {navSearch && (
                <button
                  onClick={() => setNavSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 custom-sidebar-scrollbar space-y-4">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.groupTitle}
                </div>
              )}
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Handle section aliases for active highlight
                  const isActive = item.href.startsWith('/')
                    ? pathname === item.href
                    : (currentSection === item.href ||
                    (item.href === 'user-management' && currentSection === 'users') ||
                    (item.href === 'provider-management' && currentSection === 'providers') ||
                    (item.href === 'store-management' && currentSection === 'stores') ||
                    (item.href === 'product-management' && currentSection === 'products') ||
                    (item.href === 'service-management' && currentSection === 'services') ||
                    (item.href === 'order-management' && currentSection === 'orders') ||
                    (item.href === 'reservation-management' && currentSection === 'bookings') ||
                    (item.href === 'payment-management' && (currentSection === 'payments' || currentSection === 'financial-management')) ||
                    (item.href === 'transaction-ledger' && currentSection === 'transactions') ||
                    (item.href === 'commission-management' && currentSection === 'commissions') ||
                    (item.href === 'withdrawal-management' && currentSection === 'withdrawals') ||
                    (item.href === 'refund-management' && currentSection === 'refunds') ||
                    (item.href === 'dispute-resolution' && currentSection === 'disputes') ||
                    (item.href === 'review-moderation' && (currentSection === 'reviews' || currentSection === 'content-moderation')) ||
                    (item.href === 'platform-reports' && currentSection === 'reports') ||
                    (item.href === 'notification-center' && currentSection === 'notifications') ||
                    (item.href === 'messaging-center' && currentSection === 'messages') ||
                    (item.href === 'category-management' && currentSection === 'categories') ||
                    (item.href === 'location-management' && currentSection === 'locations') ||
                    (item.href === 'system-configuration' && currentSection === 'settings') ||
                    (item.href === 'security-audit' && currentSection === 'security') ||
                    (item.href === 'platform-analytics' && currentSection === 'analytics'));

                  const labelText = translate(item.translationKey, item.label);
                  
                  const linkContent = (
                    <Link
                      href={item.href.startsWith('/') ? item.href : `/admin/dashboard?section=${item.href}`}
                      className={cn(
                        "flex items-center justify-between w-full h-[40px] px-2.5 rounded-xl transition-all duration-200 ease-in-out font-sans text-xs font-medium",
                        isCollapsed ? 'justify-center px-0 h-[44px]' : 'justify-start',
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                      onClick={onLinkClick}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive && "text-primary-foreground")} />
                        {!isCollapsed && <span className="truncate">{labelText}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'secondary'}
                          className="h-4 px-1.5 text-[10px] font-bold rounded-full"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <li key={item.href} className="flex justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-slate-950 text-white text-xs border-none py-1 px-2.5 shadow-md font-sans rounded-md">
                            {labelText}
                            {item.badge && ` (${item.badge})`}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  return <li key={item.href}>{linkContent}</li>;
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn("mt-auto border-t p-2.5 transition-all duration-300 flex flex-col gap-1.5 items-center", isCollapsed ? "p-2" : "p-3")}>
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleLogout}
                    className="h-9 w-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-950 text-white text-xs border-none py-1.5 px-3 shadow-md font-sans rounded-md">
                  {translate('logOut', 'Log Out')}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'icon' }),
                      'h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-950 text-white text-xs border-none py-1.5 px-3 shadow-md font-sans rounded-md">
                  {translate('backToMainSite', 'Back to Main Site')}
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex-1 justify-start h-8 px-2.5 rounded-lg text-xs text-red-500 hover:text-red-600 hover:bg-red-50/50"
              >
                <LogOut className="ltr:mr-2 rtl:ml-2 h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{translate('logOut', 'Log Out')}</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/" title="Back to Main Site">
                  <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
