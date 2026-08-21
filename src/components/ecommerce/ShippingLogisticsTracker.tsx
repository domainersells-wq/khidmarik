'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Truck, 
  Building2, 
  Home, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Package, 
  Layers, 
  ChevronRight, 
  Check, 
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ShippingRateWilaya, PackageShipment } from '@/types/ecommerce';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const ALGERIAN_WILAYAS_SHIPPING: ShippingRateWilaya[] = [
  { wilayaCode: '16', wilayaNameAr: 'الجزائر العاصمة', wilayaNameEn: 'Algiers', homeDeliveryPriceDA: 500, stopDeskPriceDA: 300, estimatedDays: '24-48 ساعة', hubName: 'مكتب ياليدين دالي إبراهيم / زرالدة' },
  { wilayaCode: '31', wilayaNameAr: 'وهران', wilayaNameEn: 'Oran', homeDeliveryPriceDA: 600, stopDeskPriceDA: 350, estimatedDays: '2-3 أيام', hubName: 'مكتب ZR Express حي الصباح' },
  { wilayaCode: '25', wilayaNameAr: 'قسنطينة', wilayaNameEn: 'Constantine', homeDeliveryPriceDA: 650, stopDeskPriceDA: 400, estimatedDays: '2-3 أيام', hubName: 'مكتب ياليدين سيدي مبروك' },
  { wilayaCode: '19', wilayaNameAr: 'سطيف', wilayaNameEn: 'Setif', homeDeliveryPriceDA: 600, stopDeskPriceDA: 350, estimatedDays: '2-3 أيام', hubName: 'مكتب ياليدين الهضاب' },
  { wilayaCode: '09', wilayaNameAr: 'البليدة', wilayaNameEn: 'Blida', homeDeliveryPriceDA: 500, stopDeskPriceDA: 300, estimatedDays: '24-48 ساعة', hubName: 'مكتب ياليدين أولاد يعيش' },
  { wilayaCode: '23', wilayaNameAr: 'عنابة', wilayaNameEn: 'Annaba', homeDeliveryPriceDA: 700, stopDeskPriceDA: 400, estimatedDays: '3-4 أيام', hubName: 'مكتب ZR Express وسط المدينة' }
];

const INITIAL_SHIPMENT: PackageShipment = {
  trackingCode: 'DZ-YAL-9841203',
  carrierName: 'Yalidine Express',
  shippingMethod: 'home',
  shippingCostDA: 500,
  destinationWilaya: 'الجزائر العاصمة',
  destinationAddress: 'دالي إبراهيم، حي 150 مسكن',
  isCombinedShipping: true,
  combinedStoresCount: 2,
  events: [
    {
      status: 'CONFIRMED',
      titleAr: 'تم تأكيد الطلب وتجهيز الطرد',
      titleEn: 'Order Confirmed & Packed',
      location: 'مستودع المتجر (Alger Store)',
      timestamp: '2026-08-20 10:30',
      descriptionAr: 'قام البائع بتغليف المنتجات وطباعة بوليصة الشحن',
      isCompleted: true
    },
    {
      status: 'SORTING_HUB',
      titleAr: 'في مركز الفرز والعبور الإقليمي',
      titleEn: 'At Regional Sorting Hub',
      location: 'مركز الفرز المركزي (الدار البيضاء)',
      timestamp: '2026-08-20 14:15',
      descriptionAr: 'تم فرز الطرد ودمجه في الشحنة الموحدة المتوجهة لبلدية العميل',
      isCompleted: true
    },
    {
      status: 'OUT_FOR_DELIVERY',
      titleAr: 'خرج مع مندوب التوصيل',
      titleEn: 'Out for Delivery',
      location: 'دالي إبراهيم وضواحيها',
      timestamp: '2026-08-20 16:45',
      descriptionAr: 'مندوب ياليدين متوجه لعنوانك الآن (رقم المندوب: 0550 •• •• 89)',
      isCompleted: true
    },
    {
      status: 'DELIVERED',
      titleAr: 'تم التسليم وتفعيل فترة الحماية',
      titleEn: 'Delivered (Buyer Protection Active)',
      location: 'موقع العميل',
      timestamp: 'المتوقع اليوم خلال ساعتين',
      descriptionAr: 'معاينة الطرد والتأكيد الرقمي للاستلام لبدء مهلة الـ 5 أيام',
      isCompleted: false
    }
  ]
};

