'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  NotificationItem,
  NotificationPreferences,
  NotificationCategory,
  NotificationFilterOptions
} from '@/types/notifications';
import { notificationService, DEFAULT_PREFERENCES } from '@/services/notificationService';

export function useNotifications(initialFilters: NotificationFilterOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id || 'guest';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<NotificationFilterOptions>(initialFilters);

  // Play subtle chime sound if enabled
  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }, []);

  // Fetch notifications and preferences
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, prefs] = await Promise.all([
        notificationService.getNotifications(userId, filters),
        notificationService.getPreferences(userId)
      ]);
      setNotifications(list);
      setPreferences(prefs);
      const unread = list.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime Subscription & Custom Event Listener
  useEffect(() => {
    if (!userId || userId === 'guest') return;

    // 1. Supabase Realtime Channel
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as any;
            const item: NotificationItem = {
              id: newNotif.id,
              userId: newNotif.user_id,
              type: newNotif.type,
              title: newNotif.title,
              message: newNotif.message,
              data: newNotif.data || {},
              channel: newNotif.channel,
              isRead: newNotif.is_read,
              readAt: newNotif.read_at,
              createdAt: newNotif.created_at
            };

            setNotifications(prev => [item, ...prev.filter(n => n.id !== item.id)]);
            setUnreadCount(prev => prev + 1);

            if (preferences.inAppEnabled) {
              toast({
                title: item.title,
                description: item.message,
              });
            }

            if (preferences.soundEnabled) {
              playChime();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setNotifications(prev =>
              prev.map(n =>
                n.id === updated.id
                  ? { ...n, isRead: updated.is_read, readAt: updated.read_at }
                  : n
              )
            );
            setUnreadCount(prev => Math.max(0, prev - (updated.is_read ? 1 : 0)));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as any;
            setNotifications(prev => prev.filter(n => n.id !== old.id));
          }
        }
      )
      .subscribe();

    // 2. Window Custom Event Listener for local mutations
    const handleLocalUpdate = (e: any) => {
      if (e?.detail && e.detail.title && e.detail.message && !e.detail.deletedId && !e.detail.markAll) {
        const item = e.detail as NotificationItem;
        const related = notificationService.getRelatedUserIds(userId);
        const isForMe =
          item.userId === 'all' ||
          related.includes(item.userId) ||
          (userId === 'admin' && (item.userId === 'admin' || item.type === 'topup_request'));

        if (isForMe) {
          if (preferences.inAppEnabled) {
            toast({
              title: item.title,
              description: item.message,
            });
          }
          if (preferences.soundEnabled) {
            playChime();
          }
        }
      }
      fetchNotifications();
    };

    window.addEventListener('khidmatik_notif_update', handleLocalUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('khidmatik_notif_update', handleLocalUpdate);
    };
  }, [userId, preferences.inAppEnabled, preferences.soundEnabled, playChime, toast, fetchNotifications]);

  // Actions
  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id, userId);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async (category?: NotificationCategory | 'all') => {
    await notificationService.markAllAsRead(userId, category);
    setNotifications(prev =>
      prev.map(n => {
        if (category && category !== 'all' && notificationService.getCategoryForType(n.type) !== category) {
          return n;
        }
        return { ...n, isRead: true, readAt: new Date().toISOString() };
      })
    );
    if (!category || category === 'all') {
      setUnreadCount(0);
    } else {
      setUnreadCount(
        notifications.filter(n => !n.isRead && notificationService.getCategoryForType(n.type) !== category).length
      );
    }
  };

  const deleteNotification = async (id: string) => {
    await notificationService.deleteNotification(id, userId);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearReadNotifications = async () => {
    await notificationService.clearReadNotifications(userId);
    setNotifications(prev => prev.filter(n => !n.isRead));
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = await notificationService.updatePreferences(userId, newPrefs);
    setPreferences(updated);
    toast({
      title: 'Preferences Updated',
      description: 'Your notification channels and alerts have been saved.'
    });
  };

  return {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    updatePreferences,
    refresh: fetchNotifications
  };
}
