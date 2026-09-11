import { supabase } from '@/lib/supabase';
import {
  NotificationEventType,
  NotificationCategory,
  NotificationItem,
  NotificationPreferences,
  SendNotificationParams,
  NotificationFilterOptions,
  NotificationSafeData
} from '@/types/notifications';
import { pushNotificationService } from './pushNotificationService';
import { emailNotificationService } from './emailNotificationService';

const NOTIFICATIONS_STORAGE_KEY = 'khidmatik_notifications_v2';
const PREFERENCES_STORAGE_KEY = 'khidmatik_notif_preferences';

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: '',
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  notifyOrders: true,
  notifyBookings: true,
  notifyPayments: true,
  notifyMessages: true,
  notifyReviews: true,
  notifyDisputes: true,
  notifyVerification: true,
  notifyWithdrawals: true,
  notifyAnnouncements: true,
  soundEnabled: true,
};

// Seed notifications for initial demo / testing
const INITIAL_SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'seed_notif_1',
    userId: 'current',
    type: 'new_order',
    title: 'New Order Received: #ORD-77610',
    message: 'A customer purchased "Modern LED Chandelier" for 12,500 DA.',
    data: { referenceId: 'ORD-77610', orderId: 'ORD-77610', amount: 12500, actionUrl: '/profile?tab=orders' },
    channel: 'all',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'seed_notif_2',
    userId: 'current',
    type: 'booking_confirmed',
    title: 'Service Booking Confirmed: Plumbing Visit',
    message: 'Craftsman Yassine Benali has accepted and scheduled your service appointment for tomorrow.',
    data: { referenceId: 'SRV-PLB-99887', bookingId: 'SRV-PLB-99887', actionUrl: '/profile' },
    channel: 'all',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'seed_notif_3',
    userId: 'current',
    type: 'payment_completed',
    title: 'Payment Secured in Escrow',
    message: 'Escrow deposit of 3,600 DA confirmed for order #ORD-11220.',
    data: { referenceId: 'TXN-90822', amount: 3600, actionUrl: '/profile?tab=wallet' },
    channel: 'in_app',
    isRead: true,
    readAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'seed_notif_4',
    userId: 'current',
    type: 'verification_approved',
    title: 'Account Verification Approved!',
    message: 'Your professional credentials have been verified. You now hold the Trusted Provider badge.',
    data: { actionUrl: '/profile' },
    channel: 'all',
    isRead: true,
    readAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'seed_notif_5',
    userId: 'current',
    type: 'admin_announcement',
    title: 'Welcome to Khidmatik v2.0 Centralized System',
    message: 'Real-time notifications, escrow protection, and multi-service management are now active nationwide across Algeria.',
    data: { actionUrl: '/app-roadmap' },
    channel: 'all',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

class NotificationService {
  /**
   * Maps an event type to its broader category for filtering
   */
  public getCategoryForType(type: NotificationEventType): NotificationCategory {
    switch (type) {
      case 'new_order':
      case 'order_accepted':
      case 'order_rejected':
      case 'order_cancelled':
        return 'orders';
      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
        return 'bookings';
      case 'payment_completed':
      case 'payment_failed':
      case 'refund':
      case 'withdrawal_status':
      case 'topup_request':
      case 'topup_approved':
      case 'topup_rejected':
      case 'topup_info_required':
      case 'withdrawal_request':
        return 'financials';
      case 'new_message':
        return 'messages';
      case 'new_review':
      case 'new_dispute':
        return 'reviews_disputes';
      case 'verification_approved':
      case 'verification_rejected':
      case 'verification_request':
        return 'verification';
      case 'admin_announcement':
      default:
        return 'announcements';
    }
  }

