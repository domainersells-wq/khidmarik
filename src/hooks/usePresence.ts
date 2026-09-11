'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { messagingService } from '@/services/messagingService';

export function usePresence() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || userId === 'guest') return;

    // 1. Mark current user online in database
    messagingService.updatePresence(userId, true);

    // 2. Supabase Realtime Presence Channel
    const presenceChannel = supabase.channel(`online-users-room-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const userIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          userIds.add(key);
        });
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers((prev) => new Set(prev).add(key));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    // On unmount or page hide, mark offline
    const handleBeforeUnload = () => {
      messagingService.updatePresence(userId, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      messagingService.updatePresence(userId, false);
      supabase.removeChannel(presenceChannel);
    };
  }, [userId]);

  const isUserOnline = (checkUserId: string) => {
    return onlineUsers.has(checkUserId);
  };

  return {
    onlineUsers,
    isUserOnline,
  };
}
