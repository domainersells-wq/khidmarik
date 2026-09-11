'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ExternalLink, MessagesSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useConversations } from '@/hooks/useConversations';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface MessagesDropdownProps {
  buttonClassName?: string;
}

export function MessagesDropdown({ buttonClassName }: MessagesDropdownProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { translate } = useLanguage();
  const { conversations, totalUnreadCount } = useConversations();

  if (!user) return null;

  const topConversations = conversations.slice(0, 5);

  const formatSnippetTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative rounded-xl", buttonClassName)}
          title={translate('messages', 'Messages')}
        >
          <MessageSquare className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl p-2 shadow-xl border border-slate-200/80 dark:border-slate-800 font-sans"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {translate('messages', 'Messages')}
            </h3>
            {totalUnreadCount > 0 && (
              <Badge variant="default" className="rounded-full text-[10px] px-1.5 py-0 bg-primary font-bold">
                {totalUnreadCount} {translate('new', 'New')}
              </Badge>
            )}
          </div>
          <Link
            href="/messages"
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {translate('viewAll', 'View All')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="max-h-[340px] overflow-y-auto space-y-1 p-1">
          {topConversations.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <MessagesSquare className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-xs text-muted-foreground">
                {translate('noConversationsYet', 'No messages yet.')}
              </p>
            </div>
          ) : (
            topConversations.map((conv) => {
              const other = conv.otherParticipant;
              const hasUnread = conv.unreadCount > 0;

              return (
                <DropdownMenuItem
                  key={conv.id}
                  onClick={() => router.push(`/messages?id=${conv.id}`)}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors",
                    hasUnread
                      ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10"
                      : "hover:bg-slate-100 dark:hover:bg-slate-900"
                  )}
                >
                  <Avatar className="h-9 w-9 rounded-xl shrink-0 border border-slate-200 dark:border-slate-800">
                    <AvatarImage src={other?.avatarUrl} />
                    <AvatarFallback className="rounded-xl text-xs bg-primary/10 text-primary font-bold">
                      {other?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 text-left rtl:text-right">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={cn(
                        "text-xs truncate",
                        hasUnread ? "font-bold text-slate-900 dark:text-slate-100" : "font-semibold text-slate-700 dark:text-slate-300"
                      )}>
                        {other?.name || conv.title || 'User'}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatSnippetTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <p className={cn(
                      "text-[11px] truncate",
                      hasUnread ? "font-semibold text-slate-800 dark:text-slate-200" : "text-muted-foreground"
                    )}>
                      {conv.lastMessageText || translate('noMessagesYet', 'No messages yet')}
                    </p>
                  </div>

                  {hasUnread && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="p-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full rounded-xl text-xs font-semibold h-8"
          >
            <Link href="/messages">
              {translate('openMessagingHub', 'Open Messaging Hub')}
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
