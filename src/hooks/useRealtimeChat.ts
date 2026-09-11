'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Message, 
  MessageAttachment, 
  MessageType, 
  Conversation,
  TypingState 
} from '@/types/messaging';
import { messagingService } from '@/services/messagingService';

export function useRealtimeChat(conversationId: string | null) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const userName = user?.name || 'User';

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTypingCounterpart, setIsTypingCounterpart] = useState<boolean>(false);
  const [typingUserName, setTypingUserName] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // 1. Fetch conversation details & initial messages
  const loadChatData = useCallback(async () => {
    if (!conversationId || !userId || userId === 'guest') {
      setConversation(null);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [convData, msgList] = await Promise.all([
        messagingService.getConversationById(conversationId, userId),
        messagingService.getMessages(conversationId)
      ]);

      setConversation(convData);
      setMessages(msgList);

      // Check block status
      if (convData?.otherParticipant?.userId) {
        const blocked = await messagingService.checkIsBlocked(userId, convData.otherParticipant.userId);
        setIsBlocked(blocked);
      }

      // Mark as read
      await messagingService.markConversationAsRead(conversationId, userId);
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  // 2. Realtime Postgres Changes & Broadcast Channel Subscription
  useEffect(() => {
    if (!conversationId || !userId || userId === 'guest') return;

    const channelName = `chat-room-${conversationId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // A. Listen for new/updated messages via postgres_changes
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const raw = payload.new as any;
            
            // Avoid duplicate if optimistic message was already processed
            setMessages(prev => {
              const existingIdx = prev.findIndex(m => m.id === raw.id || (m.id.startsWith('temp_') && m.content === raw.content && m.senderId === raw.sender_id));
              
              const newMsg: Message = {
                id: raw.id,
                conversationId: raw.conversation_id,
                senderId: raw.sender_id,
                senderName: raw.sender_id === userId ? userName : conversation?.otherParticipant?.name || 'User',
                senderAvatar: raw.sender_id === userId ? user?.avatarUrl : conversation?.otherParticipant?.avatarUrl,
                senderRole: raw.sender_id === userId ? 'customer' : conversation?.otherParticipant?.role || 'participant',
                content: raw.is_deleted ? 'This message was deleted' : raw.content,
                messageType: (raw.message_type || 'text') as MessageType,
                attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
                status: (raw.status || 'sent'),
                isDeleted: !!raw.is_deleted,
                replyToId: raw.reply_to_id,
                metadata: raw.metadata || {},
                createdAt: raw.created_at,
                updatedAt: raw.updated_at
              };

              if (existingIdx !== -1) {
                const copy = [...prev];
                copy[existingIdx] = newMsg;
                return copy;
              }
              return [...prev, newMsg];
            });

            // If message is from other user, mark as read
            if (raw.sender_id !== userId) {
              messagingService.markConversationAsRead(conversationId, userId);
            }
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as any;
            setMessages(prev =>
              prev.map(m =>
                m.id === raw.id
                  ? {
                      ...m,
                      content: raw.is_deleted ? 'This message was deleted' : raw.content,
                      isDeleted: !!raw.is_deleted,
                      deletedAt: raw.deleted_at,
                      status: raw.status || m.status,
                      attachments: Array.isArray(raw.attachments) ? raw.attachments : m.attachments,
                      updatedAt: raw.updated_at
                    }
                  : m
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const raw = payload.old as any;
            setMessages(prev => prev.filter(m => m.id !== raw.id));
          }
        }
      )
      // B. Listen for Typing broadcast events
      .on(
        'broadcast',
        { event: 'typing' },
        (payload: { payload: TypingState }) => {
          if (payload?.payload?.userId && payload.payload.userId !== userId) {
            setIsTypingCounterpart(payload.payload.isTyping);
            setTypingUserName(payload.payload.userName || 'Someone');

            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }

            if (payload.payload.isTyping) {
              typingTimeoutRef.current = setTimeout(() => {
                setIsTypingCounterpart(false);
              }, 3000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, userName, conversation?.otherParticipant, user?.avatarUrl]);

  // 3. Broadcast typing status
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !conversationId || !userId || userId === 'guest') return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        conversationId,
        userId,
        userName,
        isTyping
      }
    });
  }, [conversationId, userId, userName]);

  // 4. Send Message (with optimistic UI)
  const sendMessage = async (
    content: string, 
    attachments: MessageAttachment[] = [],
    messageType: MessageType = 'text'
  ) => {
    if (!conversationId || !userId || userId === 'guest') return;
    if (!content.trim() && attachments.length === 0) return;

    if (isBlocked) {
      alert('Cannot send messages in a blocked conversation.');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversationId,
      senderId: userId,
      senderName: userName,
      senderAvatar: user?.avatarUrl,
      senderRole: 'customer',
      content: content.trim(),
      messageType: attachments.length > 0 ? (attachments[0].fileType === 'image' ? 'image' : 'file') : messageType,
      attachments,
      status: 'sending',
      isDeleted: false,
      replyToId: replyingTo?.id,
      replyToMessage: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        senderName: replyingTo.senderName,
        messageType: replyingTo.messageType
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add optimistic message
    setMessages(prev => [...prev, optimisticMsg]);
    setIsSending(true);
    setReplyingTo(null);
    sendTypingIndicator(false);

    try {
      const result = await messagingService.sendMessage({
        conversationId,
        senderId: userId,
        content: content.trim(),
        messageType: optimisticMsg.messageType,
        attachments,
        replyToId: optimisticMsg.replyToId
      });

      if (result.error) {
        // Rollback on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        console.error('Send message failed:', result.error);
      } else if (result.message) {
        setMessages(prev =>
          prev.map(m => (m.id === tempId ? result.message! : m))
        );
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // 5. Delete Message (Soft delete)
  const deleteMessage = async (messageId: string) => {
    if (!userId || userId === 'guest') return;

    // Optimistic delete
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted', attachments: [] }
          : m
      )
    );

    await messagingService.deleteMessage(messageId, userId);
  };

  // 6. Block/Unblock Counterpart
  const toggleBlock = async () => {
    if (!conversation?.otherParticipant?.userId || !userId) return;
    const targetId = conversation.otherParticipant.userId;

    if (isBlocked) {
      await messagingService.unblockUser(userId, targetId);
      setIsBlocked(false);
    } else {
      await messagingService.blockUser(userId, targetId);
      setIsBlocked(true);
    }
  };

  return {
    conversation,
    messages,
    isLoading,
    isSending,
    isTypingCounterpart,
    typingUserName,
    replyingTo,
    setReplyingTo,
    isBlocked,
    toggleBlock,
    sendMessage,
    deleteMessage,
    sendTypingIndicator,
    reloadChat: loadChatData
  };
}
