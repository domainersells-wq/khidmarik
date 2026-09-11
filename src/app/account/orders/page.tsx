'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Package, Truck, Clock, CheckCircle2, RotateCcw, AlertTriangle, 
  Search, Eye, Store, ShieldCheck, ChevronRight, Ban, MessageSquare, 
  Receipt, ShoppingBag, ExternalLink, ArrowRight, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { customerOrderService } from '@/services/customerOrderService';
import { CustomerOrder, CustomerOrderStatus } from '@/types/customerOrder';
import { cn } from '@/lib/utils';

export default function CustomerOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dialog States
  const [confirmReceiptOrder, setConfirmReceiptOrder] = useState<CustomerOrder | null>(null);
  const [isConfirmReceiptOpen, setIsConfirmReceiptOpen] = useState<boolean>(false);

  const [cancelOrder, setCancelOrder] = useState<CustomerOrder | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  const [refundOrder, setRefundOrder] = useState<CustomerOrder | null>(null);
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);
  const [refundReason, setRefundReason] = useState<string>('product_defect');
  const [refundDescription, setRefundDescription] = useState<string>('');

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await customerOrderService.getCustomerOrders({
        tab: activeTab as any,
        search: searchQuery,
      });
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab, searchQuery]);

  const handleConfirmReceipt = async () => {
    if (!confirmReceiptOrder) return;
    const res = await customerOrderService.confirmReceipt(confirmReceiptOrder.id, 'Karim Hadjadj');
    if (res.success) {
      toast({
        title: 'Receipt Confirmed! 🎉',
        description: `Order ${confirmReceiptOrder.orderNumber} completed. Escrow released to seller.`,
      });
      setIsConfirmReceiptOpen(false);
      loadOrders();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrder || !cancelReason.trim()) return;
    const res = await customerOrderService.cancelOrder(cancelOrder.id, cancelReason.trim());
    if (res.success) {
      toast({
        title: 'Order Cancelled',
        description: `Order ${cancelOrder.orderNumber} has been cancelled.`,
      });
      setIsCancelOpen(false);
      setCancelReason('');
      loadOrders();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder || !refundDescription.trim()) return;
    const res = await customerOrderService.requestRefund(
      refundOrder.id,
      refundReason,
      refundDescription.trim()
    );
    if (res.success) {
      toast({
        title: 'Refund Claim Submitted',
        description: `Your refund request for order ${refundOrder.orderNumber} has been sent to the seller for review.`,
      });
      setIsRefundOpen(false);
      setRefundDescription('');
      loadOrders();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'to_pay', label: 'To Pay' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'refunds', label: 'Returns & Refunds' },
  ];

  const getStatusBadge = (status: CustomerOrderStatus) => {
    const config: Record<CustomerOrderStatus, { label: string; className: string }> = {
      pending_payment: { label: 'Awaiting Payment', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200' },
      paid: { label: 'Payment Confirmed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200' },
      processing: { label: 'Seller Processing', className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200' },
      ready_to_ship: { label: 'Ready to Ship', className: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200' },
      shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200' },
      in_transit: { label: 'In Transit', className: 'bg-indigo-600 text-white border-transparent' },
      out_for_delivery: { label: 'Out for Delivery', className: 'bg-cyan-600 text-white border-transparent' },
      delivered: { label: 'Delivered', className: 'bg-emerald-600 text-white border-transparent' },
      completed: { label: 'Completed', className: 'bg-emerald-700 text-white border-transparent' },
      cancel_requested: { label: 'Cancellation Requested', className: 'bg-rose-100 text-rose-800 border-rose-200' },
      cancelled: { label: 'Cancelled', className: 'bg-rose-600 text-white border-transparent' },
      refund_requested: { label: 'Refund Requested', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      refund_processing: { label: 'Refund Processing', className: 'bg-orange-500 text-white border-transparent' },
      refunded: { label: 'Refunded', className: 'bg-orange-600 text-white border-transparent' },
      disputed: { label: 'Under Dispute', className: 'bg-red-600 text-white border-transparent animate-pulse' },
    };

    const c = config[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return (
      <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", c.className)}>
        {c.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <ShoppingBag className="h-7 w-7 text-primary" /> My Orders
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track parcel shipments, manage receipts, and inspect Buyer Protection guarantees.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order #, store, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 text-xs h-9 bg-card rounded-xl shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* AliExpress-Style Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-card rounded-2xl border shadow-sm overflow-x-auto custom-sidebar-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-card border animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="border shadow-sm text-center py-16 px-4 space-y-4 rounded-2xl">
            <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Package className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">No orders found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery ? `No matching orders for "${searchQuery}".` : 'You haven\'t placed any orders in this category yet.'}
              </p>
            </div>
            <Button asChild size="sm" className="rounded-xl font-medium">
              <Link href="/marketplace">Explore Marketplace</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isDelivered = order.status === 'delivered';
              const isShippedOrInTransit = ['shipped', 'in_transit', 'out_for_delivery'].includes(order.status);
              const canCancel = ['pending_payment', 'paid', 'processing'].includes(order.status);
              const canRefund = ['delivered', 'completed'].includes(order.status) && order.protection.isEligibleForRefund;

              return (
                <Card key={order.id} className="border shadow-sm bg-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200">
                  
                  {/* Order Card Header */}
                  <div className="p-4 bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="font-mono font-bold text-foreground text-sm">
                        {order.orderNumber}
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <div className="text-muted-foreground">
                        {order.createdAt}
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <Link
                        href={`/store-express?store=${order.storeSlug || order.storeId}`}
                        className="font-medium text-foreground hover:text-primary flex items-center gap-1"
                      >
                        <Store className="h-3.5 w-3.5 text-primary" />
                        {order.storeName}
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Order Items Body */}
                  <CardContent className="p-4 space-y-4">
                    <div className="divide-y">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted overflow-hidden shrink-0 border relative">
                              <img
                                src={item.productImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200'}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2" title={item.productName}>
                                {item.productName}
                              </h4>
                              {item.variantName && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {item.variantName}
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {item.quantity} × {item.unitPrice.toLocaleString()} DA
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground hidden sm:block">
                              {item.quantity} × {item.unitPrice.toLocaleString()} DA
                            </div>
                            <div className="font-bold text-foreground text-sm">
                              {item.totalPrice.toLocaleString()} DA
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & Estimated Date Line */}
                    {order.trackingNumber && (
                      <div className="p-2.5 bg-muted/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            Carrier: <strong className="text-foreground uppercase">{order.shippingProvider}</strong> ({order.trackingNumber})
                          </span>
                        </div>
                        {order.estimatedDeliveryDate && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Estimated: <strong className="text-foreground">{order.estimatedDeliveryDate}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Actions & Financial Summary */}
                    <div className="pt-3 border-t flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="text-xs space-y-0.5">
                        <span className="text-muted-foreground">
                          Total ({order.items.reduce((acc, i) => acc + i.quantity, 0)} items):
                        </span>{' '}
                        <span className="font-bold text-foreground text-base">
                          {order.totalAmount.toLocaleString()} DA
                        </span>
                        {order.shippingFee > 0 && (
                          <span className="text-[11px] text-muted-foreground block">
                            (Includes {order.shippingFee.toLocaleString()} DA shipping)
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        
                        {/* Confirm Receipt (When delivered) */}
                        {isDelivered && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9"
                            onClick={() => {
                              setConfirmReceiptOrder(order);
                              setIsConfirmReceiptOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Confirm Receipt
                          </Button>
                        )}

                        {/* Track Order (When shipped / delivered) */}
                        {(isShippedOrInTransit || isDelivered) && (
                          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs h-9">
                            <Link href={`/account/orders/${order.id}/tracking`}>
                              <Truck className="h-3.5 w-3.5 mr-1.5" /> Track Package
                            </Link>
                          </Button>
                        )}

                        {/* Request Refund */}
                        {canRefund && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs h-9 text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                            onClick={() => {
                              setRefundOrder(order);
                              setIsRefundOpen(true);
                            }}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Request Refund
                          </Button>
                        )}

                        {/* Cancel Order */}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl text-xs h-9 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setCancelOrder(order);
                              setIsCancelOpen(true);
                            }}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1.5" /> Cancel
                          </Button>
                        )}

                        {/* View Details */}
                        <Button asChild size="sm" variant="default" className="rounded-xl text-xs h-9 font-medium">
                          <Link href={`/account/orders/${order.id}`}>
                            View Order <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Receipt Modal */}
      <Dialog open={isConfirmReceiptOpen} onOpenChange={setIsConfirmReceiptOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" /> Confirm Delivery Receipt?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Have you received order <strong>{confirmReceiptOrder?.orderNumber}</strong> in good condition? Confirming receipt will complete the transaction and release payment to <strong>{confirmReceiptOrder?.storeName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmReceiptOpen(false)}>
              Not Yet Received
            </Button>
            <Button onClick={handleConfirmReceipt} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Yes, Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Modal */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" /> Cancel Order {cancelOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please tell us why you want to cancel this order. If already paid, funds will be returned to your payment method.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelOrder} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cancellation Reason *</Label>
              <Textarea
                placeholder="e.g. Changed my mind / Ordered duplicate items / Need different size"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)}>
                Keep Order
              </Button>
              <Button type="submit" variant="destructive">
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Refund Modal */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-600 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Request Return / Refund
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submit a refund request for order <strong>{refundOrder?.orderNumber}</strong>. The merchant will review your request under Buyer Protection.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestRefund} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason for Refund *</Label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full h-9 rounded-xl border bg-background px-3 text-xs font-medium"
              >
                <option value="product_defect">Defective or damaged product</option>
                <option value="not_as_described">Item not as described on storefront</option>
                <option value="missing_parts">Missing accessories or items</option>
                <option value="wrong_item">Received incorrect variant/model</option>
                <option value="late_delivery">Arrived excessively late</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Describe the issue *</Label>
              <Textarea
                placeholder="Provide detailed description of the problem..."
                value={refundDescription}
                onChange={(e) => setRefundDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Protected by Khidmatik Escrow until dispute resolution.</span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRefundOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                Submit Refund Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
