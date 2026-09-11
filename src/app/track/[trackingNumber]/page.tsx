'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Phone, 
  AlertCircle, 
  Printer, 
  Search, 
  Copy, 
  Check, 
  Building2,
  ExternalLink,
  ArrowRight,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { shippingManagerService } from '@/services/shipping/ShippingManagerService';
import type { PublicTrackingResult, InternalShipmentStatus } from '@/types/shipping';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { CustomerInspectionModal } from '@/components/delivery/CustomerInspectionModal';
import { LiveFleetTrackingMap } from '@/components/maps/LiveFleetTrackingMap';

const STATUS_STEPS: { key: InternalShipmentStatus; label: string; labelAr: string; icon: any }[] = [
  { key: 'pending', label: 'Processing', labelAr: 'تجهيز في المتجر', icon: Package },
  { key: 'picked_up', label: 'Picked Up', labelAr: 'تم الاستلام', icon: Building2 },
  { key: 'in_transit', label: 'In Transit', labelAr: 'في الطريق', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', labelAr: 'مع المندوب للتسليم', icon: MapPin },
  { key: 'delivered', label: 'Delivered', labelAr: 'تم التسليم بنجاح', icon: CheckCircle2 },
];

function getStatusStepIndex(status: InternalShipmentStatus): number {
  switch (status) {
    case 'pending':
    case 'pickup_requested':
      return 0;
    case 'picked_up':
      return 1;
    case 'in_transit':
    case 'arrived_at_destination':
      return 2;
    case 'out_for_delivery':
    case 'delivery_attempted':
      return 3;
    case 'delivered':
      return 4;
    case 'failed_delivery':
      return 3;
    case 'returned':
    case 'cancelled':
    case 'exception':
      return 0;
    default:
      return 0;
  }
}

function TrackContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlTrackingNumber = (params?.trackingNumber as string) || searchParams.get('number') || searchParams.get('q') || 'KHM-2026-904128';

  const [trackingNumber, setTrackingNumber] = useState(urlTrackingNumber);
  const [searchInput, setSearchInput] = useState(urlTrackingNumber);
  const [trackingData, setTrackingData] = useState<PublicTrackingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!trackingNumber) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await shippingManagerService.getPublicTracking(trackingNumber);
        setTrackingData(res);
      } catch (err) {
        console.error('Failed loading tracking:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [trackingNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setTrackingNumber(searchInput.trim());
    router.replace(`/track/${encodeURIComponent(searchInput.trim())}`);
  };

  const currentStepIdx = trackingData ? getStatusStepIndex(trackingData.status) : 0;
  const isDelivered = trackingData?.status === 'delivered';
  const isFailed = trackingData?.status === 'failed_delivery' || trackingData?.status === 'delivery_attempted';
  const isReturned = trackingData?.status === 'returned';

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 space-y-8">
      {/* Top Banner */}
      <section className="bg-gradient-to-b from-primary/15 via-primary/5 to-transparent pt-10 pb-8 px-4 border-b border-border/40">
        <div className="container mx-auto max-w-4xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>نظام التتبع الآمن والمباشر • خدماتك اللوجستية</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-headline">
            تتبع شحنتك وطردك لحظة بلحظة
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            أدخل رقم التتبع الخاص بك لمتابعة تحركات الطرد وحالة التسليم المباشرة بدقة
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex items-center max-w-xl mx-auto mt-4 bg-card rounded-2xl border-2 border-border shadow-md p-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <div className="pl-3 pr-2 text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="مثال: KHM-2026-904128 أو KHD-ORD-2026-8801"
              className="flex-1 border-0 bg-transparent text-sm sm:text-base font-semibold placeholder:font-normal focus-visible:ring-0 shadow-none px-2"
            />
            <Button type="submit" className="rounded-xl font-bold px-6 h-11 bg-primary text-primary-foreground shadow-sm">
              تتبع الآن
            </Button>
          </form>

          {/* Quick Demo Tracking Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <span>نماذج سريعة:</span>
            <button
              onClick={() => { setSearchInput('KHM-2026-904128'); setTrackingNumber('KHM-2026-904128'); }}
              className="font-mono text-[11px] underline hover:text-primary"
            >
              KHM-2026-904128 (ياليدين)
            </button>
            <span>•</span>
            <button
              onClick={() => { setSearchInput('KHM-2026-583912'); setTrackingNumber('KHM-2026-583912'); }}
              className="font-mono text-[11px] underline hover:text-primary"
            >
              KHM-2026-583912 (زد آر)
            </button>
            <span>•</span>
            <button
              onClick={() => { setSearchInput('KHM-2026-119482'); setTrackingNumber('KHM-2026-119482'); }}
              className="font-mono text-[11px] underline hover:text-primary"
            >
              KHM-2026-119482 (مايسترو)
            </button>
          </div>
        </div>
      </section>

      {/* Main Tracking Details */}
      <main className="container mx-auto px-4 max-w-5xl">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">جارِ جلب أحدث بيانات التتبع اللحظية...</p>
          </div>
        ) : trackingData ? (
          <div className="space-y-6 animate-fade-in">
            {/* Phase 3: Delivery Inspection Session Module */}
            <CustomerInspectionModal 
              trackingNumber={trackingData.tracking_number}
            />

            {/* Overview Card */}
            <Card className="rounded-3xl border border-border/80 shadow-md overflow-hidden bg-card">
              <div className="p-6 bg-muted/20 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">رقم التتبع:</span>
                    <span className="font-mono font-extrabold text-base sm:text-lg text-primary">{trackingData.tracking_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>الناقل اللوجستي: <strong className="text-foreground">{trackingData.provider_name}</strong></span>
                    <span>•</span>
                    <span>نوع التوصيل: <strong className="text-foreground">{trackingData.delivery_type_name_ar}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge 
                    className={cn(
                      "px-3.5 py-1 text-xs font-bold rounded-full",
                      isDelivered && "bg-emerald-600 text-white",
                      trackingData.status === 'out_for_delivery' && "bg-amber-600 text-white animate-pulse",
                      trackingData.status === 'in_transit' && "bg-blue-600 text-white",
                      trackingData.status === 'picked_up' && "bg-indigo-600 text-white",
                      trackingData.status === 'pending' && "bg-purple-600 text-white",
                      isFailed && "bg-destructive text-white",
                      isReturned && "bg-slate-700 text-white"
                    )}
                  >
                    {trackingData.status_label_ar}
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="rounded-xl h-9 text-xs gap-1.5 font-medium hidden sm:flex"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>طباعة الوصل</span>
                  </Button>
                </div>
              </div>

              {/* Progress Stepper Bar */}
              <div className="p-6 sm:p-8">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 start-6 end-6 h-1 bg-muted rounded-full z-0 hidden md:block">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                    {STATUS_STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step.key} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                          <div 
                            className={cn(
                              "h-11 w-11 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 shadow-sm",
                              isCompleted 
                                ? "bg-primary text-primary-foreground border-primary shadow-primary/20" 
                                : "bg-card text-muted-foreground border-border",
                              isCurrent && "ring-4 ring-primary/20 scale-110"
                            )}
                          >
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className={cn("text-xs sm:text-sm font-bold", isCompleted ? "text-foreground" : "text-muted-foreground")}>
                              {step.labelAr}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-sans">
                              {step.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Live GPS Fleet Tracking Map & ETA Counter */}
            <LiveFleetTrackingMap
              shipmentNumber={trackingData.tracking_number}
              courierName={(trackingData as any).delivery_person_name || 'حمزة بن عاشور'}
              courierPhone={(trackingData as any).delivery_person_phone || '0550 12 34 56'}
              destinationWilaya={`${trackingData.destination_wilaya || '22'} - ${trackingData.destination_commune || 'الولاية'}`}
              initialEtaMinutes={14}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline History (2 Columns) */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="rounded-3xl border border-border/80 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>سجل مراحل وتحركات الشحنة (Shipment Timeline)</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      تحديثات دقيقة مسجلة ومطابقة لحظياً مع شركة {trackingData.provider_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="relative border-r-2 border-primary/30 mr-4 space-y-8 pr-6">
                      {trackingData.timeline.map((event, idx) => (
                        <div key={event.id} className="relative group">
                          {/* Circle dot on line */}
                          <div 
                            className={cn(
                              "absolute -right-[31px] top-0 h-4 w-4 rounded-full border-2 border-background transition-all",
                              idx === trackingData.timeline.length - 1 ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/40"
                            )}
                          />

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-sm font-bold text-foreground">
                                {event.title_ar}
                              </h4>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {new Date(event.event_at).toLocaleString('ar-DZ', { 
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>

                            {event.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {event.description}
                              </p>
                            )}

                            {event.location && (
                              <div className="pt-1 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                                  <MapPin className="h-3 w-3 text-primary" />
                                  <span>{event.location}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Destination & Courier Info (1 Column) */}
              <div className="space-y-6">
                {/* Security Verification Badge */}
                <Card className="rounded-3xl border border-primary/30 bg-primary/5 shadow-sm p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">حماية وضمان الاستلام</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    يتم تسليم الطرد مع التحقق المباشر من هاتف المستلم لضمان الأمان التام وعدم ضياع أي شحنة.
                  </p>
                </Card>

                {/* Destination Address Card */}
                <Card className="rounded-3xl border border-border/80 shadow-sm p-5 space-y-3">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>مسار وتوجيه الشحنة</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">من الولاية:</span>
                      <strong className="text-foreground">{trackingData.origin_wilaya}</strong>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">إلى الوجهة:</span>
                      <strong className="text-foreground">{trackingData.destination_wilaya} ({trackingData.destination_commune})</strong>
                    </div>
                  </div>

                  {trackingData.driver_name && (
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/40 space-y-1">
                      <div className="text-[11px] text-muted-foreground">مندوب التوصيل الميداني:</div>
                      <div className="text-xs font-bold text-foreground">{trackingData.driver_name}</div>
                      {trackingData.driver_phone && (
                        <div className="text-xs font-mono text-primary font-bold">{trackingData.driver_phone}</div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">لم يتم العثور على الشحنة</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              يرجى التأكد من كتابة رقم التتبع بالشكل الصحيح كما وصلك في إشعار الطلب.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function PublicTrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Clock className="h-8 w-8 animate-spin text-primary" /></div>}>
      <TrackContent />
    </Suspense>
  );
}
