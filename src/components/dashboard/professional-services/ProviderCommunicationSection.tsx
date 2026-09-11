'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessagesSquare, Send, Search, ExternalLink, Paperclip, CheckCheck, Check, Clock, UserX, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { usePresence } from '@/hooks/usePresence';
import { ChatAttachmentPreview } from '@/components/chat/ChatAttachmentPreview';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function ProviderCommunicationSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { translate } = useLanguage();
  const { isUserOnline } = usePresence();

  const {
    conversations,
    searchQuery,
    setSearchQuery,
    isLoading: isConversationsLoading,
    selectedConversationId,
    setSelectedConversationId,
    totalUnreadCount
  } = useConversations('customer_provider');

  const {
    conversation: activeConv,
    messages,
    isLoading: isChatLoading,
    isSending,
    isTypingCounterpart,
    typingUserName,
    sendMessage,
    sendTypingIndicator
  } = useRealtimeChat(selectedConversationId);

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select first conversation
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, setSelectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTypingCounterpart]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !selectedConversationId) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-headline flex items-center gap-2">
            <MessagesSquare className="h-6 w-6 text-primary" />
            {translate('clientCommunications', 'Client Communications')}
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {translate('clientCommunicationsDesc', 'Real-time inquiries, quotes, and project discussions with your clients.')}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 font-semibold">
          <Link href="/messages">
            <ExternalLink className="h-3.5 w-3.5" />
            {translate('openFullHub', 'Open Full Messaging Hub')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[600px] border rounded-3xl overflow-hidden bg-card shadow-xs">
        {/* Sidebar: Inquiries & Conversations */}
        <div className="md:col-span-4 border-r flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
          <div className="p-3.5 border-b space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {translate('activeInquiries', 'Active Client Inquiries')}
              </span>
              {totalUnreadCount > 0 && (
                <Badge className="bg-primary text-white text-[10px] rounded-full px-1.5">
                  {totalUnreadCount} {translate('new', 'New')}
                </Badge>
              )}
            </div>
            <div className="relative">
              <Search className="absolute ltr:left-2.5 rtl:right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={translate('searchClients', 'Search clients or topics...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs ltr:pl-8 rtl:pr-8 rounded-xl bg-card border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isConversationsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {translate('loading', 'Loading conversations...')}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <MessagesSquare className="h-6 w-6 mx-auto opacity-40" />
                <p>{translate('noClientChatsYet', 'No client chats yet. When clients contact you, they will appear here.')}</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = conv.otherParticipant;
                const isSelected = selectedConversationId === conv.id;
                const isOnline = other ? isUserOnline(other.userId) : false;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-2xl cursor-pointer transition-all border",
                      isSelected
                        ? "bg-primary/10 border-primary/25 shadow-2xs"
                        : "bg-card hover:bg-slate-100 dark:hover:bg-slate-900 border-transparent"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800">
                        <AvatarImage src={other?.avatarUrl} />
                        <AvatarFallback className="rounded-xl text-[10px] bg-primary/10 text-primary font-bold">
                          {other?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left rtl:text-right">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                          {other?.name || conv.title || 'Client'}
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'h:mm a') : ''}
                        </span>
                      </div>
                      {conv.contextDetails?.title && (
                        <p className="text-[10px] text-primary font-semibold truncate mb-0.5">
                          {conv.contextDetails.title}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground truncate">
                        {conv.lastMessageText || translate('noMessagesYet', 'No messages yet')}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main: Live Chat Stream */}
        <div className="md:col-span-8 flex flex-col bg-card">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 px-4 border-b flex items-center justify-between bg-card/80">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800">
                    <AvatarImage src={activeConv.otherParticipant?.avatarUrl} />
                    <AvatarFallback className="rounded-xl text-xs bg-primary/10 text-primary font-bold">
                      {activeConv.otherParticipant?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left rtl:text-right">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {activeConv.otherParticipant?.name || 'Client'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {activeConv.otherParticipant && isUserOnline(activeConv.otherParticipant.userId) ? (
                        <span className="text-emerald-600 font-semibold">{translate('online', 'Online')}</span>
                      ) : (
                        <span>{translate('offline', 'Offline')}</span>
                      )}
                      {activeConv.contextDetails?.title && ` • ${activeConv.contextDetails.title}`}
                    </p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs rounded-lg gap-1">
                  <Link href={`/messages?id=${activeConv.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    {translate('openInHub', 'Open in Hub')}
                  </Link>
                </Button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 dark:bg-slate-950/20">
                {isChatLoading ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    {translate('loadingMessages', 'Loading messages...')}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-muted-foreground space-y-2">
                    <p>{translate('noMessagesYet', 'Say hello to your client!')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] p-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60"
                        )}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <ChatAttachmentPreview attachments={msg.attachments} isOutgoing={isMe} />
                          )}
                          <div className={cn("text-[9px] mt-1 flex items-center justify-end gap-1 opacity-80")}>
                            <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                            {isMe && (
                              <span>
                                {msg.status === 'read' ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isTypingCounterpart && (
                  <p className="text-[11px] text-muted-foreground italic">
                    {typingUserName} is typing...
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t flex items-end gap-2 bg-card">
                <Textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    sendTypingIndicator(e.target.value.length > 0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={translate('typeMessage', 'Type your reply... (Enter to send)')}
                  rows={1}
                  className="min-h-[38px] max-h-[80px] text-xs resize-none rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-900"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isSending}
                  className="h-9 w-9 rounded-xl bg-primary text-primary-foreground shrink-0 flex items-center justify-center shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessagesSquare className="h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-xs text-muted-foreground">
                {translate('selectClientToChat', 'Select a conversation to reply to your clients in real-time.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
