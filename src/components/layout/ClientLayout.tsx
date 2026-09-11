'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Store,
  Briefcase,
  UserCircle,
  FileText,
  GitBranch,
  MapPinned,
  Cog,
  Palette,
  ShoppingCart,
  Languages,
  Bell,
  LogOut,
  Lock,
  ChevronDown,
  Bookmark,
  Activity,
  Settings,
  ShoppingBag,
  ShieldCheck,
  Wrench,
  Truck,
  Building2,
  Menu,
  X,
  Layers,
  Home,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { AppLogo } from '@/components/layout/AppLogo';
import { ThemeProvider } from 'next-themes';
import { ThemeToggleButton } from '@/components/layout/ThemeToggleButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Language } from '@/types';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { NotificationBellDropdown } from '@/components/notifications/NotificationBellDropdown';
import { MessagesDropdown } from '@/components/chat/MessagesDropdown';
import { TwoFactorSetupModal } from '@/components/auth/TwoFactorSetupModal';
import { is2FAEnabled, disable2FA } from '@/services/twoFactorService';

function Header() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const cleanedName = user && user.name ? user.name.replace(/\s*\(.*?\)\s*/g, '') : '';
  const { language, setLanguage, translate } = useLanguage();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSearchActive = pathname === '/search';
  const isStoresActive = pathname === '/listings' && searchParams.get('type') === 'store';
  const isServicesActive = pathname === '/listings' && searchParams.get('type') === 'professional';
  const isDigitalActive = pathname === '/digital-services';
  const isMarketplaceActive = pathname === '/marketplace';
  const isSectorsActive =
    pathname === '/craftsmen-dispatch' ||
    pathname === '/parts-mine' ||
    pathname === '/banquet-halls' ||
    pathname === '/tracking';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const stored = localStorage.getItem('khidmatikCart');
        if (stored) {
          const items = JSON.parse(stored);
          if (Array.isArray(items)) {
            setCartCount(items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0));
            return;
          }
        }
        setCartCount(0);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 2500);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const navBtnClass = (isActive: boolean) =>
    cn(
      'h-[40px] px-4 rounded-xl font-sans text-xs sm:text-sm font-semibold transition-all duration-250 ease-in-out flex items-center gap-2 select-none border',
      isActive
        ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/30 shadow-sm hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-primary/15 dark:hover:bg-primary/25'
        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
    );

  const actionBtnClass = cn(
    'h-[40px] w-[40px] rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-250 ease-in-out flex items-center justify-center select-none active:scale-95'
  );

  const profileBtnClass = cn(
    'h-[40px] px-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-250 ease-in-out flex items-center gap-2 select-none active:scale-95'
  );

  const [activeHubTab, setActiveHubTab] = useState<'overview' | 'actions' | 'settings' | 'security'>('overview');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutAll, setLogoutAll] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [enable2FA, setEnable2FA] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEnable2FA(is2FAEnabled(user.email));
    }
  }, [user]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    let langName = 'English';
    if (lang === 'ar') langName = 'العربية';
    if (lang === 'fr') langName = 'Français';
    toast({
      title: translate('languageSwitched', `Language Switched to ${langName}`),
      description: translate('languageSwitchedDesc', `App language set to ${langName}.`),
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <header className="bg-card/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <AppLogo className="h-8 w-8" aria-label="Khidmatik Logo" />
            <span className="text-2xl font-headline font-bold">Khidmatik</span>
          </Link>

          <nav className="flex items-center">
            {/* Page Navigation Links */}
            <div className="hidden md:flex items-center gap-2.5 ltr:mr-6 rtl:ml-6 py-1">
              <Button size="sm" asChild className={navBtnClass(isSearchActive)}>
                <Link href="/search" className="flex items-center gap-1.5 font-bold text-primary">
                  <Search className="h-4 w-4" />
                  <span>{translate('search', 'Search / بحث')}</span>
                </Link>
              </Button>
              <Button size="sm" asChild className={navBtnClass(isStoresActive)}>
                <Link href="/listings?type=store" className="flex items-center gap-1.5">
                  <Store className="h-4 w-4" />
                  <span>{translate('stores', 'Stores')}</span>
                </Link>
              </Button>
              <Button size="sm" asChild className={navBtnClass(isServicesActive)}>
                <Link href="/listings?type=professional" className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  <span>{translate('services', 'Services')}</span>
                </Link>
              </Button>
              <Button size="sm" asChild className={navBtnClass(isDigitalActive)}>
                <Link href="/digital-services" className="flex items-center gap-1.5">
                  <Palette className="h-4 w-4" />
                  <span>{translate('digital', 'Digital')}</span>
                </Link>
              </Button>
              <Button size="sm" asChild className={navBtnClass(isMarketplaceActive)}>
                <Link href="/marketplace" className="flex items-center gap-1.5">
                  <Cog className="h-4 w-4" />
                  <span>{translate('marketplace', 'Marketplace')}</span>
                </Link>
              </Button>


              {/* All Platform Sectors Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className={navBtnClass(isSectorsActive)}>
                    <Layers className="h-4 w-4 text-primary" />
                    <span>{translate('moreSectors', 'القطاعات / Sectors')}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60 p-2 rounded-2xl shadow-xl border-border/80 font-sans">
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-2.5">
                    <Link href="/craftsmen-dispatch" className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold text-xs">الحرفيون والطوارئ</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">SOS</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-2.5">
                    <Link href="/parts-mine" className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Cog className="h-4 w-4 text-rose-500" />
                        <span className="font-semibold text-xs">منجم قطع الغيار</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600">OEM</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-2.5">
                    <Link href="/banquet-halls" className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-purple-500" />
                        <span className="font-semibold text-xs">قاعات الحفلات والأعراس</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-2.5">
                    <Link href="/tracking" className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-cyan-500" />
                        <span className="font-semibold text-xs">تتبع الشحنات الحية</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600">LIVE</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Action Icons Group */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 py-1">
              {/* Desktop-only Action Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ThemeToggleButton className={actionBtnClass} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs font-semibold font-sans">
                    {translate('toggleTheme', 'Toggle Theme')}
                  </TooltipContent>
                </Tooltip>

                {/* Centralized Notification Bell & Realtime Drawer */}
                <NotificationBellDropdown buttonClassName={actionBtnClass} />

                {/* Realtime Messages Popover */}
                <MessagesDropdown buttonClassName={actionBtnClass} />

                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" className={actionBtnClass}>
                          <Languages className="h-5 w-5" />
                          <span className="sr-only">{translate('selectLanguage', 'Change language')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-semibold font-sans">
                      {translate('selectLanguage', 'Change Language')}
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{translate('selectLanguage', 'Select Language')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleLanguageChange('en')}>
                      {translate('english', 'English')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleLanguageChange('ar')}>
                      {translate('arabic', 'العربية (Arabic)')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleLanguageChange('fr')}>
                      {translate('french', 'Français (French)')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Shopping Cart Button with Dynamic Badge (Visible on all devices) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" asChild className={cn(actionBtnClass, "relative")}>
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                      <span className="sr-only">Shopping Cart</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-semibold font-sans">
                  {translate('shoppingCart', 'Shopping Cart')}
                </TooltipContent>
              </Tooltip>

              {!user ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    asChild
                    className="h-[38px] px-3 sm:px-4 rounded-xl border border-primary/20 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs shadow-xs transition-all duration-200"
                  >
                    <Link href="/login">{translate('logIn', 'دخول')}</Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="hidden sm:inline-flex h-[38px] px-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100/50 transition-all duration-200"
                  >
                    <Link href="/register/choice">{translate('register', 'Register')}</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className={profileBtnClass}>
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-[26px] w-[26px] rounded-full border shadow-sm object-cover bg-white"
                          />
                        ) : (
                          <div className="h-[26px] w-[26px] rounded-full border bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-semibold max-w-[120px] truncate">{cleanedName}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-[360px] sm:w-[400px] rounded-2xl shadow-xl border-border/80 p-0 overflow-hidden font-sans"
                    >
                      {/* Dropdown Header Card */}
                      <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-12 w-12 rounded-full border shadow-sm object-cover bg-white"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full border bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <div className="mt-1">
                            {user.role === 'super_admin' && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                                {translate('adminDashboard', 'Super Admin')}
                              </span>
                            )}
                            {user.role === 'store_owner' && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                {translate('storeManagement', 'Store Owner')}
                              </span>
                            )}
                            {user.role === 'service_provider' && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                {translate('providerManagement', 'Service Provider')}
                              </span>
                            )}
                            {user.role !== 'super_admin' &&
                              user.role !== 'store_owner' &&
                              user.role !== 'service_provider' && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">
                                  Customer
                                </span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Sub-Tabs Navigation */}
                      <div className="flex border-b text-xs font-semibold bg-white dark:bg-slate-950">
                        {(['overview', 'actions', 'settings', 'security'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveHubTab(tab);
                            }}
                            className={cn(
                              'flex-1 text-center py-2.5 border-b-2 transition-all duration-200 capitalize select-none',
                              activeHubTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {translate(tab, tab)}
                          </button>
                        ))}
                      </div>

                      {/* Scrollable Content Container */}
                      <div className="max-h-[380px] overflow-y-auto custom-sidebar-scrollbar p-4 space-y-4">
                        {activeHubTab === 'overview' && (
                          <div className="space-y-4 text-left rtl:text-right">
                            {(user.role === 'store_owner' ||
                              user.role === 'super_admin' ||
                              user.role === 'service_provider') && (
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {translate('dashboards', 'Dashboards')}
                                </h5>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {(user.role === 'store_owner' || user.role === 'super_admin') && (
                                    <Link
                                      href="/dashboard/store"
                                      className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/20 hover:bg-blue-50/50 transition-colors text-xs font-semibold text-blue-700 dark:text-blue-300"
                                    >
                                      <Store className="h-4 w-4" />{' '}
                                      {translate('myStoreDashboard', 'My Store Dashboard')}
                                    </Link>
                                  )}
                                  {(user.role === 'service_provider' || user.role === 'super_admin') && (
                                    <Link
                                      href="/dashboard/professional-services"
                                      className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900 bg-purple-50/20 hover:bg-purple-50/50 transition-colors text-xs font-semibold text-purple-700 dark:text-purple-300"
                                    >
                                      <Briefcase className="h-4 w-4" />{' '}
                                      {translate('servicesAdminPanel', 'Services Admin Panel')}
                                    </Link>
                                  )}
                                  {user.role === 'super_admin' && (
                                    <Link
                                      href="/admin/dashboard"
                                      className="flex items-center gap-2 p-2.5 rounded-xl border border-red-100 dark:border-red-900 bg-red-50/20 hover:bg-red-50/50 transition-colors text-xs font-semibold text-red-700 dark:text-red-300"
                                    >
                                      <ShieldCheck className="h-4 w-4" />{' '}
                                      {translate('platformSuperAdmin', 'Platform Super Admin')}
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Account Overview */}
                            <div className="space-y-2">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {translate('accountOverview', 'Account Overview')}
                              </h5>
                              <div className="bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border p-3.5 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">{translate('lastLogin', 'Last Login')}</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">
                                    {translate('accountStatus', 'Account Status')}
                                  </span>
                                  <span className="font-semibold text-green-600 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping"></span>
                                    {translate('active', 'Active')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">
                                    {translate('subscriptionType', 'Subscription Type')}
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                                    {user.isStoreOwner ? 'Pro Merchant' : 'Basic Member'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeHubTab === 'actions' && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <Link
                              href="/account/orders"
                              className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center bg-primary/5 border-primary/20"
                            >
                              <ShoppingBag className="h-6 w-6 text-primary" />
                              <span className="font-bold text-foreground">{translate('myOrders', 'My Orders')}</span>
                            </Link>
                            <Link
                              href="/profile"
                              className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center"
                            >
                              <UserCircle className="h-6 w-6 text-primary" />
                              <span className="font-semibold">{translate('myProfile', 'My Profile')}</span>
                            </Link>
                            <Link
                              href="/profile?tab=settings"
                              className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center"
                            >
                              <Settings className="h-6 w-6 text-primary" />
                              <span className="font-semibold">{translate('accountSettings', 'Account Settings')}</span>
                            </Link>
                            <Link
                              href="/profile?tab=notifications"
                              className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center"
                            >
                              <Bell className="h-6 w-6 text-primary" />
                              <span className="font-semibold">
                                {translate('notificationCenter', 'Notification Center')}
                              </span>
                            </Link>
                            <Link
                              href="/profile?tab=password"
                              className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center"
                            >
                              <Lock className="h-6 w-6 text-primary" />
                              <span className="font-semibold">
                                {translate('securityPassword', 'Security & Password')}
                              </span>
                            </Link>
                          </div>
                        )}

                        {activeHubTab === 'settings' && (
                          <div className="space-y-4 text-left rtl:text-right">
                            <div className="space-y-2">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {translate('appearance', 'Appearance')}
                              </h5>
                              <div className="flex items-center justify-between border rounded-xl p-3 bg-slate-50/30">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                  {translate('theme', 'Theme')}
                                </span>
                                <ThemeToggleButton />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {translate('notificationPref', 'Notification Preferences')}
                              </h5>
                              <div className="border rounded-xl p-3 bg-slate-50/30 space-y-3">
                                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                                  <span>{translate('emailNotifications', 'Email Notifications')}</span>
                                  <input
                                    type="checkbox"
                                    checked={emailNotif}
                                    onChange={(e) => setEmailNotif(e.target.checked)}
                                    className="rounded text-primary focus:ring-primary h-4 w-4"
                                  />
                                </label>
                                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                                  <span>{translate('pushNotifications', 'Push Notifications')}</span>
                                  <input
                                    type="checkbox"
                                    checked={pushNotif}
                                    onChange={(e) => setPushNotif(e.target.checked)}
                                    className="rounded text-primary focus:ring-primary h-4 w-4"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeHubTab === 'security' && (
                          <div className="space-y-4 text-xs text-left rtl:text-right">
                            <div className="space-y-2">
                              <div className="border rounded-2xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                      <ShieldCheck className="h-4 w-4 text-primary" />
                                      {translate('twoFactorAuth', 'المصادقة الثنائية (2FA)')}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {enable2FA
                                        ? 'حسابك محمي برمز أمان إضافي من هاتفك'
                                        : 'تأمين الحساب برمز تحقق إضافي عبر Authenticator'}
                                    </span>
                                  </div>
                                  {enable2FA ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      مفعّل
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                                      معطل
                                    </span>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                                  {!enable2FA ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => setShow2FAModal(true)}
                                      className="w-full h-8 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-1.5"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                      <span>بدء تفعيل المصادقة الثنائية الآن</span>
                                    </Button>
                                  ) : (
                                    <div className="flex items-center justify-between w-full gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShow2FAModal(true)}
                                        className="flex-1 h-8 text-[11px] font-bold rounded-xl"
                                      >
                                        إعادة الضبط / الرموز
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                          if (confirm('هل أنت متأكد من رغبتك في تعطيل المصادقة الثنائية (2FA)؟')) {
                                            await disable2FA(user?.email || '');
                                            setEnable2FA(false);
                                            toast({
                                              title: 'تم تعطيل 2FA',
                                              description: 'تم إلغاء تفعيل المصادقة الثنائية لحسابك.',
                                            });
                                          }
                                        }}
                                        className="h-8 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                                      >
                                        تعطيل
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 border-t bg-slate-50/30 flex gap-2 justify-end">
                        <Button
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowLogoutConfirm(true);
                          }}
                          className="w-full rounded-xl h-10 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <LogOut className="h-4 w-4" /> {translate('logOut', 'Log Out')}
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Custom Logout Confirmation Dialog */}
                  {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
                      <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl p-6 font-sans">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                          <div className="bg-destructive/10 p-3 rounded-full text-destructive animate-pulse">
                            <LogOut className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {translate('logoutConfirm', 'Are you sure you want to log out?')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {translate('logoutConfirmDesc', 'You will be signed out of your current session.')}
                          </p>

                          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 select-none cursor-pointer border p-3 rounded-xl w-full justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                            <input
                              type="checkbox"
                              checked={logoutAll}
                              onChange={(e) => setLogoutAll(e.target.checked)}
                              className="rounded text-primary focus:ring-primary h-4 w-4"
                            />
                            <span>{translate('logoutAllDevices', 'Logout from all devices')}</span>
                          </label>
                        </div>

                        <div className="flex gap-3 mt-6 justify-end">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowLogoutConfirm(false);
                              setLogoutAll(false);
                            }}
                            className="rounded-xl px-4 py-2"
                          >
                            {translate('cancelBtn', 'Cancel')}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowLogoutConfirm(false);
                              logout();
                            }}
                            className="rounded-xl px-4 py-2 flex items-center gap-2"
                          >
                            <LogOut className="h-4 w-4" /> {translate('logOut', 'Log Out')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Mobile Menu Hamburger Toggle */}
              <Button
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(actionBtnClass, 'md:hidden')}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </nav>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-card/95 backdrop-blur-md px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/search"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-primary/5 border-primary/20 text-primary"
              >
                <Search className="h-4 w-4" />
                <span>{translate('search', 'بحث شامل')}</span>
              </Link>
              <Link
                href="/listings?type=store"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/40 hover:bg-muted"
              >
                <Store className="h-4 w-4 text-blue-500" />
                <span>{translate('stores', 'المتاجر')}</span>
              </Link>
              <Link
                href="/listings?type=professional"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/40 hover:bg-muted"
              >
                <Briefcase className="h-4 w-4 text-purple-500" />
                <span>{translate('services', 'الخدمات')}</span>
              </Link>
              <Link
                href="/digital-services"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/40 hover:bg-muted"
              >
                <Palette className="h-4 w-4 text-emerald-500" />
                <span>{translate('digital', 'خدمات رقمية')}</span>
              </Link>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/40 hover:bg-muted"
              >
                <ShoppingBag className="h-4 w-4 text-indigo-500" />
                <span>{translate('marketplace', 'السوق')}</span>
              </Link>
              <Link
                href="/craftsmen-dispatch"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
              >
                <Wrench className="h-4 w-4 text-amber-500" />
                <span>الحرفيون SOS</span>
              </Link>
              <Link
                href="/parts-mine"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              >
                <Cog className="h-4 w-4 text-rose-500" />
                <span>قطع الغيار</span>
              </Link>
              <Link
                href="/banquet-halls"
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300"
              >
                <Building2 className="h-4 w-4 text-purple-500" />
                <span>قاعات الحفلات</span>
              </Link>
              <Link
                href="/tracking"
                className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-bold"
              >
                <Truck className="h-4 w-4 text-cyan-500" />
                <span>تتبع الشحنات والطرود اللحظي</span>
              </Link>
            </div>

            {/* Mobile Drawer Settings: Language & Theme */}
            <div className="pt-3 border-t border-border/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-primary" />
                  <span>اللغة / Language:</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('ar')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold text-xs transition-colors",
                      language === 'ar' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('fr')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold text-xs transition-colors",
                      language === 'fr' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    Français
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold text-xs transition-colors",
                      language === 'en' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-primary" />
                  <span>المظهر / Theme:</span>
                </span>
                <ThemeToggleButton className="h-8 px-3 rounded-lg border text-xs" />
              </div>
            </div>
          </div>
        )}
        {/* Two-Factor Authentication Setup Modal */}
        <TwoFactorSetupModal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          userEmail={user?.email || ''}
          onSuccess={() => setEnable2FA(true)}
        />
      </header>
    </TooltipProvider>
  );
}

