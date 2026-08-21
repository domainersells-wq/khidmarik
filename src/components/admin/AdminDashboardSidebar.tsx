'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
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
  UserCheck as VerificationIcon
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface AdminDashboardSidebarProps {
  onLinkClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { href: 'overview', label: 'Dashboard', translationKey: 'overview', icon: LayoutDashboard },
  { href: 'verification-queue', label: 'Approval Center', translationKey: 'verificationQueue', icon: VerificationIcon },
  { href: 'user-management', label: 'User Management', translationKey: 'userManagement', icon: UserCog },
  { href: 'store-management', label: 'Store Dashboard', translationKey: 'storeManagement', icon: Store },
  { href: 'provider-management', label: 'Services Admin Panel', translationKey: 'providerManagement', icon: Briefcase },
  { href: 'reservation-management', label: 'Reservations', translationKey: 'reservationManagement', icon: Building },
  { href: 'financial-management', label: 'Payments & Subscriptions', translationKey: 'financialManagement', icon: DollarSign },
  { href: 'platform-analytics', label: 'Reports & Statistics', translationKey: 'platformAnalytics', icon: BarChart3 },
  { href: 'content-moderation', label: 'Content Moderation', translationKey: 'contentModeration', icon: FileWarning },
  { href: 'cms-site-content', label: 'Templates & CMS', translationKey: 'cmsSiteContent', icon: FileText },
  { href: 'system-configuration', label: 'General Settings', translationKey: 'systemConfiguration', icon: Settings },
  { href: 'security-audit', label: 'Logs, Backups & Maintenance', translationKey: 'securityAudit', icon: Fingerprint },
  { href: 'ai-advanced-tools', label: 'Plugins & APIs', translationKey: 'aiAdvancedTools', icon: Sparkles },
  { href: 'support-system', label: 'Support & Tickets', translationKey: 'supportSystem', icon: Headset },
];

export function AdminDashboardSidebar({ 
  onLinkClick,
  isCollapsed = false,
  onToggleCollapse
}: AdminDashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { translate } = useLanguage();
  const { logout } = useAuth();
  const currentSection = searchParams.get('section') || 'verification-queue'; 

  const handleLogout = () => {
    logout();
    if (onLinkClick) onLinkClick();
  };

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
              <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
              <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 transition-all duration-300">
                {translate('adminDashboard', 'Super Admin')}
              </span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/admin/dashboard" onClick={onLinkClick} className="flex justify-center items-center shrink-0">
              <ShieldCheck className="h-8 w-8 text-primary" />
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.href;
              const labelText = translate(item.translationKey, item.label);
              
              const linkContent = (
                <Link
                  href={`/admin/dashboard?section=${item.href}`}
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
        <div className={cn("mt-auto border-t p-3 transition-all duration-300 flex flex-col gap-1.5 items-center", isCollapsed ? "p-2" : "p-4")}>
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleLogout}
                    className="h-[52px] w-[52px] rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300"
                  >
                    <LogOut className="h-5 w-5" />
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
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full justify-start h-[52px] px-3.5 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300"
              >
                <LogOut className="ltr:mr-3.5 rtl:ml-3.5 h-5 w-5 shrink-0" />
                <span className="truncate">{translate('logOut', 'Log Out')}</span>
              </Button>

              <Button variant="outline" className="w-full justify-start h-[52px] px-3.5 rounded-xl hover:bg-muted/60 transition-all duration-300" asChild>
                <Link href="/">
                  <ChevronLeft className="ltr:mr-3.5 rtl:ml-3.5 h-5 w-5 shrink-0 rtl:rotate-180" /> 
                  <span className="truncate">{translate('backToMainSite', 'Back to Main Site')}</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
