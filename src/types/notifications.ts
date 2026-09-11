/**
 * Centralized Notification System Types for Khidmatik Super-App
 */

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'all';

// The 17 supported notification event types
export type NotificationEventType =
  // Orders
  | 'new_order'
  | 'order_accepted'
  | 'order_rejected'
  | 'order_cancelled'
  // Payments & Financials
  | 'payment_completed'
  | 'payment_failed'
  | 'refund'
  | 'withdrawal_status'
  | 'topup_request'
  | 'topup_approved'
  | 'topup_rejected'
  | 'topup_info_required'
  | 'withdrawal_request'
  // Bookings
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  // Messaging & Reviews
  | 'new_message'
  | 'new_review'
  | 'new_dispute'
  // Identity & Admin
  | 'verification_approved'
  | 'verification_rejected'
  | 'verification_request'
  | 'admin_announcement';

export type NotificationCategory =
  | 'orders'
  | 'bookings'
  | 'financials'
  | 'messages'
  | 'reviews_disputes'
  | 'verification'
  | 'announcements';

export interface NotificationSafeData {
  referenceId?: string;
  orderId?: string;
  bookingId?: string;
  disputeId?: string;
  withdrawalId?: string;
  conversationId?: string;
  storeId?: string;
  actionUrl?: string;
  amount?: number;
  currency?: string;
  customerName?: string;
  providerName?: string;
  senderName?: string;
  rating?: number;
  status?: string;
  reason?: string;
  // Generic safe attributes (never include passwords, CVVs, full ID cards, private tokens)
  [key: string]: any;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationEventType;
  title: string;
  message: string;
  data?: NotificationSafeData;
  channel?: NotificationChannel;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  notifyOrders: boolean;
  notifyBookings: boolean;
  notifyPayments: boolean;
  notifyMessages: boolean;
  notifyReviews: boolean;
  notifyDisputes: boolean;
  notifyVerification: boolean;
  notifyWithdrawals: boolean;
  notifyAnnouncements: boolean;
  soundEnabled: boolean;
  updatedAt?: string;
}

export interface SendNotificationParams {
  userId: string;
  type: NotificationEventType;
  title: string;
  message: string;
  data?: NotificationSafeData;
  channel?: NotificationChannel;
  // Optional override if sending to specific user email or push subscription
  userEmail?: string;
}

export interface NotificationFilterOptions {
  category?: NotificationCategory | 'all';
  type?: NotificationEventType;
  isRead?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface EmailNotificationTemplate {
  subject: string;
  headline: string;
  contentHtml: string;
  actionText?: string;
  actionUrl?: string;
}