function Footer() {
  const { translate } = useLanguage();
  return (
    <footer className="bg-muted/50 text-muted-foreground pt-12 pb-8 mt-auto border-t">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-start">
          {/* Col 1: Platform Brand */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold text-xl font-headline">
              <AppLogo className="h-7 w-7" />
              <span>Khidmatik</span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {translate('footerSlogan', 'المنصة الشاملة الرائدة لربط الحرفيين، المتاجر، الخدمات واللوجستيات عبر الـ 58 ولاية في الجزائر.')}
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                ✓ موثوق ومحمي بنظام الضمان OTP
              </span>
            </div>
          </div>

          {/* Col 2: Core Sectors */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              قطاعات المنصة
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/craftsmen-dispatch" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-amber-500" />
                  <span>طوارئ الحرفيين (SOS)</span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <Store className="h-3.5 w-3.5 text-blue-500" />
                  <span>سوق المتاجر المتعددة</span>
                </Link>
              </li>
              <li>
                <Link href="/digital-services" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-emerald-500" />
                  <span>الخدمات الرقمية والوساطة</span>
                </Link>
              </li>
              <li>
                <Link href="/parts-mine" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <Cog className="h-3.5 w-3.5 text-rose-500" />
                  <span>منجم قطع الغيار (Parts Mine)</span>
                </Link>
              </li>
              <li>
                <Link href="/banquet-halls" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-purple-500" />
                  <span>قاعات الحفلات والأعراس</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Logistics & Services */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              الخدمات واللوجستيات
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/tracking" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-cyan-500" />
                  <span>تتبع الشحنات والطرود</span>
                </Link>
              </li>
              <li>
                <Link href="/service-point" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <MapPinned className="h-3.5 w-3.5 text-primary" />
                  <span>نقاط الاستلام (Service Point)</span>
                </Link>
              </li>
              <li>
                <Link href="/app-roadmap" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-primary" />
                  <span>خارطة طريق التطوير (Roadmap)</span>
                </Link>
              </li>
              <li>
                <Link href="/register/choice" className="hover:text-primary transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>تسجيل تاجر أو حرفي معتمد</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Security */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              الميثاق القانوني والأمان
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  شروط الاستخدام والخدمة (Terms)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  سياسة الخصوصية وحماية البيانات
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/40 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} {translate('footerRights', 'Khidmatik Algérie. All rights reserved.')}</p>
          <p className="text-[11px] text-muted-foreground/80">
            تطوير وتشغيل منصة خدماتك الجزائر • النسخة الشاملة v2.0
          </p>
        </div>
      </div>
    </footer>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const stored = localStorage.getItem('khidmatikCart');
        if (stored) {
          const items = JSON.parse(stored);
          if (Array.isArray(items)) {
            setCartCount(items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0));
            return;
          }
        }
        setCartCount(0);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 2500);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  const isHome = pathname === '/';
  const isMarket = pathname.startsWith('/marketplace') || pathname.startsWith('/listings');
  const isSos = pathname.startsWith('/craftsmen-dispatch');
  const isCart = pathname === '/cart' || pathname.startsWith('/checkout');
  const isProfile = pathname.startsWith('/account') || pathname.startsWith('/dashboard') || pathname === '/login' || pathname.startsWith('/register');

  const profileHref = user 
    ? (user.role === 'store_owner' ? '/dashboard/store' : user.role === 'service_provider' ? '/dashboard/professional-services' : user.role === 'super_admin' ? '/admin/dashboard' : '/account/orders')
    : '/login';

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/80 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
      <nav className="flex items-center justify-around h-16 px-1">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors select-none",
            isHome ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className={cn("h-5 w-5 mb-1 transition-transform", isHome && "scale-110 text-primary")} />
          <span>الرئيسية</span>
        </Link>

        <Link
          href="/marketplace"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors select-none",
            isMarket ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Store className={cn("h-5 w-5 mb-1 transition-transform", isMarket && "scale-110 text-primary")} />
          <span>السوق</span>
        </Link>

        <Link
          href="/craftsmen-dispatch"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors select-none relative",
            isSos ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center shadow-xs mb-0.5 transition-transform",
            isSos ? "bg-amber-500 text-white scale-110" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          )}>
            <Wrench className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">SOS طوارئ</span>
        </Link>

        <Link
          href="/cart"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors select-none relative",
            isCart ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <ShoppingCart className={cn("h-5 w-5 mb-1 transition-transform", isCart && "scale-110 text-primary")} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center shadow-xs animate-in zoom-in-50">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span>السلة</span>
        </Link>

        <Link
          href={profileHref}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors select-none",
            isProfile ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className={cn("h-5 w-5 rounded-full object-cover mb-1 border", isProfile && "ring-2 ring-primary")} />
          ) : (
            <UserCircle className={cn("h-5 w-5 mb-1 transition-transform", isProfile && "scale-110 text-primary")} />
          )}
          <span>{user ? 'حسابي' : 'دخول'}</span>
        </Link>
      </nav>
    </div>
  );
}

function ClientRootLayoutContent({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Suspense fallback={<div className="h-[64px] bg-card border-b" />}>
        <Header />
      </Suspense>
      <main className="flex-grow w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 pb-24 md:pb-6">{children}</main>
      <Footer />
      <MobileBottomNav />
      <Toaster />
    </ThemeProvider>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ClientRootLayoutContent>{children}</ClientRootLayoutContent>
      </AuthProvider>
    </LanguageProvider>
  );
}
