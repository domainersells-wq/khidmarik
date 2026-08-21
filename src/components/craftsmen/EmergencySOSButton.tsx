'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  AlertOctagon, 
  Flame, 
  Droplets, 
  Zap, 
  Key, 
  Wind, 
  ShieldAlert, 
  Radio, 
  MapPin, 
  Clock, 
  Sparkles,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { ServiceEmergencyCategory } from '@/types/craftsmen';

interface EmergencySOSButtonProps {
  onTriggerSOS: (category: ServiceEmergencyCategory, radiusKm: number, surgeFeeDA: number) => void;
  className?: string;
}

export function EmergencySOSButton({ onTriggerSOS, className }: EmergencySOSButtonProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceEmergencyCategory>('plumbing_leak');
  const [radiusKm, setRadiusKm] = useState<number>(8);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const categories: { id: ServiceEmergencyCategory; titleAr: string; titleEn: string; icon: any; surgeDA: number; descAr: string; descEn: string }[] = [
    {
      id: 'plumbing_leak',
      titleAr: 'تسرب مياه طارئ / انفجار أنبوب',
      titleEn: 'Severe Plumbing Leak / Burst Pipe',
      icon: Droplets,
      surgeDA: 1500,
      descAr: 'استجابة فورية لوقف تدفق المياه والأضرار',
      descEn: 'Immediate shutoff & pipe repair response'
    },
    {
      id: 'electrical_outage',
      titleAr: 'انقطاع كهرباء / شرارة وماس كهربائي',
      titleEn: 'Electrical Short / Power Outage',
      icon: Zap,
      surgeDA: 2000,
      descAr: 'فحص عاجل لقواطع الدوائر وتأمين المنزل',
      descEn: 'Circuit breaker diagnosis & safety restore'
    },
    {
      id: 'locksmith_locked_out',
      titleAr: 'قفل الباب / مفتاح عالق أو ضائع',
      titleEn: 'Lockout / Broken Key Emergency',
      icon: Key,
      surgeDA: 1800,
      descAr: 'فتح الأقفال الآمن دون إتلاف الباب',
      descEn: 'Non-destructive rapid door unlocking'
    },
    {
      id: 'gas_leak_safety',
      titleAr: 'رائحة تسرب غاز / خلل في التدفئة',
      titleEn: 'Gas Smell / Heating Leak Alert',
      icon: Flame,
      surgeDA: 2500,
      descAr: 'تدخل أمني عاجل لحماية الأرواح والمنشأة',
      descEn: 'Critical emergency gas line containment'
    },
    {
      id: 'ac_heating_failure',
      titleAr: 'عطل تكييف وتدفئة في ظروف قاسية',
      titleEn: 'HVAC Critical Breakdown',
      icon: Wind,
      surgeDA: 1500,
      descAr: 'صيانة طارئة للمكيفات والمضخات الحرارية',
      descEn: 'Urgent cooling & heating restoration'
    }
  ];

  const currentCategory = categories.find(c => c.id === selectedCategory) || categories[0];

  const handleConfirmSOS = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      setIsOpen(false);
      onTriggerSOS(selectedCategory, radiusKm, currentCategory.surgeDA);
    }, 1000);
  };

  return (
    <>
      {/* SOS Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`group relative flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-sm shadow-xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-red-400/40 z-30 ${className || ''}`}
      >
        {/* Pulsing beacon waves */}
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white" />
        </span>
        <AlertOctagon className="h-5 w-5 animate-pulse" />
        <span className="tracking-wide uppercase">
          {isAr ? 'طلب طوارئ فوري (SOS)' : 'Emergency SOS Dispatch'}
        </span>
      </button>

      {/* SOS Request Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl p-6 bg-slate-950 text-white border-red-800/80 shadow-2xl overflow-hidden">
          {/* Header */}
          <DialogHeader className="pb-3 border-b border-red-900/40">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 shadow-inner">
                <AlertOctagon className="h-7 w-7 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold text-red-500 font-headline">
                    {isAr ? 'نداء الطوارئ الفوري (SOS)' : 'Emergency SOS Craftsman Dispatch'}
                  </DialogTitle>
                  <Badge className="bg-red-600 text-white text-[10px] uppercase font-bold animate-pulse">
                    Live 24/7
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  {isAr 
                    ? 'بث فوري لأقرب الحرفيين المتاحين في محيطك مع أولوية قصوى وضمان وصول سريع' 
                    : 'Instant concurrent broadcast to on-duty verified handymen within your radius'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-5 pt-3">
            {/* Category Select Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isAr ? '1. اختر نوع حالة الطوارئ:' : '1. Select Emergency Problem:'}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-right transition-all ${
                        isSelected 
                          ? 'border-red-500 bg-red-950/40 shadow-md shadow-red-950/60 ring-1 ring-red-500' 
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-white leading-tight">
                          {isAr ? cat.titleAr : cat.titleEn}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {isAr ? cat.descAr : cat.descEn}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radius Slider (5 to 25 km) */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-red-500" />
                  {isAr ? '2. نطاق البحث عن الحرفيين:' : '2. Search Radius:'}
                </span>
                <span className="font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-900">
                  {radiusKm} {isAr ? 'كم (KM)' : 'KM'}
                </span>
              </div>
              <Slider 
                value={[radiusKm]} 
                onValueChange={(val) => setRadiusKm(val[0])}
                min={3}
                max={25}
                step={1}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>3 km (أقرب حي)</span>
                <span>10 km (وسط المدينة)</span>
                <span>25 km (الولاية بأكملها)</span>
              </div>
            </div>

            {/* Emergency Flat Surge Breakdown */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/50 to-slate-900 border border-red-900/40 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-red-400 block">{isAr ? 'رسوم الاستجابة العاجلة (Surge Rate):' : 'Emergency Flat Surge Rate:'}</span>
                <span className="text-[11px] text-slate-400">{isAr ? 'تسعيرة التدخل الليلي/الفوري الموحدة' : 'Guaranteed 15-30 min priority response'}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-white font-mono">+{currentCategory.surgeDA.toLocaleString()}</span>
                <span className="text-xs font-bold text-red-400 ml-1">دج (DA)</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSOS}
              disabled={isBroadcasting}
              className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black shadow-lg shadow-red-600/40 gap-2"
            >
              {isBroadcasting ? (
                <>
                  <Radio className="h-4 w-4 animate-spin" />
                  {isAr ? 'جاري بث نداء الطوارئ...' : 'Broadcasting SOS...'}
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4" />
                  {isAr ? 'إطلاق نداء الاستغاثة فوراً' : 'Broadcast Emergency Call'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
