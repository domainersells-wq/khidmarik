'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Truck, Package, Clock, CheckCircle2, 
  MapPin, Copy, ExternalLink, ShieldCheck, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { customerOrderService } from '@/services/customerOrderService';
import { CustomerOrder } from '@/types/customerOrder';
import { cn } from '@/lib/utils';

export default function CustomerOrderTrackingPage() {
  const params = useParams();
  const { toast } = useToast();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadOrder = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const data = await customerOrderService.getOrderDetails(orderId);
      setOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const copyTracking = () => {
    if (!order?.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    toast({ title: 'Tracking # Copied', description: order.trackingNumber });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 py-10 px-4 max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-card rounded-xl" />
        <div className="h-44 bg-card rounded-2xl border" />
        <div className="h-80 bg-card rounded-2xl border" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/20 py-16 px-4 text-center">
        <Card className="max-w-md mx-auto p-8 rounded-2xl shadow-sm space-y-4">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Tracking Data Not Found</h2>
          <Button asChild className="rounded-xl">
            <Link href="/account/orders">Back to My Orders</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const trackingSteps = order.trackingSteps || [
    { id: '1', title: 'Order Placed & Payment Verified', location: 'Khidmatik Platform', timestamp: order.createdAt, status: 'completed' },
    { id: '2', title: 'Seller Packaged Parcel', location: `${order.storeName} Hub`, timestamp: order.createdAt, status: 'completed' },
    { id: '3', title: 'Package Dispatched to Carrier', location: 'Alger Regional Hub', timestamp: order.updatedAt, status: 'current' },
    { id: '4', title: 'In Transit', location: 'Distribution Station', timestamp: 'Expected soon', status: 'pending' },
    { id: '5', title: 'Out for Delivery', location: order.shippingAddress.commune, timestamp: 'Expected soon', status: 'pending' },
    { id: '6', title: 'Delivered', location: order.shippingAddress.wilaya, timestamp: 'Expected soon', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back Button */}
        <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href={`/account/orders/${order.id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to Order {order.orderNumber}
          </Link>
        </Button>

        {/* Carrier Header Card */}
        <Card className="border shadow-sm bg-card rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Shipping Carrier</span>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                <span className="uppercase">{order.shippingProvider}</span> Delivery
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={copyTracking} className="rounded-xl text-xs h-9">
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Waybill #
              </Button>
              {order.trackingUrl && (
                <Button asChild size="sm" className="rounded-xl text-xs h-9 font-medium">
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                    Carrier Portal <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Waybill Tracking Number</span>
              <span className="font-mono font-bold text-foreground text-sm">{order.trackingNumber || 'Pending scan'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Estimated Delivery</span>
              <span className="font-semibold text-foreground text-sm">{order.estimatedDeliveryDate || '2-4 business days'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Destination Wilaya</span>
              <span className="font-semibold text-foreground text-sm">{order.shippingAddress.wilaya}</span>
            </div>
          </div>
        </Card>

        {/* AliExpress Visual Carrier Milestones */}
        <Card className="border shadow-sm bg-card rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Live Tracking Timeline
          </h2>

          <div className="space-y-6 border-l-2 border-primary/40 pl-6 ml-3 py-1">
            {trackingSteps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';

              return (
                <div key={step.id || idx} className="relative space-y-1">
                  <div
                    className={cn(
                      "absolute -left-[33px] top-0.5 h-4 w-4 rounded-full flex items-center justify-center ring-4 ring-background",
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isCurrent
                        ? "bg-amber-500 text-white animate-pulse ring-amber-500/20"
                        : "bg-muted text-muted-foreground border"
                    )}
                  >
                    {isCompleted && <Check className="h-2.5 w-2.5" />}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className={cn("text-xs font-bold", isCurrent ? "text-primary text-sm" : isCompleted ? "text-foreground" : "text-muted-foreground")}>
                      {step.title}
                    </h3>
                    <span className="text-[11px] text-muted-foreground font-mono">{step.timestamp}</span>
                  </div>

                  {step.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {step.location}
                    </p>
                  )}

                  {step.notes && (
                    <p className="text-[11px] text-muted-foreground/80 bg-muted/30 p-2 rounded-lg mt-1">
                      {step.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Buyer Protection Reminder */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>If your package does not arrive or differs from the listing, you can request a full refund within 15 days of expected delivery.</span>
        </div>
      </div>
    </div>
  );
}
