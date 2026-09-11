'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Bell,
  CheckCheck,
  Settings,
  ShoppingCart,
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  ShieldAlert,
  Award,
  Wallet,
  Megaphone,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/context/LanguageContext';
import { NotificationItem, NotificationEventType } from '@/types/notifications';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { cn } from '@/lib/utils';

export function getNotificationIcon(type: NotificationEventType) {
  switch (type) {
    case 'new_order':
    case 'order_accepted':
    case 'order_rejected':
    case 'order_cancelled':
      return { icon: ShoppingCart, color: 'text-emerald-500 bg-emerald-500/10' };
    case 'booking_created':
    case 'booking_confirmed':
    case 'booking_cancelled':
      return { icon: Calendar, color: 'text-blue-500 bg-blue-500/10' };
    case 'payment_completed':
    case 'payment_failed':
    case 'refund':
    case 'topup_approved':
      return { icon: CreditCard, color: 'text-amber-500 bg-amber-500/10' };
    case 'topup_request':
      return { icon: Wallet, color: 'text-emerald-500 bg-emerald-500/10' };
    case 'topup_rejected':
      return { icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10' };
    case 'topup_info_required':
      return { icon: HelpCircle, color: 'text-blue-500 bg-blue-500/10' };
    case 'withdrawal_status':
    case 'withdrawal_request':
      return { icon: Wallet, color: 'text-indigo-500 bg-indigo-500/10' };
    case 'new_message':
      return { icon: MessageSquare, color: 'text-sky-500 bg-sky-500/10' };
    case 'new_review':
      return { icon: Star, color: 'text-yellow-500 bg-yellow-500/10' };
    case 'new_dispute':
      return { icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10' };
    case 'verification_approved':
    case 'verification_rejected':
    case 'verification_request':
      return { icon: Award, color: 'text-teal-500 bg-teal-500/10' };
    case 'admin_announcement':
    default:
      return { icon: Megaphone, color: 'text-purple-500 bg-purple-500/10' };
  }
}

interface NotificationBellDropdownProps {
  buttonClassName?: string;
}

export function NotificationBellDropdown({ buttonClassName }: NotificationBellDropdownProps) {
  const router = useRouter();
  const { translate } = useLanguage();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [activeQuickTab, setActiveQuickTab] = useState<'all' | 'unread'>('all');

  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    updatePreferences
  } = useNotifications();

  const displayedList = activeQuickTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleItemClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    setIsSheetOpen(false);
    if (notif.data?.actionUrl) {
      router.push(notif.data.actionUrl);
    }
  };

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  buttonClassName || "h-[40px] w-[40px] rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 relative"
                )}
                aria-label={translate('notifications', 'Notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-[6px] right-[6px] flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary text-[9px] font-bold text-primary-foreground items-center justify-center"></span>
                  </span>
                )}
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs font-semibold font-sans">
            {translate('notifications', 'Notifications')} {unreadCount > 0 && `(${unreadCount})`}
          </TooltipContent>
        </Tooltip>

        <SheetContent className="w-[360px] sm:w-[460px] flex flex-col p-0 z-50">
          {/* Header */}
          <SheetHeader className="p-4 border-b bg-card/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold font-headline">
                  {translate('notifications', 'Notifications')}
                </SheetTitle>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} {translate('new', 'New')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-medium text-muted-foreground hover:text-primary gap-1 px-2"
                    onClick={() => markAllAsRead()}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{translate('markAllRead', 'Mark all read')}</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setIsPrefsOpen(true)}
                  title={translate('notificationPref', 'Notification Preferences')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-2">
              <Button
                variant={activeQuickTab === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs rounded-lg px-3 font-medium"
                onClick={() => setActiveQuickTab('all')}
              >
                {translate('all', 'All')} ({notifications.length})
              </Button>
              <Button
                variant={activeQuickTab === 'unread' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs rounded-lg px-3 font-medium"
                onClick={() => setActiveQuickTab('unread')}
              >
                {translate('unread', 'Unread')} ({unreadCount})
              </Button>
            </div>
          </SheetHeader>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-border/20">
            {displayedList.length > 0 ? (
              displayedList.map((item: NotificationItem) => {
                const { icon: IconComp, color } = getNotificationIcon(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-3 transition-all duration-200 cursor-pointer text-left rtl:text-right hover:shadow-sm",
                      item.isRead
                        ? "bg-card/40 border-border/40 hover:bg-card/80 opacity-80 hover:opacity-100"
                        : "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-xs"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", color)}>
                      <IconComp className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn("text-xs sm:text-sm font-semibold truncate", !item.isRead && "text-primary font-bold")}>
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-muted-foreground/70">
                        <span>
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                        {item.data?.actionUrl && (
                          <span className="flex items-center gap-1 text-primary hover:underline text-[11px] font-medium">
                            {translate('view', 'View')}
                            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {activeQuickTab === 'unread'
                    ? translate('noUnreadNotifications', 'No unread notifications')
                    : translate('noNotificationsYet', 'No notifications yet')}
                </p>
                <p className="text-xs text-muted-foreground max-w-[240px] mx-auto mt-1">
                  {translate('notificationsAutoDesc', 'Orders, bookings, payments, and system updates will appear here in real-time.')}
                </p>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-3 border-t bg-card/60 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold gap-1.5 h-9 rounded-xl"
              asChild
              onClick={() => setIsSheetOpen(false)}
            >
              <Link href="/notifications">
                <span>{translate('viewAllNotifications', 'Open Notification Center')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
        preferences={preferences}
        onSave={updatePreferences}
      />
    </>
  );
}
