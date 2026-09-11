'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Bell, Send, Users, Smartphone, Mail, MessageSquare, 
  CheckCircle2, Clock, Eye, Sparkles, Wallet, CreditCard, ArrowLeft, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminNotification } from '@/services/adminDataService';
import { financialService } from '@/services/financialService';
import { TopUpRequest } from '@/types/financials';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function NotificationCenterSection() {
  const { toast } = useToast();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [pendingTopUps, setPendingTopUps] = useState<TopUpRequest[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New notification form
  const [newNotif, setNewNotif] = useState({
    title: '',
    message: '',
    targetAudience: 'all' as AdminNotification['targetAudience'],
    channel: 'push' as AdminNotification['channel'],
  });

  const loadData = () => {
    setNotifications(adminDataService.getNotifications());
    const topUps = financialService.getTopUpRequests().filter(
      r => r.status === 'UNDER_REVIEW' || r.status === 'PENDING_PAYMENT_CONFIRMATION' || r.status === 'PENDING_VERIFICATION'
    );
    setPendingTopUps(topUps);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('khidmatik:topup-updated', handleUpdate);
    window.addEventListener('khidmatik:admin-new-topup', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('khidmatik:topup-updated', handleUpdate);
      window.removeEventListener('khidmatik:admin-new-topup', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotif.title || !newNotif.message) {
      toast({ title: 'Validation Error', description: 'Please fill in title and message body.', variant: 'destructive' });
      return;
    }

    const created: AdminNotification = {
      id: `notif_${Date.now()}`,
      title: newNotif.title,
      message: newNotif.message,
      targetAudience: newNotif.targetAudience,
      channel: newNotif.channel,
      status: 'sent',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      deliveredCount: newNotif.targetAudience === 'all' ? 18400 : 850,
      openedCount: 0,
      createdBy: 'Super Admin',
    };

    const updated = [created, ...notifications];
    adminDataService.saveNotifications(updated);
    adminDataService.recordAudit('Super Admin', 'CREATE', 'Notification', created.id, `Broadcast notification "${created.title}" to ${created.targetAudience}`);
    setNotifications(updated);
    setIsCreateOpen(false);
    setNewNotif({
      title: '',
      message: '',
      targetAudience: 'all',
      channel: 'push',
    });
    toast({
      title: 'Broadcast Dispatched',
      description: `Notification successfully sent via ${created.channel.toUpperCase()} to ${created.targetAudience}.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'channel',
      label: 'Channel',
      options: [
        { label: 'Push Notification', value: 'push' },
        { label: 'In-App Alert', value: 'in_app' },
        { label: 'SMS Gateway', value: 'sms' },
        { label: 'Email Newsletter', value: 'email' },
      ],
    },
    {
      key: 'targetAudience',
      label: 'Target Audience',
      options: [
        { label: 'All Users', value: 'all' },
        { label: 'Store Owners', value: 'store_owners' },
        { label: 'Service Providers', value: 'service_providers' },
        { label: 'Delivery Riders', value: 'delivery_riders' },
      ],
    },
  ];

  const columns: ColumnDef<AdminNotification>[] = [
    {
      header: 'Title & Message',
      accessorKey: 'title',
      cell: (n) => (
        <div className="space-y-0.5 max-w-[320px]">
          <div className="font-semibold text-foreground truncate" title={n.title}>
            {n.title}
          </div>
          <div className="text-xs text-muted-foreground truncate" title={n.message}>
            {n.message}
          </div>
        </div>
      ),
    },
    {
      header: 'Audience & Channel',
      accessorKey: 'targetAudience',
      cell: (n) => (
        <div className="space-y-0.5 text-xs">
          <Badge variant="outline" className="bg-muted/40 font-normal uppercase text-[10px]">
            {n.targetAudience.replace(/_/g, ' ')}
          </Badge>
          <div className="text-muted-foreground uppercase font-mono text-[11px]">{n.channel}</div>
        </div>
      ),
    },
    {
      header: 'Delivery Stats',
      accessorKey: 'deliveredCount',
      cell: (n) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{n.deliveredCount.toLocaleString()} delivered</span>
          <span className="text-muted-foreground block text-[11px]">{n.openedCount.toLocaleString()} opens</span>
        </div>
      ),
    },
    {
      header: 'Sent Timestamp',
      accessorKey: 'sentAt',
      cell: (n) => <span className="text-xs text-muted-foreground">{n.sentAt || n.scheduledFor}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (n) => {
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
          sent: 'default',
          scheduled: 'secondary',
          draft: 'outline',
        };
        return (
          <Badge variant={variants[n.status] || 'outline'} className="capitalize text-xs">
            {n.status}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (n) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNotif(n);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View
        </Button>
      ),
    },
  ];

  const total = notifications.length;
  const totalDelivered = notifications.reduce((acc, n) => acc + n.deliveredCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
            <Bell className="mr-3 h-8 w-8 text-primary" /> Notifications & Broadcasts
          </h1>
          <p className="text-muted-foreground text-sm">
            Publish platform announcements, push campaigns, and target specific user groups via SMS and in-app alerts.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="h-10 px-4 rounded-xl font-medium">
          <Send className="h-4 w-4 mr-2" /> Compose Broadcast
        </Button>
      </div>

      {/* Tabs navigation */}
      <Tabs defaultValue="actionable" className="space-y-6">
        <TabsList className="grid grid-cols-2 max-w-md h-11 p-1 bg-muted rounded-xl">
          <TabsTrigger value="actionable" className="rounded-lg text-xs font-bold flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>طلبات العمليات الواردة</span>
            {pendingTopUps.length > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 text-[10px] font-bold rounded-full">
                {pendingTopUps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-lg text-xs font-bold flex items-center gap-2">
            <Send className="h-3.5 w-3.5" />
            <span>حملات البث والإعلانات ({total})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Actionable Requests (Top-ups, withdrawals, kyc) */}
        <TabsContent value="actionable" className="space-y-6">
          <Card className="bg-card shadow-sm border-border/80 rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-border/80 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span>طلبات شحن الرصيد المعلقة للمطابقة (Pending Top-Ups)</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    حوالات بريدية وإلكترونية بانتظار مطابقة رقم العملية البريدي يدوياً أو آلياً
                  </CardDescription>
                </div>
                <Badge variant={pendingTopUps.length > 0 ? "destructive" : "outline"} className="text-xs font-bold px-2.5 py-1">
                  {pendingTopUps.length} طلب بالانتظار
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pendingTopUps.length === 0 ? (
                <div className="py-12 text-center px-4 space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-foreground">لا توجد طلبات شحن معلقة حالياً</p>
                  <p className="text-xs text-muted-foreground">جميع الحوالات البريدية تم فحصها ومطابقتها واعتمادها بنجاح.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {pendingTopUps.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs font-bold">
                            {req.publicRequestNumber}
                          </Badge>
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                            بانتظار التحقق اليدوي
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {req.paymentMethod}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>العميل: <strong className="text-foreground">{req.userName}</strong></span>
                          <span>التاريخ: <span className="font-mono">{req.transferDate || req.createdAt}</span></span>
                          {req.senderAccount && <span>الحساب المحول منه: <span className="font-mono">{req.senderAccount}</span></span>}
                        </div>

                        {/* Postal Transaction Code Badge */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs font-semibold text-muted-foreground">كود العملية البريدية:</span>
                          <strong className="font-mono text-xs font-black bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20" dir="ltr">
                            {req.postalTransactionCode || 'لم يتم إدخاله'}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-muted-foreground block">المبلغ الصافي:</span>
                          <strong className="text-base font-black text-primary font-mono" dir="ltr">
                            +{req.amount.toLocaleString()} DA
                          </strong>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/dashboard?section=topup-management&requestId=${req.publicRequestNumber}`)}
                          className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>فحص ومطابقة الكود</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Broadcast Campaigns */}
        <TabsContent value="broadcasts" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Broadcast Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Total alerts dispatched</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Delivered Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{totalDelivered.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Sent to user mobile devices</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Gateways</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">Firebase / SMS</div>
                <p className="text-xs text-muted-foreground mt-1">FCM & Ooredoo/Djezzy/Mobilis</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <AdminDataTable
            data={notifications}
            columns={columns}
            searchPlaceholder="Search notification by title, message, target..."
            searchKeys={['title', 'message', 'targetAudience', 'channel', 'createdBy']}
            filterOptions={filterOptions}
            exportFileName="khidmatik_notifications"
            onRowClick={(n) => {
              setSelectedNotif(n);
              setIsDetailOpen(true);
            }}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      {selectedNotif && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedNotif.title}
          subtitle={`Sent: ${selectedNotif.sentAt} • Author: ${selectedNotif.createdBy}`}
          statusBadge={{
            label: selectedNotif.status,
            variant: selectedNotif.status === 'sent' ? 'default' : 'secondary',
          }}
          metrics={[
            { label: 'Delivered', value: selectedNotif.deliveredCount.toLocaleString(), icon: Send },
            { label: 'Opens', value: selectedNotif.openedCount.toLocaleString(), icon: Eye },
            { label: 'Channel', value: selectedNotif.channel.toUpperCase(), icon: Smartphone },
            { label: 'Audience', value: selectedNotif.targetAudience.replace(/_/g, ' ').toUpperCase(), icon: Users },
          ]}
          fields={[
            { label: 'Campaign Title', value: selectedNotif.title },
            { label: 'Target Audience Group', value: selectedNotif.targetAudience.replace(/_/g, ' ').toUpperCase() },
            { label: 'Delivery Channel', value: selectedNotif.channel.toUpperCase() },
            { label: 'Author / Admin', value: selectedNotif.createdBy },
            { label: 'Message Body', value: selectedNotif.message, fullWidth: true },
          ]}
        />
      )}

      {/* Compose Broadcast Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Compose Platform Broadcast</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send instant push notification, in-app banner, or SMS message to platform participants.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBroadcast} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notification Title *</Label>
              <Input
                placeholder="e.g. Special Eid Holiday Promotion"
                value={newNotif.title}
                onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Audience *</Label>
                <Select
                  value={newNotif.targetAudience}
                  onValueChange={(val: any) => setNewNotif({ ...newNotif, targetAudience: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users (Algeria-wide)</SelectItem>
                    <SelectItem value="store_owners">Store Owners & Merchants</SelectItem>
                    <SelectItem value="service_providers">Craftsmen & Providers</SelectItem>
                    <SelectItem value="delivery_riders">Delivery Riders</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Dispatch Channel *</Label>
                <Select
                  value={newNotif.channel}
                  onValueChange={(val: any) => setNewNotif({ ...newNotif, channel: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Mobile Push Notification</SelectItem>
                    <SelectItem value="in_app">In-App Banner Alert</SelectItem>
                    <SelectItem value="sms">SMS Gateway</SelectItem>
                    <SelectItem value="email">Email Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Message Body *</Label>
              <Textarea
                placeholder="Enter the full message text..."
                rows={4}
                value={newNotif.message}
                onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" /> Send Broadcast Now
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