  /**
   * Sanitizes sensitive data before storage or transmission
   */
  private sanitizeData(data?: NotificationSafeData): NotificationSafeData {
    if (!data) return {};
    const sensitiveKeys = [
      'password',
      'secret',
      'pin',
      'cvv',
      'creditCard',
      'cardNumber',
      'token',
      'privateKey',
      'nationalIdRaw',
      'bankAccountPassword'
    ];

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        continue; // Omit sensitive field
      }
      clean[key] = value;
    }
    return clean;
  }

  /**
   * Checks if user preferences allow this notification
   */
  public isNotificationAllowed(prefs: NotificationPreferences, type: NotificationEventType): boolean {
    switch (type) {
      case 'new_order':
      case 'order_accepted':
      case 'order_rejected':
      case 'order_cancelled':
        return prefs.notifyOrders;
      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
        return prefs.notifyBookings;
      case 'payment_completed':
      case 'payment_failed':
      case 'refund':
      case 'topup_request':
      case 'topup_approved':
      case 'topup_rejected':
      case 'topup_info_required':
        return prefs.notifyPayments;
      case 'withdrawal_status':
      case 'withdrawal_request':
        return prefs.notifyWithdrawals;
      case 'new_message':
        return prefs.notifyMessages;
      case 'new_review':
        return prefs.notifyReviews;
      case 'new_dispute':
        return prefs.notifyDisputes;
      case 'verification_approved':
      case 'verification_rejected':
      case 'verification_request':
        return prefs.notifyVerification;
      case 'admin_announcement':
        return prefs.notifyAnnouncements;
      default:
        return true;
    }
  }

  /**
   * Send a centralized notification
   */
  public async sendNotification(params: SendNotificationParams): Promise<NotificationItem> {
    const { userId, type, title, message, userEmail } = params;
    const sanitizedData = this.sanitizeData(params.data);
    const channel = params.channel || 'all';

    const prefs = await this.getPreferences(userId);
    const isAllowed = this.isNotificationAllowed(prefs, type);

    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      type,
      title,
      message,
      data: sanitizedData,
      channel,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    if (!isAllowed) {
      console.info(`Notification of type ${type} suppressed by user preferences.`);
      return newNotif;
    }

    // 1. Insert into Supabase if connected
    try {
      const { data: dbItem, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: sanitizedData,
          channel,
          is_read: false
        })
        .select()
        .single();

      if (dbItem && !error) {
        newNotif.id = dbItem.id;
        newNotif.createdAt = dbItem.created_at;
      }
    } catch (err) {
      console.warn('Supabase notification insert fallback to local storage:', err);
    }

    // 2. Persist to local cache for instant UI feedback
    this.saveToLocalCache(newNotif);

    // 3. Dispatch Browser Push if enabled
    if (prefs.pushEnabled && (channel === 'push' || channel === 'all')) {
      pushNotificationService.showLocalNotification(newNotif);
    }

    // 4. Dispatch Email if enabled
    if (prefs.emailEnabled && (channel === 'email' || channel === 'all') && userEmail) {
      emailNotificationService.sendEmail(userEmail, type, title, message, sanitizedData);
    }

    // 5. Notify all active listeners in the client
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: newNotif }));
    }

    return newNotif;
  }

  /**
   * Fetch notifications with filtering and search
   */
  public async getNotifications(
    userId: string,
    options: NotificationFilterOptions = {}
  ): Promise<NotificationItem[]> {
    let list: NotificationItem[] = [];

    // Try Supabase first
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.isRead !== undefined) {
        query = query.eq('is_read', options.isRead);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (data && !error && data.length > 0) {
        list = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          type: d.type as NotificationEventType,
          title: d.title,
          message: d.message,
          data: d.data || {},
          channel: d.channel,
          isRead: d.is_read,
          readAt: d.read_at,
          createdAt: d.created_at
        }));
      }
    } catch (e) {
      console.warn('Could not load notifications from Supabase, loading from cache:', e);
    }

    // Merge with local cache
    const localList = this.getLocalCache(userId);
    const mergedMap = new Map<string, NotificationItem>();

    list.forEach(item => mergedMap.set(item.id, item));
    localList.forEach(item => {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });

    let result = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply category filter
    if (options.category && options.category !== 'all') {
      result = result.filter(n => this.getCategoryForType(n.type) === options.category);
    }

    // Apply type filter
    if (options.type) {
      result = result.filter(n => n.type === options.type);
    }

    // Apply read filter if requested
    if (options.isRead !== undefined) {
      result = result.filter(n => n.isRead === options.isRead);
    }

    // Apply search filter
    if (options.searchTerm && options.searchTerm.trim()) {
      const term = options.searchTerm.toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(term) ||
          n.message.toLowerCase().includes(term) ||
          (n.data?.referenceId && n.data.referenceId.toLowerCase().includes(term))
      );
    }

    return result;
  }

  /**
   * Get unread notification count
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const notifs = await this.getNotifications(userId, { isRead: false });
    return notifs.length;
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    const readAt = new Date().toISOString();

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: readAt })
        .eq('id', notificationId)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Error updating read status in DB:', e);
    }

    // Update local cache
    const local = this.getLocalCache(userId);
    const updated = local.map(n =>
      n.id === notificationId ? { ...n, isRead: true, readAt } : n
    );
    this.saveAllLocalCache(userId, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: { id: notificationId, isRead: true } }));
    }
  }

  /**
   * Mark all notifications as read for a user (optionally within a category)
   */
  public async markAllAsRead(userId: string, category?: NotificationCategory | 'all'): Promise<void> {
    const readAt = new Date().toISOString();

    try {
      let query = supabase
        .from('notifications')
        .update({ is_read: true, read_at: readAt })
        .eq('user_id', userId)
        .eq('is_read', false);

      await query;
    } catch (e) {
      console.warn('Error marking all as read in DB:', e);
    }

    // Update local cache
    const local = this.getLocalCache(userId);
    const updated = local.map(n => {
      if (category && category !== 'all' && this.getCategoryForType(n.type) !== category) {
        return n;
      }
      return { ...n, isRead: true, readAt };
    });
    this.saveAllLocalCache(userId, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: { markAll: true } }));
    }
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Error deleting notification in DB:', e);
    }

    const local = this.getLocalCache(userId);
    const updated = local.filter(n => n.id !== notificationId);
    this.saveAllLocalCache(userId, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: { deletedId: notificationId } }));
    }
  }

  /**
   * Clear all read notifications
   */
  public async clearReadNotifications(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);
    } catch (e) {
      console.warn('Error clearing read notifications in DB:', e);
    }

    const local = this.getLocalCache(userId);
    const updated = local.filter(n => !n.isRead);
    this.saveAllLocalCache(userId, updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: { clearedRead: true } }));
    }
  }

  /**
   * Get user preferences
   */
  public async getPreferences(userId: string): Promise<NotificationPreferences> {
    if (!userId) return { ...DEFAULT_PREFERENCES, userId: '' };

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && !error) {
        return {
          userId: data.user_id,
          emailEnabled: data.email_enabled,
          pushEnabled: data.push_enabled,
          inAppEnabled: data.in_app_enabled,
          notifyOrders: data.notify_orders,
          notifyBookings: data.notify_bookings,
          notifyPayments: data.notify_payments,
          notifyMessages: data.notify_messages,
          notifyReviews: data.notify_reviews,
          notifyDisputes: data.notify_disputes,
          notifyVerification: data.notify_verification,
          notifyWithdrawals: data.notify_withdrawals,
          notifyAnnouncements: data.notify_announcements,
          soundEnabled: data.sound_enabled ?? true
        };
      }
    } catch (e) {
      console.warn('Error fetching preferences from Supabase:', e);
    }

    // Check LocalStorage fallback
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${PREFERENCES_STORAGE_KEY}_${userId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }

    return { ...DEFAULT_PREFERENCES, userId };
  }

  /**
   * Update user preferences
   */
  public async updatePreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferences = { ...current, ...prefs, userId };

    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          email_enabled: updated.emailEnabled,
          push_enabled: updated.pushEnabled,
          in_app_enabled: updated.inAppEnabled,
          notify_orders: updated.notifyOrders,
          notify_bookings: updated.notifyBookings,
          notify_payments: updated.notifyPayments,
          notify_messages: updated.notifyMessages,
          notify_reviews: updated.notifyReviews,
          notify_disputes: updated.notifyDisputes,
          notify_verification: updated.notifyVerification,
          notify_withdrawals: updated.notifyWithdrawals,
          notify_announcements: updated.notifyAnnouncements,
          sound_enabled: updated.soundEnabled
        });
    } catch (e) {
      console.warn('Error updating preferences in DB:', e);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${PREFERENCES_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
    }

    return updated;
  }

  /**
   * Broadcast an admin announcement
   */
  public async broadcastAdminAnnouncement(
    title: string,
    message: string,
    actionUrl: string = '/app-roadmap'
  ): Promise<void> {
    const item: SendNotificationParams = {
      userId: 'all',
      type: 'admin_announcement',
      title,
      message,
      data: { actionUrl },
      channel: 'all'
    };

    // Save as system notification
    this.sendNotification(item);
  }

  // --- Local Cache Helpers ---
  public getRelatedUserIds(userId?: string | null): string[] {
    if (!userId) return ['guest'];
    const trimmed = userId.trim();
    const ids = new Set<string>([trimmed]);

    // Handle Ahmad Benali / user_1534d1e7 alias mapping
    if (trimmed === 'user_1534d1e7' || trimmed.startsWith('1534d1e7')) {
      ids.add('user_1534d1e7');
      ids.add('1534d1e7-93d2-45f3-94af-180b06fce8a2');
      ids.add('currentUser');
    }

    return Array.from(ids);
  }

  private getLocalCache(userId: string): NotificationItem[] {
    if (typeof window === 'undefined') return INITIAL_SEED_NOTIFICATIONS;

    const relatedIds = this.getRelatedUserIds(userId);
    // Also include broadcast channel 'all'
    if (!relatedIds.includes('all')) {
      relatedIds.push('all');
    }

    const mergedMap = new Map<string, NotificationItem>();

    // Load initial seeds if primary key empty
    const primaryKey = `${NOTIFICATIONS_STORAGE_KEY}_${userId || 'guest'}`;
    if (!localStorage.getItem(primaryKey)) {
      INITIAL_SEED_NOTIFICATIONS.forEach(item => mergedMap.set(item.id, item));
    }

    relatedIds.forEach(id => {
      const key = `${NOTIFICATIONS_STORAGE_KEY}_${id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((n: NotificationItem) => {
              if (n && n.id && !mergedMap.has(n.id)) {
                mergedMap.set(n.id, n);
              }
            });
          }
        } catch {}
      }
    });

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private saveToLocalCache(item: NotificationItem): void {
    if (typeof window === 'undefined') return;

    const targetIds = this.getRelatedUserIds(item.userId);
    targetIds.forEach(targetId => {
      const key = `${NOTIFICATIONS_STORAGE_KEY}_${targetId}`;
      let currentList: NotificationItem[] = [];
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          currentList = JSON.parse(raw);
          if (!Array.isArray(currentList)) currentList = [];
        } catch {
          currentList = [];
        }
      }
      const updated = [item, ...currentList.filter(n => n.id !== item.id)];
      localStorage.setItem(key, JSON.stringify(updated));
    });
  }

  private saveAllLocalCache(userId: string, items: NotificationItem[]): void {
    if (typeof window === 'undefined') return;
    const targetIds = this.getRelatedUserIds(userId);
    targetIds.forEach(targetId => {
      const key = `${NOTIFICATIONS_STORAGE_KEY}_${targetId}`;
      localStorage.setItem(key, JSON.stringify(items));
    });
  }
}

export const notificationService = new NotificationService();
