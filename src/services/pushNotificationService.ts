import { supabase } from '@/lib/supabase';
import { PushSubscriptionPayload, NotificationItem } from '@/types/notifications';

class PushNotificationService {
  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Request permission from the user for Browser Push notifications
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Web Push Notifications are not supported in this browser.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check current notification permission status
   */
  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Register service worker and subscribe to Push notifications
   */
  public async registerAndSubscribe(userId: string): Promise<PushSubscriptionPayload | null> {
    if (!this.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Optional: If VAPID key is configured in env, subscribe through PushManager
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      let subscription: PushSubscription | null = null;
      if (vapidPublicKey && registration.pushManager) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      if (subscription) {
        const subJson = subscription.toJSON();
        const payload: PushSubscriptionPayload = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || ''
          }
        };

        // Save to Supabase push_subscriptions table
        await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          endpoint: payload.endpoint,
          p256dh: payload.keys.p256dh,
          auth: payload.keys.auth,
          user_agent: navigator.userAgent
        }, { onConflict: 'endpoint' });

        return payload;
      }

      return null;
    } catch (err) {
      console.error('Failed to subscribe user to Web Push:', err);
      return null;
    }
  }

  /**
   * Show a local browser notification directly if permission is granted
   */
  public showLocalNotification(notif: NotificationItem): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      const options: NotificationOptions = {
        body: notif.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notif.id,
        data: notif.data
      };

      const notification = new Notification(notif.title, options);
      notification.onclick = () => {
        window.focus();
        if (notif.data?.actionUrl) {
          window.location.href = notif.data.actionUrl;
        }
        notification.close();
      };
    } catch (e) {
      console.error('Error displaying local browser notification:', e);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
