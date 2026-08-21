
'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Store, Briefcase, UserCircle, FileText, GitBranch, MapPinned, Cog, SearchCode, Palette, ShoppingCart, Languages, Bell, AlertCircle, CalendarDays, PlusCircle, LayoutDashboard, Moon, Sun, ShieldCheck, LogOut, Lock, ChevronDown, Bookmark, Activity, Key, Monitor, Smartphone, ChevronRight, Settings, Wrench } from 'lucide-react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toaster } from "@/components/ui/toaster";
import { AppLogo } from '@/components/layout/AppLogo';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from 'next-themes';
import { ThemeToggleButton } from '@/components/layout/ThemeToggleButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import type { NotificationItem, UserProfileData, Language } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, Suspense } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Mock notifications data
const mockNotifications: NotificationItem[] = [
  {
    id: 'notif1',
    type: 'reservation',
    title: 'Appointment Confirmed: Dr. Fatima Zohra',
    message: 'Your appointment for tomorrow at 10:00 AM is confirmed. Ref ID: APT-DRF-12345.',
    timestamp: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    icon: CalendarDays,
    isRead: false,
  },
  {
    id: 'notif2',
    type: 'purchase',
    title: 'Order Shipped: #ORD-XYZ-789',
    message: 'Your order for "Modern LED Chandelier" has been shipped and is on its way!',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    icon: ShoppingCart,
    isRead: false,
  },
  {
    id: 'notif3',
    type: 'alert',
    title: 'Low Stock Alert: Artisan Bread',
    message: 'Your product "Artisan Bread" has only 5 units left in stock.',
    timestamp: new Date().toISOString(),
    icon: AlertCircle,
    isRead: true,
  },
  {
    id: 'notif4',
    type: 'system',
    title: 'Welcome to Khidmatik v1.1!',
    message: 'We\'ve updated our services. Check out the new features on the app roadmap.',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    icon: Cog,
    isRead: true,
  },
];

