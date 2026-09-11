'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  ShoppingCart, Truck, DollarSign, Package, CheckCircle2, 
  XCircle, Eye, Phone, Mail, MapPin, Store, CreditCard, Clock, 
  Ban, RotateCcw, Scale, Wrench, Building, Layers, AlertTriangle, 
  History, ArrowRight, Check, Send, Sparkles, Filter, Download, ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { unifiedOrderService } from '@/services/unifiedOrderService';
import { 
  UnifiedOrder, 
  UnifiedOrderStatus, 
  UnifiedOrderSource, 
  ORDER_FSM_TRANSITIONS 
} from '@/types/unifiedOrder';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function OrderManagementSection() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [channelTab, setChannelTab] = useState<UnifiedOrderSource | 'all'>('all');

  // Operational Dialog States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeResolution, setDisputeResolution] = useState<'REFUND_BUYER' | 'PAY_SELLER' | 'DISMISSED'>('REFUND_BUYER');
  const [disputeNotes, setDisputeNotes] = useState('');

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [courierName, setCourierName] = useState<'yalidine' | 'procolis' | 'kazi_tour' | 'in_house'>('yalidine');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    variant: 'warning',
  });

  const loadData = async () => {
    const data = await unifiedOrderService.getOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransition = async (
    orderId: string,
    targetStatus: UnifiedOrderStatus,
    notes?: string,
    context?: any
  ) => {
    const res = await unifiedOrderService.transitionStatus(
      orderId,
      targetStatus,
      'Super Admin',
      'ADMIN',
      notes,
      context
    );

    if (!res.success) {
      toast({
        title: 'State Transition Blocked',
        description: res.error || 'Invalid lifecycle transition.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Lifecycle State Updated',
      description: `Order transitioned to ${targetStatus} successfully.`,
    });

    await loadData();
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = await unifiedOrderService.getOrderById(orderId);
      setSelectedOrder(updated);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !cancelReason.trim()) return;

    await handleTransition(selectedOrder.id, 'CANCELLED', cancelReason, {
      cancellationReason: cancelReason,
    });
    setIsCancelModalOpen(false);
    setCancelReason('');
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || refundAmount <= 0) return;

    await handleTransition(selectedOrder.id, 'REFUNDED', refundReason, {
      refundAmount,
    });
    setIsRefundModalOpen(false);
    setRefundReason('');
  };

  const handleConfirmDisputeResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const res = await unifiedOrderService.resolveDispute(
      selectedOrder.id,
      disputeResolution,
      disputeNotes,
      'Super Admin'
    );

    if (res.success) {
      toast({ title: 'Dispute Resolved', description: `Settled with outcome: ${disputeResolution}` });
      await loadData();
      const updated = await unifiedOrderService.getOrderById(selectedOrder.id);
      setSelectedOrder(updated);
      setIsDisputeModalOpen(false);
      setDisputeNotes('');
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const handleConfirmTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trackingNumberInput.trim()) return;

    await unifiedOrderService.updateTracking(
      selectedOrder.id,
      courierName,
      trackingNumberInput.trim(),
      'Admin Dispatcher'
    );

    toast({
      title: 'Tracking Attached',
      description: `Courier ${courierName.toUpperCase()} with tracking #${trackingNumberInput} updated.`,
    });

    await loadData();
    const updated = await unifiedOrderService.getOrderById(selectedOrder.id);
    setSelectedOrder(updated);
    setIsTrackingModalOpen(false);
    setTrackingNumberInput('');
  };

  // Filtered orders based on selected source tab
  const channelFilteredOrders = orders.filter((o) => {
    if (channelTab === 'all') return true;
    return o.source === channelTab;
  });

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Lifecycle Status',
      options: [
        { label: 'PENDING', value: 'PENDING' },
        { label: 'CONFIRMED', value: 'CONFIRMED' },
        { label: 'PROCESSING', value: 'PROCESSING' },
        { label: 'READY', value: 'READY' },
        { label: 'DISPATCHED', value: 'DISPATCHED' },
        { label: 'DELIVERED', value: 'DELIVERED' },
        { label: 'COMPLETED', value: 'COMPLETED' },
        { label: 'CANCELLED', value: 'CANCELLED' },
        { label: 'REFUNDED', value: 'REFUNDED' },
        { label: 'DISPUTED', value: 'DISPUTED' },
      ],
    },
    {
      key: 'payment.status',
      label: 'Payment State',
      options: [
        { label: 'PAID', value: 'PAID' },
        { label: 'PENDING', value: 'PENDING' },
        { label: 'PARTIALLY_PAID', value: 'PARTIALLY_PAID' },
        { label: 'UNPAID (COD)', value: 'UNPAID' },
        { label: 'REFUNDED', value: 'REFUNDED' },
      ],
    },
    {
      key: 'source',
      label: 'Order Channel',
      options: [
        { label: 'Merchant Stores', value: 'store' },
        { label: 'Marketplace Parts & Goods', value: 'marketplace' },
        { label: 'Craftsmen Services', value: 'craftsman' },
        { label: 'Banquet Halls', value: 'banquet_hall' },
        { label: 'Professional Services', value: 'professional_service' },
      ],
    },
  ];

  const bulkActions: BulkAction<UnifiedOrder>[] = [
    {
      label: 'Confirm Orders',
      icon: CheckCircle2,
      variant: 'default',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Confirm ${selected.length} Orders`,
          description: `Advance ${selected.length} orders to CONFIRMED status?`,
          variant: 'success',
          action: () => {
            selected.forEach((o) => handleTransition(o.id, 'CONFIRMED', 'Bulk confirmed by admin'));
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
          },
        });
      },
    },
  ];

  const columns: ColumnDef<UnifiedOrder>[] = [
    {
      header: 'Order # & Channel',
      accessorKey: 'orderNumber',
      cell: (o) => {
        const channelBadges: Record<string, { label: string; className: string; icon: any }> = {
          marketplace: { label: 'Marketplace', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Package },
          store: { label: 'Storefront', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Store },
          craftsman: { label: 'Craftsman Visit', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Wrench },
          banquet_hall: { label: 'Banquet Hall', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: Building },
          professional_service: { label: 'Pro Service', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        };
        const c = channelBadges[o.source] || { label: o.source, className: '', icon: ShoppingCart };
        const Icon = c.icon;
        return (
          <div className="space-y-1">
            <div className="font-semibold text-foreground font-mono">{o.orderNumber}</div>
            <Badge variant="outline" className={cn("text-[10px] font-semibold flex items-center gap-1 w-fit", c.className)}>
              <Icon className="h-3 w-3 shrink-0" />
              {c.label}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Customer & Wilaya',
      accessorKey: 'customer.name',
      cell: (o) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{o.customer.name}</div>
          <div className="text-muted-foreground font-mono">{o.customer.phone}</div>
          <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <MapPin className="h-3 w-3" />
            {o.customer.wilaya}
          </div>
        </div>
      ),
    },
    {
      header: 'Seller / Provider',
      accessorKey: 'sellerOrProvider.name',
      cell: (o) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{o.sellerOrProvider.name}</div>
          <div className="text-muted-foreground truncate max-w-[180px]" title={o.items.map((i) => i.name).join(', ')}>
            {o.items.length === 1 ? o.items[0].name : `${o.items[0].name} (+${o.items.length - 1} more)`}
          </div>
        </div>
      ),
    },
    {
      header: 'Total & Commission',
      accessorKey: 'financials.totalAmount',
      cell: (o) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{o.financials.totalAmount.toLocaleString()} DA</span>
          <span className="text-muted-foreground block text-[11px]">
            Comm: <strong className="text-primary">{o.financials.platformCommission.toLocaleString()} DA</strong>
          </span>
        </div>
      ),
    },
    {
      header: 'Payment',
      accessorKey: 'payment.status',
      cell: (o) => {
        const pVariants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          PAID: { label: 'Paid', variant: 'default' },
          PENDING: { label: 'Pending', variant: 'secondary' },
          PARTIALLY_PAID: { label: 'Deposit Paid', variant: 'secondary' },
          UNPAID: { label: 'Unpaid COD', variant: 'outline' },
          REFUNDED: { label: 'Refunded', variant: 'outline' },
          FAILED: { label: 'Failed', variant: 'destructive' },
        };
        const conf = pVariants[o.payment.status] || { label: o.payment.status, variant: 'outline' };
        return (
          <div className="space-y-0.5">
            <Badge variant={conf.variant} className="text-[11px] font-semibold uppercase">
              {conf.label}
            </Badge>
            <div className="text-[10px] text-muted-foreground uppercase">{o.payment.method.replace(/_/g, ' ')}</div>
          </div>
        );
      },
    },
    {
      header: 'Lifecycle Status',
      accessorKey: 'status',
      cell: (o) => {
        const statusColors: Record<UnifiedOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
          PENDING: { label: 'Pending', variant: 'secondary' },
          CONFIRMED: { label: 'Confirmed', variant: 'secondary', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
          PROCESSING: { label: 'Processing', variant: 'secondary', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
          READY: { label: 'Ready', variant: 'secondary', className: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300' },
          DISPATCHED: { label: 'Dispatched', variant: 'default', className: 'bg-indigo-600 text-white' },
          DELIVERED: { label: 'Delivered', variant: 'default', className: 'bg-emerald-600 text-white' },
          COMPLETED: { label: 'Completed', variant: 'default', className: 'bg-emerald-700 text-white' },
          CANCELLED: { label: 'Cancelled', variant: 'destructive' },
          REFUNDED: { label: 'Refunded', variant: 'outline', className: 'border-orange-500 text-orange-600' },
          DISPUTED: { label: 'Disputed', variant: 'destructive', className: 'bg-red-600 text-white animate-pulse' },
        };
        const st = statusColors[o.status] || { label: o.status, variant: 'outline' };
        return (
          <Badge variant={st.variant} className={cn("text-xs font-bold uppercase", st.className)}>
            {st.label}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (o) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs font-medium"
            onClick={() => {
              setSelectedOrder(o);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View Order
          </Button>
        </div>
      ),
    },
  ];

  // Lifecycle Stepper Stages
  const lifecycleStages: UnifiedOrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED',
  ];

  const total = channelFilteredOrders.length;
  const totalVolume = channelFilteredOrders.reduce((acc, o) => acc + o.financials.totalAmount, 0);
  const totalCommission = channelFilteredOrders.reduce((acc, o) => acc + o.financials.platformCommission, 0);
  const activeOrders = channelFilteredOrders.filter((o) => !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
            <ShoppingCart className="mr-3 h-8 w-8 text-primary" /> Unified Order Management System
          </h1>
          <p className="text-muted-foreground text-sm">
            Centralized platform order lifecycle across Marketplace, Merchant Stores, Craftsmen Appointments, and Banquet Halls.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Multi-channel orders</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Gross Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalVolume.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Platform gross merchandise</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Platform Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCommission.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Earned platform revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active In-Flight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{activeOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending/Processing/Dispatched</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-muted/40 rounded-2xl w-fit overflow-x-auto custom-sidebar-scrollbar border">
        {[
          { id: 'all', label: 'All Channels', icon: ShoppingCart },
          { id: 'store', label: 'Merchant Stores', icon: Store },
          { id: 'marketplace', label: 'Marketplace Parts', icon: Package },
          { id: 'craftsman', label: 'Craftsmen Services', icon: Wrench },
          { id: 'banquet_hall', label: 'Banquet Halls', icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = channelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setChannelTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0",
                isActive
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Table */}
      <AdminDataTable
        data={channelFilteredOrders}
        columns={columns}
        searchPlaceholder="Search by order #, customer name, phone, seller, SKU..."
        searchKeys={[
          'orderNumber',
          'customer.name',
          'customer.phone',
          'customer.email',
          'customer.wilaya',
          'sellerOrProvider.name',
          'delivery.trackingNumber',
        ]}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName={`khidmatik_orders_${channelTab}`}
        onRowClick={(o) => {
          setSelectedOrder(o);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detailed Order Inspector & Lifecycle Stepper Drawer */}
      {selectedOrder && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order ${selectedOrder.orderNumber}`}
          subtitle={`Created on: ${selectedOrder.createdAt} • Channel: ${selectedOrder.source.toUpperCase()}`}
          statusBadge={{
            label: selectedOrder.status,
            variant: selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'DELIVERED' ? 'default' : 'secondary',
          }}
          metrics={[
            { label: 'Total Paid', value: `${selectedOrder.financials.totalAmount.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Platform Cut', value: `${selectedOrder.financials.platformCommission.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Net to Seller', value: `${selectedOrder.financials.netSellerPayout.toLocaleString()} DA`, icon: Store },
            { label: 'Payment State', value: selectedOrder.payment.status, icon: CreditCard },
          ]}
        >
          {/* Visual Lifecycle Stepper */}
          <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Lifecycle Stepper
            </h4>
            
            {['CANCELLED', 'REFUNDED', 'DISPUTED'].includes(selectedOrder.status) ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-600 dark:text-red-400 font-medium text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Special State: Order is currently marked as <strong>{selectedOrder.status}</strong>.</span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 text-center">
                {lifecycleStages.map((stage, idx) => {
                  const currentIdx = lifecycleStages.indexOf(selectedOrder.status);
                  const isCompleted = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  return (
                    <div key={stage} className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                          isCompleted
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground border",
                          isCurrent && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <span className={cn("text-[10px] font-semibold uppercase", isCurrent ? "text-primary" : "text-muted-foreground")}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer & Seller Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Card className="bg-card shadow-none border">
              <CardHeader className="p-3.5 pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" /> Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-1 text-xs">
                <div className="font-semibold text-foreground">{selectedOrder.customer.name}</div>
                <div className="text-muted-foreground">{selectedOrder.customer.phone}</div>
                <div className="text-muted-foreground">{selectedOrder.customer.email}</div>
                <div className="text-muted-foreground pt-1 flex items-start gap-1">
                  <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>{selectedOrder.customer.deliveryAddress}, {selectedOrder.customer.wilaya}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-none border">
              <CardHeader className="p-3.5 pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-primary" /> Merchant / Provider Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-1 text-xs">
                <div className="font-semibold text-foreground">{selectedOrder.sellerOrProvider.name}</div>
                <div className="text-muted-foreground">{selectedOrder.sellerOrProvider.phone}</div>
                <div className="text-muted-foreground">{selectedOrder.sellerOrProvider.email}</div>
                <div className="text-muted-foreground pt-1">
                  Payout: <strong className="text-foreground uppercase">{selectedOrder.sellerOrProvider.payoutMethod || 'CCP'}</strong> ({selectedOrder.sellerOrProvider.payoutAccountNumber || 'Standard Escrow'})
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itemized Order Line Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary" /> Itemized Line Items ({selectedOrder.items.length})
            </h4>
            <div className="rounded-xl border divide-y bg-card overflow-hidden">
              {selectedOrder.items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 flex-1">
                    <div className="font-semibold text-foreground">{item.name}</div>
                    <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                      {item.skuOrCode && <span>SKU: {item.skuOrCode}</span>}
                      {item.serviceScheduledDate && <span>Slot: {item.serviceScheduledDate}</span>}
                      {item.variantAttributes && (
                        <span>
                          {Object.entries(item.variantAttributes)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">
                      {item.quantity} × {item.unitPrice.toLocaleString()} DA
                    </span>
                    <div className="font-bold text-foreground text-sm">
                      {item.lineTotal.toLocaleString()} DA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Financial Breakdown */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-2xl border text-xs">
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Financial Accounting Breakdown</h4>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Items Subtotal:</span>
              <span className="font-medium text-foreground">{selectedOrder.financials.itemsSubtotal.toLocaleString()} DA</span>
            </div>
            {selectedOrder.financials.shippingFee > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Shipping / Delivery Fee:</span>
                <span className="font-medium text-foreground">+{selectedOrder.financials.shippingFee.toLocaleString()} DA</span>
              </div>
            )}
            {selectedOrder.financials.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount Promo ({selectedOrder.financials.couponCode || 'Coupon'}):</span>
                <span>-{selectedOrder.financials.discountAmount.toLocaleString()} DA</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-primary">
              <span>Platform Take-Rate Commission:</span>
              <span className="font-bold">-{selectedOrder.financials.platformCommission.toLocaleString()} DA</span>
            </div>
            <div className="border-t pt-2 mt-1 flex justify-between text-sm font-bold">
              <span>Total Customer Paid:</span>
              <span className="text-foreground">{selectedOrder.financials.totalAmount.toLocaleString()} DA</span>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
              <span>Net Merchant / Provider Settlement:</span>
              <span className="font-semibold text-foreground">{selectedOrder.financials.netSellerPayout.toLocaleString()} DA</span>
            </div>
          </div>

          {/* Courier & Tracking Details */}
          <div className="p-3.5 rounded-xl border bg-card flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Courier Tracking</span>
              <span className="font-bold uppercase text-foreground">
                {selectedOrder.delivery.courier} — {selectedOrder.delivery.trackingNumber || 'No tracking label yet'}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsTrackingModalOpen(true)} className="h-8 text-xs">
              <Truck className="h-3.5 w-3.5 mr-1" /> Update Tracking
            </Button>
          </div>

          {/* Audit Timeline */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-primary" /> State Machine Transitions & Audit Trail
            </h4>
            <div className="space-y-3 border-l-2 border-primary/30 pl-4 ml-2 py-1">
              {selectedOrder.timeline.map((event, idx) => (
                <div key={event.id || idx} className="relative space-y-0.5">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{event.actionTitle}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">{event.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By <strong className="text-foreground">{event.operator}</strong> ({event.operatorRole})
                    {event.notes ? ` — ${event.notes}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Available FSM State Actions */}
          <div className="space-y-2 pt-2 border-t">
            <span className="text-xs font-semibold text-muted-foreground block">
              Authorized State Machine Transitions:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {ORDER_FSM_TRANSITIONS[selectedOrder.status]?.map((nextState) => {
                if (nextState === 'CANCELLED') {
                  return (
                    <Button
                      key={nextState}
                      size="sm"
                      variant="destructive"
                      onClick={() => setIsCancelModalOpen(true)}
                      className="h-8 text-xs"
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" /> Cancel Order
                    </Button>
                  );
                }
                if (nextState === 'REFUNDED') {
                  return (
                    <Button
                      key={nextState}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRefundAmount(selectedOrder.financials.totalAmount);
                        setIsRefundModalOpen(true);
                      }}
                      className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Issue Refund
                    </Button>
                  );
                }
                if (nextState === 'DISPUTED') {
                  return (
                    <Button
                      key={nextState}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (selectedOrder.dispute?.isDisputed) {
                          setIsDisputeModalOpen(true);
                        } else {
                          handleTransition(selectedOrder.id, 'DISPUTED', 'Opened dispute ticket');
                        }
                      }}
                      className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Scale className="h-3.5 w-3.5 mr-1" /> Arbitrate Dispute
                    </Button>
                  );
                }
                return (
                  <Button
                    key={nextState}
                    size="sm"
                    variant="default"
                    onClick={() => handleTransition(selectedOrder.id, nextState)}
                    className="h-8 text-xs"
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-1" /> Advance to {nextState}
                  </Button>
                );
              })}
            </div>
          </div>
        </AdminDetailDrawer>
      )}

      {/* Cancel Order Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" /> Cancel Order {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A cancellation reason is required. This will cancel fulfillment and record an audit log.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCancel} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason for Cancellation *</Label>
              <Textarea
                placeholder="e.g. Customer requested cancellation / Item out of stock / Address unserviceable"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Go Back
              </Button>
              <Button type="submit" variant="destructive">
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" /> Authorize Refund for {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Authorize payment gateway reversal or wallet credit back to the customer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRefund} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Refund Amount (DA) *</Label>
              <Input
                type="number"
                min="1"
                max={selectedOrder?.financials.totalAmount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Refund Explanation / Reason</Label>
              <Textarea
                placeholder="e.g. Returned defective merchandise / Missed craftsman appointment"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRefundModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                Authorize Refund
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dispute Arbitration Modal */}
      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> Resolve Dispute for {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select final mediator outcome to settle the claim between customer and seller.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmDisputeResolution} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Arbitration Decision *</Label>
              <Select
                value={disputeResolution}
                onValueChange={(val: any) => setDisputeResolution(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REFUND_BUYER">Refund Buyer in Full</SelectItem>
                  <SelectItem value="PAY_SELLER">Release Payout to Seller (Dismiss Claim)</SelectItem>
                  <SelectItem value="DISMISSED">Dismiss Dispute (No Fault)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mediator Decision Notes *</Label>
              <Textarea
                placeholder="Document evidence findings, carrier confirmation, and final ruling..."
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Final Ruling</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Courier Tracking Modal */}
      <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Attach Courier Tracking
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter Algerian carrier tracking code (Yalidine, Procolis, Kazi Tour).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmTracking} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Delivery Partner *</Label>
              <Select
                value={courierName}
                onValueChange={(val: any) => setCourierName(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yalidine">Yalidine Express</SelectItem>
                  <SelectItem value="procolis">Procolis Delivery</SelectItem>
                  <SelectItem value="kazi_tour">Kazi Tour</SelectItem>
                  <SelectItem value="in_house">In-House Fleet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tracking Number / Waybill ID *</Label>
              <Input
                placeholder="e.g. YAL-DZ-889102"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTrackingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Tracking</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
      />
    </div>
  );
}
