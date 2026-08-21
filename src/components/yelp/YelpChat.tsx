'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { yelpService, type ChatMessage } from '@/services/yelpService';
import { 
  Send, Image as ImageIcon, Paperclip, Mic, CheckCheck, Check, 
  Volume2, Play, CircleDot, User, Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface YelpChatProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  onClose?: () => void;
}

export function YelpChat({ receiverId, receiverName, receiverAvatar, onClose }: YelpChatProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat messages
  useEffect(() => {
    if (!user?.id || !receiverId) return;

    const loadMessages = async () => {
      const msgs = await yelpService.getChatMessages(user.id, receiverId);
      setMessages(msgs);
    };

    loadMessages();
    
    // Poll every 3 seconds to simulate real-time chat updates
    const timer = setInterval(loadMessages, 3500);
    return () => clearInterval(timer);
  }, [user?.id, receiverId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent, customMsg?: string, media?: string[], voice?: string) => {
    if (e) e.preventDefault();
    if (!user?.id) {
      toast({ title: language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please log in to chat.' });
      return;
    }

    const messageContent = customMsg !== undefined ? customMsg : text;
    if (!messageContent.trim() && !media && !voice) return;

    // Clear input
    if (customMsg === undefined) setText('');

    const newMsg = await yelpService.sendChatMessage(
      user.id,
      receiverId,
      messageContent,
      media || [],
      voice
    );

    setMessages(prev => [...prev, newMsg]);

    // Simulate provider typing and auto reply
    setIsTyping(true);
    setTimeout(async () => {
      setIsTyping(false);
      const autoReplyText = language === 'ar' 
        ? `شكراً لرسالتك بخصوص الخدمات الحرفية. سأقوم بالرد على تفاصيل استفسارك خلال دقائق.`
        : `Thanks for messaging! I received your inquiry about the services and will reply in a few minutes.`;
      
      const replyMsg = await yelpService.sendChatMessage(
        receiverId,
        user.id,
        autoReplyText
      );
      
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  const handleAttachImage = () => {
    handleSend(
      undefined, 
      '', 
      ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&fit=crop']
    );
    toast({ title: language === 'ar' ? 'تم إرسال الصورة' : 'Image attached successfully' });
  };

  const startVoiceRecord = () => {
    if (isRecording) {
      // Stop and send mock voice
      setIsRecording(false);
      handleSend(
        undefined, 
        '', 
        [], 
        'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
      );
      toast({ title: language === 'ar' ? 'تم إرسال التسجيل الصوتي' : 'Voice message sent successfully' });
    } else {
      setIsRecording(true);
    }
  };

  const isRtl = language === 'ar';

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-card border rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
      {/* Header bar */}
      <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-primary-foreground/20">
            <AvatarImage src={receiverAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${receiverName}`} />
            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-headline font-bold text-sm leading-tight">{receiverName}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-semibold text-primary-foreground/80">{isRtl ? 'نشط الآن' : 'Active Now'}</span>
            </div>
          </div>
        </div>
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="text-primary-foreground hover:bg-primary-foreground/10 text-xs font-semibold"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/20">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[75%]",
                  isMe ? "ms-auto items-end" : "me-auto items-start"
                )}
              >
                <div 
                  className={cn(
                    "p-3 rounded-2xl text-sm font-medium shadow-sm relative group",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-popover text-foreground rounded-tl-none border"
                  )}
                >
                  {/* Media attachments */}
                  {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                    <div className="mb-2">
                      {msg.mediaUrls.map((url, i) => (
                        <img 
                          key={i} 
                          src={url} 
                          alt="attached chat upload" 
                          className="rounded-lg max-h-36 object-cover border" 
                        />
                      ))}
                    </div>
                  )}

                  {/* Voice Notes */}
                  {msg.voiceUrl && (
                    <div className="flex items-center gap-2 bg-black/10 py-1.5 px-3 rounded-lg text-xs font-bold mb-1">
                      <Volume2 className="h-4 w-4 shrink-0" />
                      <span>{isRtl ? 'رسالة صوتية (0:08)' : 'Voice Note (0:08)'}</span>
                      <Play className="h-3.5 w-3.5 fill-current shrink-0 cursor-pointer" />
                    </div>
                  )}

                  {/* Message body text */}
                  {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                </div>
                
                {/* Meta details (Time and read status) */}
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground px-1 font-semibold select-none">
                  <span>{format(new Date(msg.createdAt), 'hh:mm a')}</span>
                  {isMe && (
                    msg.isRead ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : <Check className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground select-none">
            <CircleDot className="h-10 w-10 text-muted-foreground/30 animate-pulse mb-2" />
            <p className="text-xs font-semibold">{isRtl ? 'ابدأ المحادثة الآن' : 'No messages yet. Say hello!'}</p>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic px-2">
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className="p-3 bg-popover border-t flex items-center gap-1.5">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={handleAttachImage}
          className="rounded-full hover:bg-muted text-muted-foreground shrink-0 h-9 w-9"
          title="Send image"
        >
          <ImageIcon className="h-4.5 w-4.5" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={startVoiceRecord}
          className={cn(
            "rounded-full hover:bg-muted shrink-0 h-9 w-9 transition-all",
            isRecording ? "text-destructive bg-destructive/10 hover:bg-destructive/25" : "text-muted-foreground"
          )}
          title="Voice record"
        >
          <Mic className="h-4.5 w-4.5" />
        </Button>
        
        <Input
          type="text"
          placeholder={isRecording ? (isRtl ? 'جاري التسجيل... انقر للإرسال' : 'Recording... Click to Send') : (isRtl ? 'اكتب رسالتك...' : 'Type a message...')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isRecording}
          className="h-10 text-sm font-medium rounded-full bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
        />

        <Button 
          type="submit" 
          size="icon" 
          disabled={!text.trim() && !isRecording}
          className="rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shrink-0 h-10 w-10 shadow-sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

export default YelpChat;
