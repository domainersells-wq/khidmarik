import { supabase } from '@/lib/supabase';
import { 
  Conversation, 
  ConversationParticipant, 
  Message, 
  MessageAttachment, 
  MessageType, 
  ConversationType, 
  ConversationContextType, 
  ParticipantRole, 
  ReportReason, 
  ActiveChatFilter,
  UserBlock,
  UserReport
} from '@/types/messaging';

// Helper to format fallback participants
function formatDefaultParticipant(userId: string, role: ParticipantRole = 'participant'): ConversationParticipant {
  return {
    id: `part_${userId}`,
    conversationId: '',
    userId,
    role,
    name: 'User',
    email: '',
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${userId}`,
    isOnline: false,
    lastSeenAt: new Date().toISOString(),
    isVerified: false,
    lastReadAt: new Date().toISOString(),
    unreadCount: 0,
    isMuted: false,
    isArchived: false,
    isStarred: false,
    joinedAt: new Date().toISOString(),
  };
}

export const messagingService = {
  /**
   * Fetch all conversations for a user with optional role/unread filtering
   */
  async getConversations(userId: string, filter: ActiveChatFilter = 'all'): Promise<Conversation[]> {
    if (!userId || userId === 'guest') return [];

    try {
      // 1. Get conversation IDs where user is a participant
      const { data: participantRows, error: partErr } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('user_id', userId);

      if (partErr) {
        console.warn('Error fetching participant rows, falling back:', partErr.message);
        return [];
      }

      if (!participantRows || participantRows.length === 0) {
        return [];
      }

      const convIds = participantRows.map(p => p.conversation_id);

      // 2. Fetch the conversations
      let query = supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('last_message_at', { ascending: false });

      if (filter === 'customer_store') {
        query = query.eq('type', 'customer_store');
      } else if (filter === 'customer_provider') {
        query = query.eq('type', 'customer_provider');
      } else if (filter === 'customer_support') {
        query = query.eq('type', 'customer_support');
      }

      const { data: convData, error: convErr } = await query;
      if (convErr) throw convErr;

      // 3. Fetch all participants for these conversations to map profiles
      const { data: allParticipants, error: allPartErr } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:profiles(id, name, email, avatar_url, role, is_verified)
        `)
        .in('conversation_id', convIds);

      if (allPartErr) console.warn('Error fetching all participants:', allPartErr.message);

      // Map everything together
      const result: Conversation[] = (convData || []).map((c: any) => {
        const myPart = participantRows.find(p => p.conversation_id === c.id);
        const convParts = (allParticipants || []).filter((p: any) => p.conversation_id === c.id);

        const mappedParts: ConversationParticipant[] = convParts.map((p: any) => {
          const profile = p.user || {};
          return {
            id: p.id,
            conversationId: p.conversation_id,
            userId: p.user_id,
            role: (p.role || 'participant') as ParticipantRole,
            name: profile.name || (p.user_id === userId ? 'You' : 'User'),
            email: profile.email || '',
            avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || p.user_id}`,
            isVerified: !!profile.is_verified,
            lastReadAt: p.last_read_at,
            unreadCount: p.unread_count || 0,
            isMuted: !!p.is_muted,
            isArchived: !!p.is_archived,
            isStarred: !!p.is_starred,
            joinedAt: p.joined_at,
          };
        });

        // Find counterpart participant
        const other = mappedParts.find(p => p.userId !== userId) || mappedParts[0];

        return {
          id: c.id,
          type: (c.type || 'direct') as ConversationType,
          title: c.title,
          contextType: (c.context_type || 'general') as ConversationContextType,
          contextId: c.context_id,
          contextDetails: c.metadata?.contextDetails,
          createdBy: c.created_by,
          lastMessageAt: c.last_message_at,
          lastMessageText: c.last_message_text || '',
          lastMessageSenderId: c.last_message_sender_id,
          isArchived: !!myPart?.is_archived || !!c.is_archived,
          isLocked: !!c.is_locked,
          participants: mappedParts,
          otherParticipant: other,
          unreadCount: myPart?.unread_count || 0,
          metadata: c.metadata || {},
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        };
      });

      if (filter === 'unread') {
        return result.filter(c => c.unreadCount > 0);
      }

      return result;
    } catch (err) {
      console.error('getConversations exception:', err);
      return [];
    }
  },

  /**
   * Fetch single conversation details with all participants
   */
  async getConversationById(convId: string, userId: string): Promise<Conversation | null> {
    if (!convId) return null;

    try {
      const { data: c, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .maybeSingle();

      if (convErr || !c) return null;

      const { data: convParts, error: partErr } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:profiles(id, name, email, avatar_url, role, is_verified)
        `)
        .eq('conversation_id', convId);

      if (partErr) console.warn('Error fetching participants for conversation:', partErr.message);

      const mappedParts: ConversationParticipant[] = (convParts || []).map((p: any) => {
        const profile = p.user || {};
        return {
          id: p.id,
          conversationId: p.conversation_id,
          userId: p.user_id,
          role: (p.role || 'participant') as ParticipantRole,
          name: profile.name || (p.user_id === userId ? 'You' : 'User'),
          email: profile.email || '',
          avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || p.user_id}`,
          isVerified: !!profile.is_verified,
          lastReadAt: p.last_read_at,
          unreadCount: p.unread_count || 0,
          isMuted: !!p.is_muted,
          isArchived: !!p.is_archived,
          isStarred: !!p.is_starred,
          joinedAt: p.joined_at,
        };
      });

      const myPart = mappedParts.find(p => p.userId === userId);
      const other = mappedParts.find(p => p.userId !== userId) || mappedParts[0];

      return {
        id: c.id,
        type: (c.type || 'direct') as ConversationType,
        title: c.title,
        contextType: (c.context_type || 'general') as ConversationContextType,
        contextId: c.context_id,
        contextDetails: c.metadata?.contextDetails,
        createdBy: c.created_by,
        lastMessageAt: c.last_message_at,
        lastMessageText: c.last_message_text || '',
        lastMessageSenderId: c.last_message_sender_id,
        isArchived: !!myPart?.isArchived || !!c.is_archived,
        isLocked: !!c.is_locked,
        participants: mappedParts,
        otherParticipant: other,
        unreadCount: myPart?.unreadCount || 0,
        metadata: c.metadata || {},
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    } catch (err) {
      console.error('getConversationById exception:', err);
      return null;
    }
  },

  /**
   * Create or Retrieve 1-to-1 conversation atomic function
   */
  async createOrGetConversation(params: {
    userId: string;
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
  }): Promise<{ conversationId: string; error?: string }> {
    const {
      userId,
      targetUserId,
      type = 'direct',
      contextType = 'general',
      contextId = null,
      title = null,
      targetRole = 'participant',
      contextDetails,
      initialMessage
    } = params;

    if (!userId || userId === 'guest') {
      return { conversationId: '', error: 'Please log in to send messages.' };
    }

    if (userId === targetUserId) {
      return { conversationId: '', error: 'Cannot start conversation with yourself.' };
    }

    try {
      // 1. Try invoking PostgreSQL stored function
      const { data: convId, error: rpcErr } = await supabase.rpc(
        'create_or_get_direct_conversation',
        {
          p_target_user_id: targetUserId,
          p_type: type,
          p_context_type: contextType,
          p_context_id: contextId,
          p_title: title,
          p_target_role: targetRole
        }
      );

      if (rpcErr) {
        console.warn('RPC create_or_get_direct_conversation failed, executing client fallback:', rpcErr.message);
        
        // Client Fallback: Check existing conversation
        const { data: myConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId);

        const convIds = (myConvs || []).map(c => c.conversation_id);

        if (convIds.length > 0) {
          const { data: targetConvs } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', targetUserId)
            .in('conversation_id', convIds);

          if (targetConvs && targetConvs.length > 0) {
            const existingId = targetConvs[0].conversation_id;
            if (initialMessage) {
              await this.sendMessage({
                conversationId: existingId,
                senderId: userId,
                content: initialMessage
              });
            }
            return { conversationId: existingId };
          }
        }

        // Insert new conversation
        const { data: newConv, error: insertConvErr } = await supabase
          .from('conversations')
          .insert({
            type,
            title,
            context_type: contextType,
            context_id: contextId,
            created_by: userId,
            metadata: contextDetails ? { contextDetails } : {}
          })
          .select('id')
          .single();

        if (insertConvErr || !newConv) {
          throw insertConvErr || new Error('Failed to create conversation');
        }

        const newId = newConv.id;

        // Insert both participants
        await supabase.from('conversation_participants').insert([
          { conversation_id: newId, user_id: userId, role: 'customer' },
          { conversation_id: newId, user_id: targetUserId, role: targetRole }
        ]);

        if (initialMessage) {
          await this.sendMessage({
            conversationId: newId,
            senderId: userId,
            content: initialMessage
          });
        }

        return { conversationId: newId };
      }

      // If RPC succeeded
      if (contextDetails && convId) {
        await supabase
          .from('conversations')
          .update({ metadata: { contextDetails } })
          .eq('id', convId);
      }

      if (initialMessage && convId) {
        await this.sendMessage({
          conversationId: convId,
          senderId: userId,
          content: initialMessage
        });
      }

      return { conversationId: convId };
    } catch (err: any) {
      console.error('createOrGetConversation error:', err);
      return { conversationId: '', error: err.message || 'Failed to initialize conversation.' };
    }
  },

  /**
   * Fetch messages for a conversation
   */
  async getMessages(convId: string, limit: number = 100): Promise<Message[]> {
    if (!convId) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(name, avatar_url, role),
          reply_to:messages(id, content, message_type, sender:profiles(name))
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: m.sender?.name || 'User',
        senderAvatar: m.sender?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${m.sender?.name || m.sender_id}`,
        senderRole: (m.sender?.role || 'participant') as ParticipantRole,
        content: m.is_deleted ? 'This message was deleted' : m.content,
        messageType: (m.message_type || 'text') as MessageType,
        attachments: Array.isArray(m.attachments) ? m.attachments : [],
        status: (m.status || 'sent'),
        isDeleted: !!m.is_deleted,
        deletedAt: m.deleted_at,
        deletedBy: m.deleted_by,
        replyToId: m.reply_to_id,
        replyToMessage: m.reply_to ? {
          id: m.reply_to.id,
          content: m.reply_to.content,
          senderName: m.reply_to.sender?.name || 'User',
          messageType: m.reply_to.message_type
        } : undefined,
        metadata: m.metadata || {},
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
    } catch (err) {
      console.error('getMessages error:', err);
      return [];
    }
  },

  /**
   * Send a new message to a conversation
   */
  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: MessageType;
    attachments?: MessageAttachment[];
    replyToId?: string;
    metadata?: Record<string, any>;
  }): Promise<{ message?: Message; error?: string }> {
    const {
      conversationId,
      senderId,
      content,
      messageType = 'text',
      attachments = [],
      replyToId,
      metadata = {}
    } = params;

    if (!senderId || senderId === 'guest') {
      return { error: 'Please log in to send messages.' };
    }

    if (!conversationId) {
      return { error: 'Invalid conversation.' };
    }

    if (!content.trim() && attachments.length === 0) {
      return { error: 'Message cannot be empty.' };
    }

    try {
      const payload = {
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
        message_type: messageType,
        attachments: attachments,
        status: 'sent',
        reply_to_id: replyToId || null,
        metadata: metadata
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(payload)
        .select(`
          *,
          sender:profiles(name, avatar_url, role)
        `)
        .single();

      if (error) throw error;

      const newMsg: Message = {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        senderName: data.sender?.name || 'You',
        senderAvatar: data.sender?.avatar_url || '',
        senderRole: (data.sender?.role || 'participant') as ParticipantRole,
        content: data.content,
        messageType: (data.message_type || 'text') as MessageType,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        status: 'sent',
        isDeleted: false,
        replyToId: data.reply_to_id,
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { message: newMsg };
    } catch (err: any) {
      console.error('sendMessage error:', err);
      return { error: err.message || 'Failed to send message.' };
    }
  },

  /**
   * Mark conversation as read for the user
   */
  async markConversationAsRead(convId: string, userId: string): Promise<void> {
    if (!convId || !userId || userId === 'guest') return;

    try {
      await supabase
        .from('conversation_participants')
        .update({
          last_read_at: new Date().toISOString(),
          unread_count: 0
        })
        .eq('conversation_id', convId)
        .eq('user_id', userId);
    } catch (err) {
      console.error('markConversationAsRead error:', err);
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!messageId || !userId) return { success: false, error: 'Invalid parameters' };

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          content: 'This message was deleted',
          attachments: []
        })
        .eq('id', messageId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('deleteMessage error:', err);
      return { success: false, error: err.message || 'Failed to delete message' };
    }
  },

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    if (!blockerId || !blockedId) return { success: false, error: 'Invalid parameters' };

    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
          reason: reason || 'User blocked from chat'
        });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('blockUser error:', err);
      return { success: false, error: err.message || 'Failed to block user' };
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<{ success: boolean; error?: string }> {
    if (!blockerId || !blockedId) return { success: false, error: 'Invalid parameters' };

    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('unblockUser error:', err);
      return { success: false, error: err.message || 'Failed to unblock user' };
    }
  },

  /**
   * Check if a block exists between two users
   */
  async checkIsBlocked(userA: string, userB: string): Promise<boolean> {
    if (!userA || !userB) return false;
    try {
      const { data } = await supabase
        .from('user_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`)
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  },

  /**
   * Submit report for a user or message
   */
  async reportUser(params: {
    reporterId: string;
    reportedUserId: string;
    conversationId?: string;
    messageId?: string;
    reason: ReportReason;
    description?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { reporterId, reportedUserId, conversationId, messageId, reason, description } = params;

    if (!reporterId || !reportedUserId) return { success: false, error: 'Invalid parameters' };

    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          conversation_id: conversationId || null,
          message_id: messageId || null,
          reason,
          description: description || null,
          status: 'pending'
        });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('reportUser error:', err);
      return { success: false, error: err.message || 'Failed to submit report' };
    }
  },

  /**
   * Upload image or file attachment to Supabase Storage with local fallback
   */
  async uploadAttachment(file: File, conversationId: string, userId: string): Promise<MessageAttachment> {
    const fileExt = file.name.split('.').pop() || 'dat';
    const fileName = `${conversationId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const isImage = file.type.startsWith('image/');
    const fileType = isImage ? 'image' : 'file';

    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        return {
          id: `att_${Date.now()}`,
          url: publicUrlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          fileType
        };
      }
    } catch (uploadErr) {
      console.warn('Storage upload error, converting to local data URI:', uploadErr);
    }

    // Fallback: Read as base64 data URI for instant preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: `att_${Date.now()}`,
          url: reader.result as string,
          name: file.name,
          size: file.size,
          type: file.type,
          fileType
        });
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Update presence in database
   */
  async updatePresence(userId: string, isOnline: boolean): Promise<void> {
    if (!userId || userId === 'guest') return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (err) {
      console.warn('Presence update error:', err);
    }
  }
};