function Header() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const cleanedName = user && user.name ? user.name.replace(/\s*\(.*?\)\s*/g, '') : '';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const syncNotifs = () => {
      const saved = localStorage.getItem('khidmatik_notifications');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotifications(parsed);
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem('khidmatik_notifications', JSON.stringify(mockNotifications));
        setNotifications(mockNotifications);
      }
    };
    syncNotifs();
    window.addEventListener('storage', syncNotifs);
    window.addEventListener('khidmatik_notif_update', syncNotifs);
    return () => {
      window.removeEventListener('storage', syncNotifs);
      window.removeEventListener('khidmatik_notif_update', syncNotifs);
    };
  }, []);
  const { language, setLanguage, translate } = useLanguage();
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isStoresActive = pathname === '/listings' && searchParams.get('type') === 'store';
  const isServicesActive = pathname === '/listings' && searchParams.get('type') === 'professional';
  const isDigitalActive = pathname === '/digital-services';
  const isMarketplaceActive = pathname === '/marketplace';
  const isCraftsmenActive = pathname === '/craftsmen-dispatch';

  const navBtnClass = (isActive: boolean) => cn(
    "h-[40px] px-4 rounded-xl font-sans text-xs sm:text-sm font-semibold transition-all duration-250 ease-in-out flex items-center gap-2 select-none border",
    isActive 
      ? "bg-primary/10 dark:bg-primary/20 text-primary border-primary/30 shadow-sm hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-primary/15 dark:hover:bg-primary/25" 
      : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
  );

  const actionBtnClass = cn(
    "h-[40px] w-[40px] rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-250 ease-in-out flex items-center justify-center select-none active:scale-95"
  );

  const profileBtnClass = cn(
    "h-[40px] px-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-250 ease-in-out flex items-center gap-2 select-none active:scale-95"
  );

  // Account Hub states
  const [activeHubTab, setActiveHubTab] = useState<'overview' | 'actions' | 'settings' | 'security'>('overview');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutAll, setLogoutAll] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [enable2FA, setEnable2FA] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    let langName = 'English';
    if (lang === 'ar') langName = 'العربية';
    if (lang === 'fr') langName = 'Français';
    toast({
      title: translate('languageSwitched', `Language Switched to ${langName}`),
      description: translate('languageSwitchedDesc', `App language set to ${langName}. Some text may update.`),
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('khidmatik_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <header className="bg-card/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <AppLogo className="h-8 w-8" aria-label="Khidmatik Logo" />
            <h1 className="text-2xl font-headline font-bold">Khidmatik</h1>
          </Link>

          <nav className="flex items-center">
            {/* Page Navigation Links */}
            <div className="hidden md:flex items-center gap-2.5 ltr:mr-6 rtl:ml-6 py-1">
              <Button size="sm" asChild className={navBtnClass(isStoresActive)}>
                <Link href="/listings?type=store" className="flex items-center gap-1.5">
                  <Store className="h-4 w-4" />
                  <span>{translate('stores','Stores')}</span>
                </Link>
              </Button>
              <Button size="sm" asChild className={navBtnClass(isServicesActive)}>
                <Link href="/listings?type=professional" className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  <span>{translate('services','Services')}</span>
                </Link>
              </Button>
              <Button size="sm" asChild className={navBtnClass(isDigitalActive)}>
                <Link href="/digital-services" className="flex items-center gap-1.5">
                  <Palette className="h-4 w-4" />
                  <span>{translate('digital','Digital')}</span>
                </Link>
              </Button>
              <Button size="sm" asChild className={navBtnClass(isMarketplaceActive)}>
                <Link href="/marketplace" className="flex items-center gap-1.5">
                  <Cog className="h-4 w-4" />
                  <span>{translate('marketplace','Marketplace')}</span>
                </Link>
              </Button>
            </div>

            {/* Action Icons Group */}
            <div className="flex items-center gap-3 py-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ThemeToggleButton className={actionBtnClass} />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-semibold font-sans">
                  {translate('toggleTheme', 'Toggle Theme')}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" asChild className={actionBtnClass}>
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="sr-only">Shopping Cart</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-semibold font-sans">
                  {translate('shoppingCart', 'Shopping Cart')}
                </TooltipContent>
              </Tooltip>

              <Sheet>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button size="icon" className={cn(actionBtnClass, "relative")}>
                        <Bell className="h-5 w-5" />
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <span className="absolute top-[8px] right-[8px] flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                        )}
                        <span className="sr-only">{translate('notifications', 'Notifications')}</span>
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs font-semibold font-sans">
                    {translate('notifications', 'Notifications')}
                  </TooltipContent>
                </Tooltip>
                <SheetContent className="w-[350px] sm:w-[450px] flex flex-col p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>{translate('notifications', 'Notifications')}</SheetTitle>
                    <SheetDescription>{translate('recentActivityAlertsUpdates', 'Recent activity, alerts, and updates.')}</SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.length > 0 ? (
                      notifications.map(notification => {
                        let NotificationIcon: any = AlertCircle;
                        if (typeof notification.icon === 'function') {
                          NotificationIcon = notification.icon;
                        } else if (notification.icon === 'ShieldCheck') {
                          NotificationIcon = ShieldCheck;
                        } else if (notification.icon === 'CalendarDays') {
                          NotificationIcon = CalendarDays;
                        } else if (notification.icon === 'ShoppingCart') {
                          NotificationIcon = ShoppingCart;
                        } else if (notification.icon === 'Cog') {
                          NotificationIcon = Cog;
                        }
                        return (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-md border flex items-start gap-3 transition-colors hover:bg-muted/50 ${notification.isRead ? 'bg-card' : 'bg-accent/10 border-accent/50'}`}
                            onClick={() => {
                              markNotificationAsRead(notification.id);
                              if (notification.title.includes('OTP') || notification.title.includes('التحقق')) {
                                window.location.href = '/profile';
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                markNotificationAsRead(notification.id);
                                if (notification.title.includes('OTP') || notification.title.includes('التحقق')) {
                                  window.location.href = '/profile';
                                }
                              }
                            }}
                          >
                            <NotificationIcon className={`h-5 w-5 mt-1 shrink-0 ${notification.type === 'alert' ? 'text-destructive' : notification.type === 'purchase' ? 'text-green-500' : notification.type === 'reservation' ? 'text-blue-500' : 'text-primary'}`} />
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${notification.isRead ? 'text-foreground' : 'text-primary'}`}>{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground/80 mt-1">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.isRead && <span className="h-2.5 w-2.5 bg-primary rounded-full mt-1.5 shrink-0" title="Unread"></span>}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-10">No new notifications.</p>
                    )}
                  </div>
                  <div className="p-4 border-t">
                    <Button variant="link" size="sm" className="w-full text-muted-foreground" disabled>{translate('viewAllNotifications', 'View All Notifications')}</Button>
                  </div>
                </SheetContent>
              </Sheet>

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
                  <DropdownMenuItem onSelect={() => handleLanguageChange('en')}>{translate('english', 'English')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLanguageChange('ar')}>{translate('arabic', 'العربية (Arabic)')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLanguageChange('fr')}>{translate('french', 'Français (French)')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {!user ? (
                <>
                  <Button size="sm" asChild className="h-[40px] px-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all duration-250 ease-in-out">
                    <Link href="/login">
                      {translate('logIn', 'Log In')}
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="h-[40px] px-4 rounded-xl border border-primary/20 bg-primary hover:bg-primary/95 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] text-primary-foreground font-semibold text-xs shadow-sm transition-all duration-250 ease-in-out">
                    <Link href="/register/choice">
                      {translate('register', 'Register')}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className={profileBtnClass}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-[26px] w-[26px] rounded-full border shadow-sm object-cover bg-white" />
                        ) : (
                          <div className="h-[26px] w-[26px] rounded-full border bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-semibold max-w-[120px] truncate">{cleanedName}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-[360px] sm:w-[400px] rounded-2xl shadow-xl border-border/80 p-0 overflow-hidden font-sans">
                    {/* Dropdown Header Card */}
                    <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="h-12 w-12 rounded-full border shadow-sm object-cover bg-white" />
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
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">{translate('adminDashboard', 'Super Admin')}</span>
                          )}
                          {user.role === 'store_owner' && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">{translate('storeManagement', 'Store Owner')}</span>
                          )}
                          {user.role === 'service_provider' && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">{translate('providerManagement', 'Service Provider')}</span>
                          )}
                          {user.role !== 'super_admin' && user.role !== 'store_owner' && user.role !== 'service_provider' && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">Customer</span>
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
                            "flex-1 text-center py-2.5 border-b-2 transition-all duration-200 capitalize select-none",
                            activeHubTab === tab 
                              ? "border-primary text-primary" 
                              : "border-transparent text-muted-foreground hover:text-foreground"
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
                          {/* Dashboard Access */}
                          {(user.role === 'store_owner' || user.role === 'super_admin' || user.role === 'service_provider') && (
                            <div className="space-y-2">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{translate('dashboards', 'Dashboards')}</h5>
                              <div className="grid grid-cols-1 gap-1.5">
                                {(user.role === 'store_owner' || user.role === 'super_admin') && (
                                  <Link 
                                    href="/dashboard/store"
                                    className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/20 hover:bg-blue-50/50 transition-colors text-xs font-semibold text-blue-700 dark:text-blue-300"
                                  >
                                    <Store className="h-4 w-4" /> {translate('myStoreDashboard', 'My Store Dashboard')}
                                  </Link>
                                )}
                                {(user.role === 'service_provider' || user.role === 'super_admin') && (
                                  <Link 
                                    href="/dashboard/professional-services"
                                    className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900 bg-purple-50/20 hover:bg-purple-50/50 transition-colors text-xs font-semibold text-purple-700 dark:text-purple-300"
                                  >
                                    <Briefcase className="h-4 w-4" /> {translate('servicesAdminPanel', 'Services Admin Panel')}
                                  </Link>
                                )}
                                {user.role === 'super_admin' && (
                                  <Link 
                                    href="/admin/dashboard"
                                    className="flex items-center gap-2 p-2.5 rounded-xl border border-red-100 dark:border-red-900 bg-red-50/20 hover:bg-red-50/50 transition-colors text-xs font-semibold text-red-700 dark:text-red-300"
                                  >
                                    <ShieldCheck className="h-4 w-4" /> {translate('platformSuperAdmin', 'Platform Super Admin')}
                                  </Link>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Account Overview */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{translate('accountOverview', 'Account Overview')}</h5>
                            <div className="bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border p-3.5 space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{translate('lastLogin', 'Last Login')}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">Today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{translate('accountStatus', 'Account Status')}</span>
                                <span className="font-semibold text-green-600 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping"></span>
                                  {translate('active', 'Active')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{translate('subscriptionType', 'Subscription Type')}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{user.isStoreOwner ? 'Pro Merchant' : 'Basic Member'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{translate('accountCreated', 'Account Created')}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.memberSince || 'March 10, 2024'}</span>
                              </div>
                              <div className="h-px bg-slate-100 dark:bg-slate-900 my-2"></div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{translate('emailVerified', 'Email Verified')}</span>
                                <span className="font-semibold text-blue-600">{translate('yes', 'Yes')}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{translate('phoneVerified', 'Phone Verified')}</span>
                                <span className="font-semibold text-blue-600">{translate('yes', 'Yes')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Statistics (Admin) */}
                          {user.role === 'super_admin' && (
                            <div className="space-y-2">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{translate('quickStats', 'Quick Statistics')}</h5>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="border rounded-xl p-2.5 bg-slate-50/30 text-center">
                                  <p className="text-[10px] text-muted-foreground font-semibold">{translate('ordersToday', 'Orders Today')}</p>
                                  <p className="text-sm font-bold text-primary">24</p>
                                </div>
                                <div className="border rounded-xl p-2.5 bg-slate-50/30 text-center">
                                  <p className="text-[10px] text-muted-foreground font-semibold">{translate('storesCount', 'Stores')}</p>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">320</p>
                                </div>
                                <div className="border rounded-xl p-2.5 bg-slate-50/30 text-center">
                                  <p className="text-[10px] text-muted-foreground font-semibold">{translate('servicesCount', 'Services')}</p>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">156</p>
                                </div>
                                <div className="border rounded-xl p-2.5 bg-slate-50/30 text-center">
                                  <p className="text-[10px] text-muted-foreground font-semibold">{translate('revenueToday', 'Revenue Today')}</p>
                                  <p className="text-sm font-bold text-green-600">45k DA</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeHubTab === 'actions' && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <Link href="/profile" className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center">
                            <UserCircle className="h-6 w-6 text-primary" />
                            <span className="font-semibold">{translate('myProfile', 'My Profile')}</span>
                          </Link>
                          <Link href="/profile?tab=settings" className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center">
                            <Settings className="h-6 w-6 text-primary" />
                            <span className="font-semibold">{translate('accountSettings', 'Account Settings')}</span>
                          </Link>
                          <Link href="/profile?tab=notifications" className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center">
                            <Bell className="h-6 w-6 text-primary" />
                            <span className="font-semibold">{translate('notificationCenter', 'Notification Center')}</span>
                          </Link>
                          <Link href="/profile?tab=password" className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center">
                            <Lock className="h-6 w-6 text-primary" />
                            <span className="font-semibold">{translate('securityPassword', 'Security & Password')}</span>
                          </Link>
                          <div className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center cursor-pointer" onClick={() => toast({title: "Activity Log", description: "Showing current activity history."})}>
                            <Activity className="h-6 w-6 text-primary" />
                            <span className="font-semibold">{translate('activityLog', 'Activity Log')}</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 p-3 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-center cursor-pointer" onClick={() => toast({title: "Saved Items", description: "All marked items loaded."})}>
                            <Bookmark className="h-6 w-6 text-primary" />
                            <span className="font-semibold">{translate('savedItems', 'Saved Items')}</span>
                          </div>
                        </div>
                      )}

                      {activeHubTab === 'settings' && (
                        <div className="space-y-4 text-left rtl:text-right">
                          {/* Appearance */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{translate('appearance', 'Appearance')}</h5>
                            <div className="flex items-center justify-between border rounded-xl p-3 bg-slate-50/30">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{translate('theme', 'Theme')}</span>
                              <ThemeToggleButton />
                            </div>
                          </div>

                          {/* Notifications */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{translate('notificationPref', 'Notification Preferences')}</h5>
                            <div className="border rounded-xl p-3 bg-slate-50/30 space-y-3">
                              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                                <span>{translate('emailNotifications', 'Email Notifications')}</span>
                                <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                              </label>
                              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                                <span>{translate('pushNotifications', 'Push Notifications')}</span>
                                <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeHubTab === 'security' && (
                        <div className="space-y-4 text-xs text-left rtl:text-right">
                          {/* 2FA */}
                          <div className="space-y-2">
                            <label className="flex items-center justify-between border rounded-xl p-3 bg-slate-50/30 cursor-pointer select-none">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{translate('twoFactorAuth', 'Two-Factor Authentication (2FA)')}</span>
                                <span className="text-[10px] text-muted-foreground">Add security key layer</span>
                              </div>
                              <input type="checkbox" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                            </label>
                          </div>

                          {/* Active Sessions */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{translate('activeSessions', 'Active Sessions')}</h5>
                            <div className="border rounded-xl p-3 bg-slate-50/30 space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">Chrome / Windows</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">Algiers, DZ - Current Session</span>
                                </div>
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Active</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dropdown Footer Actions */}
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

                        {/* Checkbox for logout all devices */}
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
          </div>
        </nav>
      </div>
    </header>
  </TooltipProvider>
);
}

function Footer() {
  const { translate } = useLanguage();
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} {translate('footerRights', 'Khidmatik. All rights reserved.')}</p>
        <div className="text-sm mt-2 space-x-4 flex items-center justify-center flex-wrap">
            <Link href="/app-roadmap" className="hover:text-primary hover:underline flex items-center justify-center gap-1 my-1">
                <GitBranch className="h-4 w-4" /> {translate('appRoadmap', 'App Roadmap')}
            </Link>
            <Link href="/service-point" className="hover:text-primary hover:underline flex items-center justify-center gap-1 my-1">
                <MapPinned className="h-4 w-4" /> {translate('servicePoint', 'Service Point')}
            </Link>
        </div>
        <p className="text-sm mt-1">{translate('footerSlogan', 'Connecting communities in Algérie, one click at a time.')}</p>
      </div>
    </footer>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ClientRootLayoutContent>
          {children}
        </ClientRootLayoutContent>
      </AuthProvider>
    </LanguageProvider>
  );
}

// New component to consume language context properly
function ClientRootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language } = useLanguage(); // Ensure context is used within provider

  return (
    <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <title>Khidmatik - Your Super App for Algérie</title>
        <meta name="description" content="Khidmatik - Your Super App for Algérie! Discover stores, services, parts, and more. Connect with your community across Algérie." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="h-[73px] bg-white border-b" />}>
            <Header />
          </Suspense>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

    