'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, Send, Users, Eye, CheckCircle2, Clock, 
  AlertCircle, ShieldCheck, Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminMessage } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function MessagingCenterSection() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const loadData = () => {
    setMessages(adminDataService.getMessages());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    toast({
      title: 'Reply Sent',
      description: `Message transmitted to ${selectedMessage.senderName}.`,
    });
    setReplyText('');
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active Conversation', value: 'active' },
        { label: 'Closed / Solved', value: 'closed' },
        { label: 'Flagged', value: 'flagged' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      options: [
        { label: 'High Priority', value: 'high' },
        { label: 'Normal', value: 'normal' },
        { label: 'Urgent', value: 'urgent' },
      ],
    },
  ];

  const columns: ColumnDef<AdminMessage>[] = [
    {
      header: 'Subject & Preview',
      accessorKey: 'subject',
      cell: (m) => (
        <div className="space-y-0.5 max-w-[320px]">
          <div className="font-semibold text-foreground truncate" title={m.subject}>
            {m.subject}
          </div>
          <div className="text-xs text-muted-foreground truncate" title={m.lastMessageSnippet}>
            {m.lastMessageSnippet}
          </div>
        </div>
      ),
    },
    {
      header: 'Sender & Recipient',
      accessorKey: 'senderName',
      cell: (m) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{m.senderName}</div>
          <div className="text-muted-foreground">To: {m.recipientName}</div>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (m) => {
        const pBadges: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          urgent: 'destructive',
          high: 'destructive',
          normal: 'outline',
        };
        return (
          <Badge variant={pBadges[m.priority] || 'outline'} className="text-[10px] uppercase font-bold">
            {m.priority}
          </Badge>
        );
      },
    },
    {
      header: 'Last Activity',
      accessorKey: 'lastActivity',
      cell: (m) => <span className="text-xs text-muted-foreground">{m.lastActivity}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (m) => (
        <Badge variant={m.status === 'active' ? 'default' : 'outline'} className="capitalize text-xs">
          {m.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (m) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedMessage(m);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> Open Chat
        </Button>
      ),
    },
  ];

  const total = messages.length;
  const activeCount = messages.filter((m) => m.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <MessageSquare className="mr-3 h-8 w-8 text-primary" /> Direct Messaging & Inquiries
        </h1>
        <p className="text-muted-foreground text-sm">
          Coordinate support dialogues, administrative messages with merchants, and inquiries from service professionals.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Threads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring desk response</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Average Reply Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12 mins</div>
            <p className="text-xs text-muted-foreground mt-1">Super admin desk SLA</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Historical messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={messages}
        columns={columns}
        searchPlaceholder="Search messages by sender, subject, content..."
        searchKeys={['senderName', 'recipientName', 'subject', 'lastMessageSnippet']}
        filterOptions={filterOptions}
        exportFileName="khidmatik_messages"
        onRowClick={(m) => {
          setSelectedMessage(m);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedMessage && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedMessage.subject}
          subtitle={`Thread #${selectedMessage.conversationId} • Between ${selectedMessage.senderName} & ${selectedMessage.recipientName}`}
          statusBadge={{
            label: selectedMessage.status,
            variant: selectedMessage.status === 'active' ? 'default' : 'secondary',
          }}
          metrics={[
            { label: 'Priority', value: selectedMessage.priority.toUpperCase(), icon: AlertCircle },
            { label: 'Unread', value: selectedMessage.unreadCount, icon: Mail },
            { label: 'Last Activity', value: selectedMessage.lastActivity, icon: Clock },
            { label: 'Status', value: selectedMessage.status.toUpperCase(), icon: MessageSquare },
          ]}
          fields={[
            { label: 'Sender', value: `${selectedMessage.senderName} (${selectedMessage.senderRole})` },
            { label: 'Recipient', value: `${selectedMessage.recipientName} (${selectedMessage.recipientRole})` },
            { label: 'Subject', value: selectedMessage.subject, fullWidth: true },
            { label: 'Last Message Received', value: selectedMessage.lastMessageSnippet, fullWidth: true },
          ]}
        >
          {/* Reply Form */}
          <div className="space-y-2 pt-2">
            <Textarea
              placeholder="Type administrative response here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={handleSendReply}>
                <Send className="h-4 w-4 mr-1.5" /> Send Reply
              </Button>
            </div>
          </div>
        </AdminDetailDrawer>
      )}
    </div>
  );
}
