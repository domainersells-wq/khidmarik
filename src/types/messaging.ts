export type ConversationType = 
  | 'customer_store' 
  | 'customer_provider' 
  | 'customer_support' 
  | 'direct';

export type ConversationContextType = 
  | 'store' 
  | 'provider' 
  | 'order' 
  | 'booking' 
  | 'dispute' 
  | 'support_ticket' 
  | 'general';

export type ParticipantRole = 
  | 'customer' 
  | 'store_owner' 
  | 'service_provider' 
  | 'support_agent' 
  | 'admin' 
  | 'participant';

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'file' 
  | 'system' 
  | 'quote_request' 
  | 'location';

export type MessageStatus = 
  | 'sending' 
  | 'sent' 
  | 'delivered' 
  | 'read';

export interface MessageAttachment {
  id?: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  fileType: 'image' | 'file' | 'audio';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: ParticipantRole;
  content: string;
  messageType: MessageType;
  attachments: MessageAttachment[];
  status: MessageStatus;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  replyToId?: string;
  replyToMessage?: {
    id: string;
    content: string;
    senderName?: string;
    messageType: MessageType;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  name: string;
  email?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  isVerified?: boolean;
  lastReadAt: string;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  isStarred: boolean;
  joinedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  contextType: ConversationContextType;
  contextId?: string;
  contextDetails?: {
    title?: string;
    subtitle?: string;
    url?: string;
    price?: number;
    badge?: string;
  };
  createdBy?: string;
  lastMessageAt: string;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  isArchived: boolean;
  isLocked: boolean;
  participants: ConversationParticipant[];
  otherParticipant?: ConversationParticipant;
  unreadCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: string;
}

export type ReportReason = 
  | 'spam' 
  | 'harassment' 
  | 'fraud' 
  | 'inappropriate_content' 
  | 'off_platform_payment' 
  | 'other';

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  messageId?: string;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string;
  statusMessage?: string;
}

export interface TypingState {
  conversationId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
}

export type ActiveChatFilter = 
  | 'all' 
  | 'customer_store' 
  | 'customer_provider' 
  | 'customer_support' 
  | 'unread';
