'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Search,
  Filter,
  ShoppingCart,
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  ShieldAlert,
  Award,
  Wallet,
  Megaphone,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationItem, NotificationCategory, NotificationEventType } from '@/types/notifications';
import { NotificationPreferencesModal } from '@/components/notifications/NotificationPreferencesModal';
import { getNotificationIcon } from '@/components/notifications/NotificationBellDropdown';
import { notificationService } from '@/services/notificationService';
import { cn } from '@/lib/utils';

export default function NotificationCenterPage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [readStatusFilter, setReadStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    updatePreferences,
    refresh
  } = useNotifications();

  // Filter list
  const filteredNotifications = notifications.filter(item => {
    // 1. Category
    if (activeCategory !== 'all') {
      const cat = notificationService.getCategoryForType(item.type);
      if (cat !== activeCategory) return false;
    }

    // 2. Read status
    if (readStatusFilter === 'unread' && item.isRead) return false;
    if (readStatusFilter === 'read' && !item.isRead) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMessage = item.message.toLowerCase().includes(q);
      const matchRef = item.data?.referenceId && item.data.referenceId.toLowerCase().includes(q);
      if (!matchTitle && !matchMessage && !matchRef) return false;
    }

    return true;
  });

  // Simulator helper to test all 17 event types
  const simulateEvent = async (type: NotificationEventType) => {
    if (!user?.id) return;
    setIsSimulating(true);

    const eventMocks: Record<NotificationEventType, { title: string; message: string; data: any }> = {
      new_order: {
        title: 'New Order Received #ORD-9910',
        message: 'A client bought "Flexible Chrome Water Faucet" for 3,600 DA.',
        data: { referenceId: 'ORD-9910', orderId: 'ORD-9910', amount: 3600, actionUrl: '/profile?tab=orders' }
      },
      order_accepted: {
        title: 'Order Confirmed by Seller',
        message: 'Store "ElectroDz" has accepted your order and prepared packaging.',
        data: { referenceId: 'ORD-77610', actionUrl: '/profile?tab=orders' }
      },
      order_rejected: {
        title: 'Order Declined',
        message: 'Item temporarily out of stock. Escrow funds refunded to your wallet.',
        data: { referenceId: 'ORD-55410', actionUrl: '/profile?tab=orders' }
      },
      order_cancelled: {
        title: 'Order Cancelled',
        message: 'Order #ORD-11220 has been cancelled as requested.',
        data: { referenceId: 'ORD-11220', actionUrl: '/profile?tab=orders' }
      },
      payment_completed: {
        title: 'Payment Succeeded & Held in Escrow',
        message: 'Your payment of 8,500 DA via CIB/Edahabia was confirmed.',
        data: { referenceId: 'TXN-8821', amount: 8500, actionUrl: '/profile?tab=wallet' }
      },
      payment_failed: {
        title: 'Payment Attempt Failed',
        message: 'Bank transaction could not be authorized. Please verify balance.',
        data: { referenceId: 'TXN-8822', actionUrl: '/checkout' }
      },
      refund: {
        title: 'Refund Credited to Wallet',
        message: 'Escrow amount of 4,500 DA has been refunded to your wallet.',
        data: { referenceId: 'REF-1092', amount: 4500, actionUrl: '/profile?tab=wallet' }
      },
      withdrawal_status: {
        title: 'CCP Withdrawal Approved & Dispatched',
        message: 'Your payout of 25,000 DA has been processed via Algérie Poste.',
        data: { referenceId: 'WD-9099', amount: 25000, status: 'dispatched', actionUrl: '/profile?tab=wallet' }
      },
      booking_created: {
        title: 'New Service Booking Received',
        message: 'Client reserved an Emergency Plumbing inspection for tomorrow.',
        data: { referenceId: 'SRV-8821', actionUrl: '/profile' }
      },
      booking_confirmed: {
        title: 'Booking Confirmed by Craftsman',
        message: 'Yassine Benali confirmed appointment for tomorrow at 10:00 AM.',
        data: { referenceId: 'SRV-8821', actionUrl: '/profile' }
      },
      booking_cancelled: {
        title: 'Booking Cancelled',
        message: 'The scheduled electrical maintenance visit was cancelled.',
        data: { referenceId: 'SRV-4455', actionUrl: '/profile' }
      },
      new_message: {
        title: 'New Message from Store Manager',
        message: '"Hello! Your custom order dimensions have been received."',
        data: { senderName: 'ElectroDz Store', actionUrl: '/profile' }
      },
      new_review: {
        title: 'New 5-Star Review Received ⭐',
        message: '"Top notch work! Fast delivery and great customer support."',
        data: { rating: 5, actionUrl: '/profile' }
      },
      new_dispute: {
        title: 'Escrow Dispute Opened: Inspection Needed',
        message: 'A dispute was submitted for order #ORD-77610. Khidmatik arbitration is active.',
        data: { referenceId: 'DSP-009', actionUrl: '/profile' }
      },
      verification_approved: {
        title: 'Official Provider Verification Approved! 🎖️',
        message: 'Your professional license has been verified. Verified Badge activated.',
        data: { actionUrl: '/profile' }
      },
      verification_rejected: {
        title: 'Verification Requires Additional Details',
        message: 'Please re-upload a clear photograph of your professional artisan card.',
        data: { actionUrl: '/profile' }
      },
      admin_announcement: {
        title: 'Khidmatik Platform Update • Realtime Live',
        message: 'Nationwide delivery tracking and escrow arbitration are now active.',
        data: { actionUrl: '/app-roadmap' }
      },
      topup_request: {
        title: '🔔 طلب شحن رصيد جديد بحاجة لمراجعة: TOP-2026-001',
        message: 'قام المستخدم بطلب شحن رصيد بمبلغ 5,000 دج عبر BaridiMob.',
        data: { referenceId: 'TOP-2026-001', amount: 5000, postalTransactionCode: 'BM-998811', actionUrl: '/admin/dashboard?section=topup-management&requestId=TOP-2026-001' }
      },
      topup_approved: {
        title: '✅ تم اعتماد شحن رصيدك بنجاح',
        message: 'تم التحقق من الحوالة البريدية وإيداع 5,000 دج في محفظتك الإلكترونية.',
        data: { referenceId: 'TOP-2026-001', amount: 5000, actionUrl: '/profile?tab=wallet' }
      },
      topup_rejected: {
        title: '❌ تعذر اعتماد طلب شحن الرصيد',
        message: 'لم يتم العثور على العملية في كشف الحساب البريدي أو تم إدخال رمز غير صحيح.',
        data: { referenceId: 'TOP-2026-001', actionUrl: '/profile?tab=wallet' }
      },
      topup_info_required: {
        title: 'ℹ️ مطلوب توضيح أو إرفاق مستند لطلب الشحن',
        message: 'يرجى تقديم وصل أوضح أو صورة لختم مكتب البريد لإتمام المطابقة.',
        data: { referenceId: 'TOP-2026-001', actionUrl: '/profile?tab=wallet' }
      },
      withdrawal_request: {
        title: '🔔 طلب سحب أرباح جديد: WD-2026-001',
        message: 'طلب مقدم الخدمة سحب مبلغ 12,000 دج إلى حسابه البريدي الجاري.',
        data: { referenceId: 'WD-2026-001', amount: 12000, actionUrl: '/admin/dashboard?section=withdrawals' }
      },
      verification_request: {
        title: '🔔 طلب توثيق هوية واعتماد مهني جديد',
        message: 'قدم الحرفي ملف التوثيق والبطاقة المهنية للمراجعة والتدقيق.',
        data: { referenceId: 'verif_1', actionUrl: '/admin/dashboard?section=verification-queue' }
      }
    };

    const mock = eventMocks[type];
    await notificationService.sendNotification({
      userId: user.id,
      type,
      title: mock.title,
      message: mock.message,
      data: mock.data,
      userEmail: user.email
    });

    setIsSimulating(false);
  };

  const categories: { id: NotificationCategory | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: translate('allNotifications', 'All Notifications'), icon: Bell },
    { id: 'orders', label: translate('orders', 'Orders & Sales'), icon: ShoppingCart },
    { id: 'bookings', label: translate('bookings', 'Service Bookings'), icon: Calendar },
    { id: 'financials', label: translate('financials', 'Payments & Wallet'), icon: CreditCard },
    { id: 'messages', label: translate('messages', 'Messages'), icon: MessageSquare },
    { id: 'reviews_disputes', label: translate('reviewsAndDisputes', 'Disputes & Reviews'), icon: ShieldAlert },
    { id: 'verification', label: translate('verification', 'Verification & KYC'), icon: Award },
    { id: 'announcements', label: translate('announcements', 'Announcements'), icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/80 backdrop-blur-md p-6 rounded-2xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-headline tracking-tight text-foreground flex items-center gap-3">
                  {translate('notificationCenter', 'Notification Center')}
                  {unreadCount > 0 && (
                    <Badge variant="default" className="text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {unreadCount} {translate('unread', 'Unread')}
                    </Badge>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {translate('notificationCenterSub', 'Manage live alerts, order updates, booking statuses, payments, and system notices.')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead(activeCategory)}
                className="h-9 gap-1.5 text-xs font-semibold rounded-xl"
              >
                <CheckCheck className="h-4 w-4" />
                {translate('markAllRead', 'Mark all read')}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={clearReadNotifications}
              className="h-9 gap-1.5 text-xs font-semibold rounded-xl text-muted-foreground hover:text-destructive"
              title={translate('clearRead', 'Clear read notifications')}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{translate('clearRead', 'Clear Read')}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrefsOpen(true)}
              className="h-9 gap-1.5 text-xs font-semibold rounded-xl"
            >
              <Settings className="h-4 w-4" />
              <span>{translate('notificationPref', 'Preferences')}</span>
            </Button>

            {/* Test Simulation Trigger for all 17 event types */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>{translate('simulateEvent', 'Test Alerts (17 Types)')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                <div className="p-2 text-[11px] font-bold uppercase text-muted-foreground">Orders</div>
                <DropdownMenuItem onClick={() => simulateEvent('new_order')}>📦 New Order</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('order_accepted')}>✅ Order Accepted</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('order_rejected')}>⚠️ Order Rejected</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('order_cancelled')}>❌ Order Cancelled</DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2 text-[11px] font-bold uppercase text-muted-foreground">Financial & Escrow</div>
                <DropdownMenuItem onClick={() => simulateEvent('payment_completed')}>💳 Payment Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('payment_failed')}>⚠️ Payment Failed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('refund')}>💰 Refund Processed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('withdrawal_status')}>💸 Withdrawal Status</DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2 text-[11px] font-bold uppercase text-muted-foreground">Bookings</div>
                <DropdownMenuItem onClick={() => simulateEvent('booking_created')}>🗓️ Booking Created</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('booking_confirmed')}>🎉 Booking Confirmed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('booking_cancelled')}>⚠️ Booking Cancelled</DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2 text-[11px] font-bold uppercase text-muted-foreground">Engagement & KYC</div>
                <DropdownMenuItem onClick={() => simulateEvent('new_message')}>💬 New Message</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('new_review')}>⭐ New Review</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('new_dispute')}>🛡️ New Dispute</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('verification_approved')}>🎖️ Verification Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('verification_rejected')}>⚠️ Verification Rejected</DropdownMenuItem>
                <DropdownMenuItem onClick={() => simulateEvent('admin_announcement')}>📢 Admin Announcement</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Toolbar: Search, Status, Categories */}
        <div className="bg-card p-4 rounded-2xl border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={translate('searchNotifications', 'Search by title, message or reference ID...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 rtl:pr-9 rtl:pl-3 h-10 rounded-xl bg-muted/40 border-muted"
              />
            </div>

            {/* Read/Unread Segmented Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl self-stretch sm:self-auto justify-center">
              <Button
                variant={readStatusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReadStatusFilter('all')}
                className="h-8 text-xs font-semibold rounded-lg px-3"
              >
                {translate('all', 'All')}
              </Button>
              <Button
                variant={readStatusFilter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReadStatusFilter('unread')}
                className="h-8 text-xs font-semibold rounded-lg px-3"
              >
                {translate('unreadOnly', 'Unread')}
              </Button>
              <Button
                variant={readStatusFilter === 'read' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReadStatusFilter('read')}
                className="h-8 text-xs font-semibold rounded-lg px-3"
              >
                {translate('readOnly', 'Read')}
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = cat.id === 'all'
                ? notifications.length
                : notifications.filter(n => notificationService.getCategoryForType(n.type) === cat.id).length;

              return (
                <Button
                  key={cat.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "h-8 rounded-xl text-xs font-semibold whitespace-nowrap gap-1.5 px-3",
                    isActive ? "shadow-xs" : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className="text-[10px] px-1.5 py-0 rounded-full ml-1"
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(item => {
              const { icon: IconComp, color } = getNotificationIcon(item.type);

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "transition-all duration-200 hover:shadow-md overflow-hidden rounded-2xl border",
                    item.isRead
                      ? "bg-card/60 opacity-85 hover:opacity-100"
                      : "bg-card border-primary/30 shadow-xs ring-1 ring-primary/10"
                  )}
                >
                  <div className="p-4 sm:p-5 flex items-start gap-4">
                    {/* Left Icon */}
                    <div className={cn("p-3 rounded-2xl shrink-0 mt-0.5", color)}>
                      <IconComp className="h-5 w-5" />
                    </div>

                    {/* Middle Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className={cn("text-sm sm:text-base font-bold", !item.isRead ? "text-foreground" : "text-muted-foreground")}>
                            {item.title}
                          </h3>
                          {!item.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Metadata badges if present */}
                      {item.data && (item.data.referenceId || item.data.amount || item.data.status) && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-border/40 text-xs">
                          {item.data.referenceId && (
                            <Badge variant="outline" className="text-[11px] font-mono">
                              Ref: {item.data.referenceId}
                            </Badge>
                          )}
                          {item.data.amount && (
                            <Badge variant="secondary" className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {item.data.amount.toLocaleString()} {item.data.currency || 'DA'}
                            </Badge>
                          )}
                          {item.data.status && (
                            <Badge variant="outline" className="text-[11px] capitalize">
                              Status: {item.data.status}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      {item.data?.actionUrl && (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 rounded-xl text-xs font-semibold gap-1"
                          onClick={() => {
                            if (!item.isRead) markAsRead(item.id);
                            router.push(item.data!.actionUrl!);
                          }}
                        >
                          <span>{translate('view', 'View')}</span>
                          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </Button>
                      )}

                      {!item.isRead ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                          onClick={() => markAsRead(item.id)}
                          title={translate('markAsRead', 'Mark as read')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : null}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNotification(item.id)}
                        title={translate('delete', 'Delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 text-center rounded-2xl border-dashed">
              <div className="h-16 w-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {searchQuery
                  ? translate('noNotificationsFound', 'No matching notifications found')
                  : translate('noNotificationsYet', 'No notifications to display')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                {searchQuery
                  ? translate('tryDifferentSearch', 'Try adjusting your search terms or clearing active filters.')
                  : translate('notificationCenterEmptyDesc', 'You are all caught up! New orders, bookings, transactions, and announcements will appear here.')}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 rounded-xl text-xs"
                >
                  {translate('clearSearch', 'Clear Search')}
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
        preferences={preferences}
        onSave={updatePreferences}
      />
    </div>
  );
}