export function ShippingLogisticsTracker() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [selectedWilaya, setSelectedWilaya] = useState<ShippingRateWilaya>(ALGERIAN_WILAYAS_SHIPPING[0]);
  const [shippingMethod, setShippingMethod] = useState<'home' | 'stop_desk'>('home');
  const [isCombined, setIsCombined] = useState(true);

  const activePrice = shippingMethod === 'home' 
    ? selectedWilaya.homeDeliveryPriceDA 
    : selectedWilaya.stopDeskPriceDA;

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(INITIAL_SHIPMENT.trackingCode);
    toast({
      title: isAr ? 'تم نسخ رقم التتبع!' : 'Tracking Code Copied!',
      description: INITIAL_SHIPMENT.trackingCode
    });
  };

  return (
    <Card className="rounded-3xl border shadow-sm space-y-6 overflow-hidden">
      
      {/* 1. Method & Wilaya Selector Header */}
      <CardHeader className="p-5 pb-3 border-b bg-slate-50 dark:bg-slate-900/60">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-black">
                {isAr ? 'خيارات التوصيل والشحن المحلي المعتمد' : 'Algerian Logistics & Shipping Methods'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? 'توصيل لباب المنزل أو استلام مخفض من مكاتب ياليدين و ZR Express' : 'Home delivery & Yalidine / ZR Express Stop-Desk options'}
              </CardDescription>
            </div>
          </div>

          <Badge className="bg-emerald-600 text-white font-bold text-xs">
            {isAr ? 'تغطية 58 ولاية' : '58 Wilayas Coverage'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        
        {/* Shipping Method Segmented Tabs & Combined Shipping Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Method A: Home Delivery */}
          <button
            type="button"
            onClick={() => setShippingMethod('home')}
            className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
              shippingMethod === 'home' 
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-primary shadow-xs' 
                : 'hover:border-slate-400 bg-card text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${shippingMethod === 'home' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Home className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{isAr ? 'توصيل للمنزل (À Domicile)' : 'Home Delivery'}</span>
                <span className="font-mono font-black text-sm">{selectedWilaya.homeDeliveryPriceDA} دج</span>
              </div>
              <span className="text-xs text-muted-foreground block mt-1">
                {isAr ? `توصيل لباب بيتك (${selectedWilaya.estimatedDays})` : `Direct to your doorstep (${selectedWilaya.estimatedDays})`}
              </span>
            </div>
          </button>

          {/* Method B: Stop-Desk */}
          <button
            type="button"
            onClick={() => setShippingMethod('stop_desk')}
            className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
              shippingMethod === 'stop_desk' 
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-primary shadow-xs' 
                : 'hover:border-slate-400 bg-card text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${shippingMethod === 'stop_desk' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{isAr ? 'استلام من المكتب (Stop-Desk)' : 'Stop-Desk Pickup'}</span>
                <span className="font-mono font-black text-sm text-emerald-600">{selectedWilaya.stopDeskPriceDA} دج</span>
              </div>
              <span className="text-xs text-muted-foreground block mt-1">
                {isAr ? `استلام من: ${selectedWilaya.hubName}` : `Pickup from: ${selectedWilaya.hubName}`}
              </span>
            </div>
          </button>
        </div>

        {/* Combined Shipping Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300 block">
                {isAr ? 'الشحن المجمع من متاجر مختلفة (Combined Shipping):' : 'Combined Multi-Store Shipping:'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isAr ? 'تجميع طلبياتك من متجرين مختلفين في طرد واحد لتوفير 500 دج تكلفة شحن' : 'Consolidate multiple store orders in 1 parcel to save shipping costs'}
              </span>
            </div>
          </div>
          <Switch checked={isCombined} onCheckedChange={setIsCombined} />
        </div>

        {/* Live Parcel Step-by-Step Tracking Timeline */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">{isAr ? 'رقم التتبع المباشر:' : 'Live Tracking Code:'}</span>
              <span className="font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border">
                {INITIAL_SHIPMENT.trackingCode}
              </span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyTracking} title="نسخ الكود">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Badge variant="outline" className="text-xs font-bold font-mono">
              {INITIAL_SHIPMENT.carrierName}
            </Badge>
          </div>

          {/* Timeline Events */}
          <div className="space-y-4 relative pl-4 sm:pl-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {INITIAL_SHIPMENT.events.map((event, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                {/* Status Dot */}
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0 z-10 ${
                  event.isCompleted ? 'bg-emerald-600 shadow-sm' : 'bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-100 dark:ring-slate-900'
                }`}>
                  {event.isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Clock className="h-3.5 w-3.5 text-slate-500" />}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h5 className={`font-bold text-xs ${event.isCompleted ? 'text-slate-900 dark:text-white' : 'text-muted-foreground'}`}>
                      {isAr ? event.titleAr : event.titleEn}
                    </h5>
                    <span className="text-[10px] font-mono text-muted-foreground">{event.timestamp}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    {isAr ? event.descriptionAr : event.location} • <span className="font-semibold">{event.location}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
