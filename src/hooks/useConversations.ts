'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Conversation, ActiveChatFilter, ConversationType, ParticipantRole, ConversationContextType } from '@/types/messaging';
import { messagingService } from '@/services/messagingService';

export function useConversations(initialFilter: ActiveChatFilter = 'all') {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveChatFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Total unread count across all conversations
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  }, [conversations]);

  // Load conversations
  const refreshConversations = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      const list = await messagingService.getConversations(userId, 'all');
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Realtime subscription for conversation updates and participant unread changes
  useEffect(() => {
    if (!userId || userId === 'guest') return;

    const channelName = `user-conversations-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          refreshConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshConversations]);

  // Filtered and searched list
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // 1. Tab filter
      if (activeFilter === 'customer_store' && conv.type !== 'customer_store') return false;
      if (activeFilter === 'customer_provider' && conv.type !== 'customer_provider') return false;
      if (activeFilter === 'customer_support' && conv.type !== 'customer_support') return false;
      if (activeFilter === 'unread' && conv.unreadCount === 0) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const otherName = conv.otherParticipant?.name?.toLowerCase() || '';
        const title = conv.title?.toLowerCase() || '';
        const lastMsg = conv.lastMessageText?.toLowerCase() || '';
        const contextTitle = conv.contextDetails?.title?.toLowerCase() || '';

        return otherName.includes(query) || 
               title.includes(query) || 
               lastMsg.includes(query) || 
               contextTitle.includes(query);
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  // Start new conversation helper
  const startConversation = async (params: {
    targetUserId: string;
    type?: ConversationType;
    contextType?: ConversationContextType;
    contextId?: string;
    title?: string;
    targetRole?: ParticipantRole;
    contextDetails?: {
      title?: string;
      subtitle?: string;
      url?: string;
      price?: number;
      badge?: string;
    };
    initialMessage?: string;
  }) => {
    if (!userId || userId === 'guest') {
      return { conversationId: '', error: 'Please log in to message.' };
    }

    const result = await messagingService.createOrGetConversation({
      userId,
      ...params
    });

    if (result.conversationId) {
      await refreshConversations();
      setSelectedConversationId(result.conversationId);
    }

    return result;
  };

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    totalUnreadCount,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    selectedConversationId,
    setSelectedConversationId,
    refreshConversations,
    startConversation
  };
}
