'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  MoreVertical, 
  ShieldAlert, 
  UserX, 
  Check, 
  CheckCheck, 
  Trash2, 
  Reply, 
  ArrowLeft, 
  Store, 
  Briefcase, 
  Headphones, 
  MessagesSquare, 
  X, 
  Smile, 
  ExternalLink,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { usePresence } from '@/hooks/usePresence';
import { messagingService } from '@/services/messagingService';
import { ChatAttachmentPreview } from '@/components/chat/ChatAttachmentPreview';
import { ReportUserModal } from '@/components/chat/ReportUserModal';
import { BlockUserModal } from '@/components/chat/BlockUserModal';
import { Message, MessageAttachment, ActiveChatFilter, ConversationType } from '@/types/messaging';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-muted-foreground text-sm">Loading conversations...</div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const { isUserOnline } = usePresence();

  const urlConvId = searchParams.get('id');
  const targetUserId = searchParams.get('with');
  const targetType = searchParams.get('type') as ConversationType | null;

  // Conversations hook
  const {
    conversations,
    allConversations,
    totalUnreadCount,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading: isConversationsLoading,
    selectedConversationId,
    setSelectedConversationId,
    startConversation
  } = useConversations();

  // Active chat hook
  const {
    conversation: activeConv,
    messages,
    isLoading: isChatLoading,
    isSending,
    isTypingCounterpart,
    typingUserName,
    replyingTo,
    setReplyingTo,
    isBlocked,
    toggleBlock,
    sendMessage,
    deleteMessage,
    sendTypingIndicator
  } = useRealtimeChat(selectedConversationId);

  // Input states
  const [inputText, setInputText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileViewOpen, setIsMobileViewOpen] = useState(false);

  // Safety Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle URL query param selection or auto-creation
  useEffect(() => {
    if (urlConvId) {
      setSelectedConversationId(urlConvId);
      setIsMobileViewOpen(true);
    } else if (targetUserId && user?.id) {
      startConversation({
        targetUserId,
        type: targetType || 'direct'
      }).then(res => {
        if (res.conversationId) {
          setSelectedConversationId(res.conversationId);
          setIsMobileViewOpen(true);
        }
      });
    } else if (!selectedConversationId && conversations.length > 0 && window.innerWidth > 768) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [urlConvId, targetUserId, targetType, conversations.length, user?.id]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTypingCounterpart]);

  // File & Image upload handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImageOnly = false) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedConversationId || !user?.id) return;

    setIsUploading(true);
    try {
      const uploadedList: MessageAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 15 * 1024 * 1024) {
          toast({ title: 'File too large', description: 'Maximum file size is 15MB', variant: 'destructive' });
          continue;
        }
        const att = await messagingService.uploadAttachment(file, selectedConversationId, user.id);
        uploadedList.push(att);
      }
      setPendingAttachments(prev => [...prev, ...uploadedList]);
    } catch (err) {
      toast({ title: 'Failed to upload attachment', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  // Send message
  const handleSend = async () => {
    if ((!inputText.trim() && pendingAttachments.length === 0) || isSending || !selectedConversationId) return;

    const content = inputText;
    const attachments = [...pendingAttachments];

    setInputText('');
    setPendingAttachments([]);

    await sendMessage(content, attachments);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    sendTypingIndicator(e.target.value.length > 0);

    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Helper to format date headers
  const formatMessageDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return translate('today', 'Today');
    if (isYesterday(d)) return translate('yesterday', 'Yesterday');
    return format(d, 'MMMM d, yyyy');
  };

  // Format timestamp
  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Get role badge style and text
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'store_owner':
        return { label: translate('storeOwner', 'Store Owner'), icon: Store, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'service_provider':
        return { label: translate('serviceProvider', 'Provider'), icon: Briefcase, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'support_agent':
        return { label: translate('supportAgent', 'Support Agent'), icon: Headphones, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      default:
        return { label: translate('customer', 'Customer'), icon: Sparkles, color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="p-4 rounded-3xl bg-primary/10 text-primary w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <MessagesSquare className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">{translate('loginRequired', 'Login Required')}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {translate('loginToViewMessages', 'Please log in to your account to view your conversations and message sellers, providers, or support.')}
        </p>
        <Button onClick={() => router.push('/login')} className="rounded-xl px-6">
          {translate('login', 'Sign In')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 max-w-7xl">
      <div className="bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden h-[calc(100vh-8.5rem)] min-h-[580px] flex flex-col md:flex-row">
        
        {/* ========================================================================= */}
        {/* SIDEBAR: CONVERSATION LIST & FILTERS */}
        {/* ========================================================================= */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-slate-800 flex flex-col bg-slate-50/40 dark:bg-slate-950/40",
          isMobileViewOpen ? "hidden md:flex" : "flex"
        )}>
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {translate('messages', 'Messages')}
                </h1>
                {totalUnreadCount > 0 && (
                  <Badge variant="default" className="rounded-full px-2 py-0.5 text-xs bg-primary font-bold">
                    {totalUnreadCount}
                  </Badge>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute ltr:left-3 rtl:right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={translate('searchMessages', 'Search conversations...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ltr:pl-9 rtl:pr-9 rounded-xl h-9 text-xs bg-card border-slate-200 dark:border-slate-800 shadow-none focus-visible:ring-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute ltr:right-2.5 rtl:left-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
              {[
                { id: 'all', label: translate('all', 'All') },
                { id: 'customer_store', label: translate('stores', 'Stores') },
                { id: 'customer_provider', label: translate('services', 'Services') },
                { id: 'customer_support', label: translate('support', 'Support') },
                { id: 'unread', label: translate('unread', 'Unread') }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as ActiveChatFilter)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all select-none",
                    activeFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card text-muted-foreground border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
            {isConversationsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {translate('loading', 'Loading chats...')}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessagesSquare className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? translate('noResultsFound', 'No conversations match your search.') : translate('noConversationsYet', 'No conversations yet.')}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversationId === conv.id;
                const other = conv.otherParticipant;
                const isOnline = other ? isUserOnline(other.userId) : false;
                const roleBadge = getRoleBadge(other?.role);
                const RoleIcon = roleBadge.icon;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setIsMobileViewOpen(true);
                    }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all border",
                      isSelected
                        ? "bg-primary/10 border-primary/25 shadow-xs"
                        : "bg-card hover:bg-slate-100/70 dark:hover:bg-slate-900/60 border-transparent"
                    )}
                  >
                    {/* Avatar with Online Dot */}
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <AvatarImage src={other?.avatarUrl} alt={other?.name} />
                        <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-xs">
                          {other?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left rtl:text-right">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {other?.name || conv.title || 'Conversation'}
                          </h3>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                        </span>
                      </div>

                      {/* Context / Role Indicator */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 rounded-md font-semibold border flex items-center gap-1", roleBadge.color)}>
                          <RoleIcon className="h-2.5 w-2.5" />
                          {roleBadge.label}
                        </Badge>
                        {conv.contextDetails?.title && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            • {conv.contextDetails.title}
                          </span>
                        )}
                      </div>

                      {/* Last Message Snippet */}
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-xs truncate",
                          conv.unreadCount > 0
                            ? "font-bold text-slate-900 dark:text-slate-100"
                            : "text-muted-foreground"
                        )}>
                          {conv.lastMessageText || translate('noMessagesYet', 'No messages yet')}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge className="h-4.5 min-w-[1.125rem] px-1 rounded-full text-[10px] font-bold bg-primary text-white flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACTIVE CHAT MAIN AREA */}
        {/* ========================================================================= */}
        <div className={cn(
          "flex-1 flex flex-col bg-card relative",
          !isMobileViewOpen ? "hidden md:flex" : "flex"
        )}>
          {selectedConversationId && activeConv ? (
            <>
              {/* Top Chat Header */}
              <div className="p-3.5 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-card/80 backdrop-blur-xs z-10">
                <div className="flex items-center gap-3">
                  {/* Mobile Back button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileViewOpen(false)}
                    className="md:hidden h-8 w-8 rounded-xl text-slate-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  {/* Counterpart Avatar */}
                  <div className="relative">
                    <Avatar className="h-10 w-10 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <AvatarImage src={activeConv.otherParticipant?.avatarUrl} />
                      <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-xs">
                        {activeConv.otherParticipant?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {activeConv.otherParticipant && isUserOnline(activeConv.otherParticipant.userId) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                    )}
                  </div>

                  {/* Counterpart Details */}
                  <div className="text-left rtl:text-right">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {activeConv.otherParticipant?.name || 'User'}
                      </h2>
                      {(() => {
                        const badge = getRoleBadge(activeConv.otherParticipant?.role);
                        const Icon = badge.icon;
                        return (
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 rounded-md font-semibold border flex items-center gap-1", badge.color)}>
                            <Icon className="h-3 w-3" />
                            {badge.label}
                          </Badge>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      {activeConv.otherParticipant && isUserOnline(activeConv.otherParticipant.userId) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {translate('online', 'Online')}
                        </span>
                      ) : (
                        <span>{translate('offline', 'Offline')}</span>
                      )}
                      {activeConv.contextDetails?.title && (
                        <span>• {activeConv.contextDetails.title}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Header Actions Menu */}
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-600">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl text-xs w-48 font-sans">
                      {activeConv.contextDetails?.url && (
                        <DropdownMenuItem onClick={() => router.push(activeConv.contextDetails!.url!)} className="cursor-pointer">
                          <ExternalLink className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                          {translate('viewListing', 'View Listing / Context')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="text-rose-600 cursor-pointer">
                        <ShieldAlert className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                        {translate('reportUser', 'Report User')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsBlockModalOpen(true)} className="text-rose-600 cursor-pointer">
                        <UserX className="h-3.5 w-3.5 ltr:mr-2 rtl:ml-2" />
                        {isBlocked ? translate('unblockUser', 'Unblock User') : translate('blockUser', 'Block User')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Context Banner (if linked to order, service, or store) */}
              {activeConv.contextDetails && (
                <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 p-2.5 px-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {activeConv.contextDetails.title}
                      </span>
                      {activeConv.contextDetails.subtitle && (
                        <span className="text-muted-foreground ltr:ml-2 rtl:mr-2">
                          ({activeConv.contextDetails.subtitle})
                        </span>
                      )}
                    </div>
                  </div>
                  {activeConv.contextDetails.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(activeConv.contextDetails!.url!)}
                      className="h-7 text-[11px] rounded-lg px-2.5"
                    >
                      {translate('details', 'Details')}
                    </Button>
                  )}
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isChatLoading ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    {translate('loadingMessages', 'Loading messages...')}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 space-y-3 max-w-sm mx-auto">
                    <div className="p-3.5 rounded-2xl bg-primary/10 text-primary w-12 h-12 mx-auto flex items-center justify-center">
                      <MessagesSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {translate('startConversation', 'Start the Conversation')}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {translate('startConversationDesc', 'Send a message or attachment to get in touch directly.')}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === user.id;
                    const prevMsg = messages[index - 1];
                    const showDateHeader = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Date Divider */}
                        {showDateHeader && (
                          <div className="flex items-center justify-center my-3">
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[10px] font-semibold text-muted-foreground border border-slate-200/50 dark:border-slate-700/50 shadow-2xs">
                              {formatMessageDateHeader(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        {/* Message Row */}
                        <div className={cn("flex items-end gap-2 group", isMe ? "justify-end" : "justify-start")}>
                          {!isMe && (
                            <Avatar className="h-7 w-7 rounded-xl shrink-0 mb-1 border border-slate-200 dark:border-slate-800">
                              <AvatarImage src={msg.senderAvatar} />
                              <AvatarFallback className="rounded-xl text-[10px] bg-primary/10 text-primary">
                                {msg.senderName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={cn("max-w-[78%] sm:max-w-[65%] space-y-1 text-left rtl:text-right")}>
                            {/* Replying To Quote Banner */}
                            {msg.replyToMessage && (
                              <div className={cn(
                                "p-2 rounded-xl text-[11px] border ltr:border-l-4 rtl:border-r-4",
                                isMe 
                                  ? "bg-primary/20 border-white/40 text-white/90" 
                                  : "bg-slate-100 dark:bg-slate-800 border-primary text-slate-700 dark:text-slate-300"
                              )}>
                                <span className="font-bold block text-[10px] opacity-80">
                                  {msg.replyToMessage.senderName || 'Replied message'}
                                </span>
                                <p className="truncate">{msg.replyToMessage.content}</p>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div className={cn(
                              "p-3 rounded-2xl text-xs leading-relaxed transition-all shadow-xs",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-xs"
                                : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60",
                              msg.isDeleted && "italic opacity-70 bg-slate-100/50 dark:bg-slate-900/50 text-muted-foreground border border-dashed"
                            )}>
                              {/* Text content */}
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                              {/* Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <ChatAttachmentPreview attachments={msg.attachments} isOutgoing={isMe} />
                              )}

                              {/* Message Footer: Time + Status Ticks */}
                              <div className={cn(
                                "flex items-center gap-1 text-[10px] mt-1 pt-0.5",
                                isMe ? "justify-end text-white/80" : "justify-end text-muted-foreground"
                              )}>
                                <span>{formatTime(msg.createdAt)}</span>
                                {isMe && !msg.isDeleted && (
                                  <span>
                                    {msg.status === 'read' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-sky-200" />
                                    ) : msg.status === 'delivered' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-white/80" />
                                    ) : msg.status === 'sent' ? (
                                      <Check className="h-3.5 w-3.5 text-white/80" />
                                    ) : (
                                      <Clock className="h-3 w-3 animate-spin text-white/60" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Hover Actions (Reply, Delete) */}
                          <div className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1",
                            isMe ? "order-first" : ""
                          )}>
                            {!msg.isDeleted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setReplyingTo(msg)}
                                className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {isMe && !msg.isDeleted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMessage(msg.id)}
                                className="h-6 w-6 rounded-lg text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {isTypingCounterpart && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 animate-pulse">
                    <div className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                    </div>
                    <span className="text-[11px]">{typingUserName} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Replying Banner (if set) */}
              {replyingTo && (
                <div className="p-2 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Reply className="h-4 w-4 text-primary shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {translate('replyingTo', 'Replying to')} {replyingTo.senderName}:
                      </span>
                      <span className="text-muted-foreground ltr:ml-1.5 rtl:mr-1.5">
                        {replyingTo.content}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReplyingTo(null)}
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Pending Attachments Strip */}
              {pendingAttachments.length > 0 && (
                <div className="p-2 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                  {pendingAttachments.map((att, index) => (
                    <div key={index} className="relative group shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-card p-1">
                      {att.fileType === 'image' ? (
                        <img src={att.url} alt={att.name} className="h-14 w-14 object-cover rounded-lg" />
                      ) : (
                        <div className="h-14 w-28 p-1 flex flex-col justify-center text-[10px] truncate">
                          <Paperclip className="h-4 w-4 text-primary mb-1" />
                          <span className="font-semibold truncate">{att.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removePendingAttachment(index)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Input Bar */}
              {isBlocked ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border-t border-rose-200 dark:border-rose-900/40 text-center space-y-2">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    {translate('chatBlockedWarning', 'This conversation is blocked. You cannot send or receive messages.')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBlockModalOpen(true)}
                    className="rounded-xl text-xs border-rose-300 text-rose-700 hover:bg-rose-100"
                  >
                    {translate('unblockUser', 'Unblock User')}
                  </Button>
                </div>
              ) : (
                <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-card/80 backdrop-blur-xs">
                  <div className="flex items-end gap-2">
                    {/* Attachment buttons */}
                    <div className="flex items-center gap-1 pb-1">
                      <input
                        type="file"
                        ref={imageInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, true)}
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, false)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-9 w-9 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10"
                        title={translate('attachImage', 'Attach Image')}
                      >
                        <ImageIcon className="h-4.5 w-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-9 w-9 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10"
                        title={translate('attachFile', 'Attach File')}
                      >
                        <Paperclip className="h-4.5 w-4.5" />
                      </Button>
                    </div>

                    {/* Text Input */}
                    <div className="flex-1">
                      <Textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={translate('typeMessage', 'Type your message... (Enter to send, Shift+Enter for new line)')}
                        className="min-h-[40px] max-h-[120px] rounded-2xl resize-none py-2.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-1"
                        rows={1}
                      />
                    </div>

                    {/* Send Button */}
                    <Button
                      onClick={handleSend}
                      disabled={(!inputText.trim() && pendingAttachments.length === 0) || isSending || isUploading}
                      className="h-9 w-9 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-xs flex items-center justify-center"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State when no conversation is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-4 rounded-3xl bg-primary/10 text-primary w-16 h-16 flex items-center justify-center">
                <MessagesSquare className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {translate('selectConversation', 'Select a conversation')}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {translate('selectConversationDesc', 'Choose a chat from the sidebar or start a new message directly from any store, service, or support page.')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safety Modals */}
      {activeConv?.otherParticipant && (
        <>
          <ReportUserModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetUserId={activeConv.otherParticipant.userId}
            targetUserName={activeConv.otherParticipant.name}
            conversationId={activeConv.id}
          />
          <BlockUserModal
            isOpen={isBlockModalOpen}
            onClose={() => setIsBlockModalOpen(false)}
            targetUserId={activeConv.otherParticipant.userId}
            targetUserName={activeConv.otherParticipant.name}
            isCurrentlyBlocked={isBlocked}
            onBlockToggled={(newState) => toggleBlock()}
          />
        </>
      )}
    </div>
  );
}
