'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Printer, 
  ExternalLink, 
  Send, 
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { shippingManagerService } from '@/services/shipping/ShippingManagerService';
import type { Shipment, InternalShipmentStatus } from '@/types/shipping';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SellerShipmentsManagerProps {
  sellerId?: string;
}

export function SellerShipmentsManager({ sellerId = 'str_1' }: SellerShipmentsManagerProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRequestingPickup, setIsRequestingPickup] = useState<string | null>(null);

  const loadShipments = async () => {
    setIsLoading(true);
    try {
      const data = await shippingManagerService.getSellerShipments(sellerId);
      setShipments(data);
    } catch (e) {
      console.error('Failed to load seller shipments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, [sellerId]);

  const handleRequestPickup = async (trackingNumber: string) => {
    setIsRequestingPickup(trackingNumber);
    try {
      await shippingManagerService.requestPickup(trackingNumber);
      toast({
        title: 'تم إرسال طلب الاستلام بنجاح ✓',
        description: 'تم إخطار شركة الشحن لجمع الطرد من مستودعك.',
      });
      loadShipments();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setIsRequestingPickup(null);
    }
  };

  const filtered = shipments.filter(s => {
    if (statusTab === 'awaiting') return s.status === 'pending' || s.status === 'pickup_requested';
    if (statusTab === 'in_transit') return s.status === 'picked_up' || s.status === 'in_transit' || s.status === 'out_for_delivery';
    if (statusTab === 'delivered') return s.status === 'delivered';
    if (statusTab === 'failed') return s.status === 'failed_delivery' || s.status === 'returned' || s.status === 'delivery_attempted';
    return true;
  }).filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.tracking_number.toLowerCase().includes(q) ||
           s.order_id.toLowerCase().includes(q) ||
           s.recipient_name.toLowerCase().includes(q) ||
           s.recipient_phone.includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-primary/15 via-card to-card border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              شحنات المتجر
            </Badge>
            <span className="text-xs text-muted-foreground">• إدارة عمليات التوصيل والاستلام</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            إدارة شحنات وطرود المتجر (Shipment Tracking)
          </h2>
          <p className="text-xs text-muted-foreground">
            طلب زيارة المندوب لاستلام الطرود، طباعة بوليصات الشحن، ومتابعة تحصيل مبالغ الـ COD.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadShipments}
          className="rounded-xl font-bold h-10 px-4 text-xs gap-1.5 self-start md:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>تحديث الشحنات</span>
        </Button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border border-border/40">
          <Button
            variant={statusTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusTab('all')}
            className="rounded-xl text-xs h-8"
          >
            جميع الشحنات ({shipments.length})
          </Button>
          <Button
            variant={statusTab === 'awaiting' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusTab('awaiting')}
            className="rounded-xl text-xs h-8"
          >
            في انتظار الاستلام ({shipments.filter(s => s.status === 'pending' || s.status === 'pickup_requested').length})
          </Button>
          <Button
            variant={statusTab === 'in_transit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusTab('in_transit')}
            className="rounded-xl text-xs h-8"
          >
            قيد التوصيل ({shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery' || s.status === 'picked_up').length})
          </Button>
          <Button
            variant={statusTab === 'delivered' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusTab('delivered')}
            className="rounded-xl text-xs h-8 text-emerald-600"
          >
            تم التسليم ({shipments.filter(s => s.status === 'delivered').length})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالرقم أو الزبون..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Shipments Table */}
      <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">رقم التتبع والطلب</th>
                  <th className="p-3.5">المستلم والوجهة</th>
                  <th className="p-3.5">شركة الشحن</th>
                  <th className="p-3.5">مبلغ الدفع (COD)</th>
                  <th className="p-3.5">الحالة الحالية</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                      <span>جارِ تحميل شحنات المتجر...</span>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 space-y-0.5">
                        <Link href={`/track/${s.tracking_number}`} className="font-mono font-bold text-primary hover:underline block">
                          {s.tracking_number}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">طلب: {s.order_number || s.order_id}</div>
                      </td>

                      <td className="p-3.5 space-y-0.5">
                        <div className="font-bold text-foreground">{s.recipient_name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{s.delivery_wilaya} ({s.delivery_commune})</span>
                        </div>
                      </td>

                      <td className="p-3.5 space-y-0.5">
                        <div className="font-semibold text-foreground">{s.provider_name}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">
                          {s.shipping_method_code === 'stop_desk' ? 'استلام مكتب' : 'توصيل لباب المنزل'}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-foreground">{s.cod_amount.toLocaleString('fr-DZ')} دج</div>
                        <Badge variant={s.cod_status === 'collected' ? 'default' : 'outline'} className="text-[9px] font-sans">
                          {s.cod_status === 'collected' ? 'تم التحصيل ✓' : 'في انتظار التحصيل'}
                        </Badge>
                      </td>

                      <td className="p-3.5">
                        <Badge 
                          className={cn(
                            "px-2.5 py-0.5 text-[11px] font-bold rounded-full",
                            s.status === 'delivered' && "bg-emerald-600 text-white",
                            s.status === 'out_for_delivery' && "bg-amber-600 text-white",
                            s.status === 'in_transit' && "bg-blue-600 text-white",
                            s.status === 'picked_up' && "bg-indigo-600 text-white",
                            s.status === 'pending' && "bg-purple-600 text-white",
                            s.status === 'pickup_requested' && "bg-cyan-600 text-white",
                            s.status === 'failed_delivery' && "bg-destructive text-white",
                            s.status === 'returned' && "bg-slate-700 text-white"
                          )}
                        >
                          {s.status === 'delivered' && 'تم التسليم'}
                          {s.status === 'out_for_delivery' && 'مع المندوب للتسليم'}
                          {s.status === 'in_transit' && 'في الطريق'}
                          {s.status === 'picked_up' && 'تم الاستلام'}
                          {s.status === 'pending' && 'قيد التجهيز'}
                          {s.status === 'pickup_requested' && 'طلب استلام معلق'}
                          {s.status === 'failed_delivery' && 'تعذر التسليم'}
                          {s.status === 'returned' && 'مرتجع للمتجر'}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {s.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleRequestPickup(s.tracking_number)}
                              disabled={isRequestingPickup === s.tracking_number}
                              className="rounded-xl text-xs h-8 bg-primary text-primary-foreground gap-1"
                            >
                              <Send className="h-3 w-3" />
                              <span>طلب استلام</span>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-xl text-xs h-8 gap-1"
                          >
                            <Link href={`/track/${s.tracking_number}`}>
                              <ExternalLink className="h-3 w-3" />
                              <span>تتبع</span>
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      لا توجد شحنات في هذا القسم.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
