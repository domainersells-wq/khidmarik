'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  UserCheck,
  ClipboardList,
  Users,
  MessageSquareWarning,
  ChevronLeft,
  ShieldCheck,
  UserCircle,
  CalendarClock,
  Briefcase,
  DollarSign,
  Megaphone,
  LineChart,
  Settings,
  MessagesSquare,
  CreditCard,
  AlertOctagon,
} from 'lucide-react';
import { AppLogo } from '@/components/layout/AppLogo';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface ProfessionalServicesDashboardSidebarProps {
  onLinkClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { href: 'profile-modules', label: 'Public Profile', translationKey: 'publicProfile', icon: UserCircle },
  { href: 'sos-dispatch', label: 'Emergency SOS Dispatch (النداء الطارئ)', translationKey: 'sosDispatch', icon: AlertOctagon },
  { href: 'subscription', label: 'Subscription & Plans', translationKey: 'financialManagement', icon: CreditCard },
  { href: 'verification', label: 'Verification & Badges', translationKey: 'verificationBadges', icon: UserCheck },
  { href: 'service-management', label: 'Service Management', translationKey: 'serviceManagement', icon: Briefcase },
  { href: 'bookings-calendar', label: 'Bookings & Calendar', translationKey: 'bookingsCalendar', icon: CalendarClock },
  { href: 'project-management', label: 'Projects & Orders', translationKey: 'projectsOrders', icon: ClipboardList },
  { href: 'marketing-promotions', label: 'Marketing & Promotions', translationKey: 'marketingPromotions', icon: Megaphone },
  { href: 'earnings-payouts', label: 'Earnings & Payouts', translationKey: 'earningsPayouts', icon: DollarSign },
  { href: 'client-communication', label: 'Client Communication', translationKey: 'clientCommunication', icon: MessagesSquare },
  { href: 'clients', label: 'Clients & Members', translationKey: 'clientsMembers', icon: Users },
  { href: 'analytics', label: 'Performance Analytics', translationKey: 'performanceAnalytics', icon: LineChart },
  { href: 'settings-integrations', label: 'Settings & Integrations', translationKey: 'settingsIntegrations', icon: Settings },
  { href: 'support', label: 'Help & Support', translationKey: 'helpSupport', icon: MessageSquareWarning },
];

export function ProfessionalServicesDashboardSidebar({ 
  onLinkClick,
  isCollapsed = false,
  onToggleCollapse
}: ProfessionalServicesDashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'profile-modules';
  const { translate } = useLanguage();
  const { hasPermission } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    return hasPermission('view_services_dashboard');
  });

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
            <Link href="/dashboard/professional-services" className="flex items-center gap-3 font-semibold truncate" onClick={onLinkClick}>
              <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
              <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 transition-all duration-300">
                {translate('servicesAdmin', 'Services Admin')}
              </span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard/professional-services" onClick={onLinkClick} className="flex justify-center items-center shrink-0">
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
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.href;
              const labelText = translate(item.translationKey, item.label);
              
              const linkContent = (
                <Link
                  href={`/dashboard/professional-services?section=${item.href}`}
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
        <div className={cn("mt-auto border-t p-3 transition-all duration-300", isCollapsed ? "flex justify-center" : "p-4")}>
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
