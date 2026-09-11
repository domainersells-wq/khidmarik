'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Image as ImageIcon, Paperclip, X, Maximize2, CheckCheck, Check, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { messagingService } from '@/services/messagingService';
import { ChatAttachmentPreview } from './ChatAttachmentPreview';
import { MessageAttachment, ConversationType, ParticipantRole, ConversationContextType } from '@/types/messaging';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FloatingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  targetRole?: ParticipantRole;
  conversationType?: ConversationType;
  contextType?: ConversationContextType;
  contextId?: string;
  contextTitle?: string;
  contextSubtitle?: string;
}

export function FloatingChatModal({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  targetRole = 'participant',
  conversationType = 'direct',
  contextType = 'general',
  contextId,
  contextTitle,
  contextSubtitle
}: FloatingChatModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { translate } = useLanguage();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or fetch conversation ID
  useEffect(() => {
    if (!isOpen || !user?.id || !targetUserId) return;

    const initConv = async () => {
      setIsInitializing(true);
      try {
        const res = await messagingService.createOrGetConversation({
          userId: user.id,
          targetUserId,
          type: conversationType,
          contextType,
          contextId,
          targetRole,
          contextDetails: contextTitle ? { title: contextTitle, subtitle: contextSubtitle } : undefined
        });

        if (res.conversationId) {
          setConversationId(res.conversationId);
        }
      } catch (err) {
        console.error('Failed to init floating chat:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initConv();
  }, [isOpen, user?.id, targetUserId, conversationType, contextType, contextId, targetRole, contextTitle, contextSubtitle]);

  const {
    messages,
    isLoading: isChatLoading,
    isSending,
    isTypingCounterpart,
    typingUserName,
    sendMessage,
    sendTypingIndicator
  } = useRealtimeChat(conversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTypingCounterpart]);

  const handleSend = async () => {
    if ((!inputText.trim() && pendingAttachments.length === 0) || isSending || !conversationId) return;

    const text = inputText;
    const atts = [...pendingAttachments];

    setInputText('');
    setPendingAttachments([]);

    await sendMessage(text, atts);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !conversationId || !user?.id) return;

    setIsUploading(true);
    try {
      const uploaded: MessageAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const att = await messagingService.uploadAttachment(files[i], conversationId, user.id);
        uploaded.push(att);
      }
      setPendingAttachments(prev => [...prev, ...uploaded]);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleOpenFullChat = () => {
    onClose();
    if (conversationId) {
      router.push(`/messages?id=${conversationId}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 rounded-3xl overflow-hidden border shadow-2xl font-sans h-[560px] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-3.5 px-4 bg-slate-50 dark:bg-slate-900/80 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800">
              <AvatarImage src={targetUserAvatar} />
              <AvatarFallback className="rounded-xl text-xs bg-primary/10 text-primary font-bold">
                {targetUserName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left rtl:text-right">
              <DialogTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {targetUserName}
              </DialogTitle>
              {contextTitle && (
                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                  {contextTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenFullChat}
              className="h-8 w-8 rounded-xl text-slate-500 hover:text-foreground"
              title="Expand to Full Hub"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-slate-500 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
          {isInitializing || isChatLoading ? (
            <div className="text-center py-16 text-xs text-muted-foreground">
              {translate('loading', 'Loading chat...')}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground">
              {translate('noMessagesYet', 'Say hello to start the conversation!')}
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs"
                  )}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <ChatAttachmentPreview attachments={msg.attachments} isOutgoing={isMe} />
                    )}
                    <div className={cn("text-[9px] mt-1 flex items-center justify-end gap-1 opacity-75")}>
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

        {/* Pending attachments preview */}
        {pendingAttachments.length > 0 && (
          <div className="p-2 border-t bg-slate-50 dark:bg-slate-900 flex gap-2 overflow-x-auto">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="relative p-1 border rounded-lg bg-card text-[10px] truncate max-w-[120px]">
                <span>{att.name}</span>
                <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 p-0.5 text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t bg-card flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            multiple
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 w-8 rounded-xl text-slate-500 hover:text-primary"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              sendTypingIndicator(e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={translate('typeMessage', 'Type your message...')}
            rows={1}
            className="min-h-[36px] max-h-[90px] text-xs resize-none rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-900"
          />

          <Button
            onClick={handleSend}
            disabled={(!inputText.trim() && pendingAttachments.length === 0) || isSending || isUploading}
            className="h-8 w-8 rounded-xl bg-primary text-primary-foreground shrink-0 flex items-center justify-center"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
