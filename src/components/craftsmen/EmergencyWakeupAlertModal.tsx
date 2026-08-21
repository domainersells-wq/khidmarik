'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertOctagon, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Navigation, 
  Volume2, 
  VolumeX, 
  ShieldCheck,
  Sparkles,
  ArrowRight,
  User,
  Zap,
  Droplets,
  Key,
  Flame,
  Wind
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { CraftsmanOrder, ServiceEmergencyCategory } from '@/types/craftsmen';

interface EmergencyWakeupAlertModalProps {
  isOpen: boolean;
  order: CraftsmanOrder | null;
  onAccept: (order: CraftsmanOrder) => void;
  onDecline: (order: CraftsmanOrder) => void;
  onTimeoutEscalate: (order: CraftsmanOrder) => void;
}

export function EmergencyWakeupAlertModal({
  isOpen,
  order,
  onAccept,
  onDecline,
  onTimeoutEscalate
}: EmergencyWakeupAlertModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  useEffect(() => {
    if (!isOpen || !order) {
      setSecondsRemaining(30);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeoutEscalate(order);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, order, onTimeoutEscalate]);

  if (!order || !isOpen) return null;

  const categoryIcons: Record<ServiceEmergencyCategory, any> = {
    plumbing_leak: Droplets,
    electrical_outage: Zap,
    locksmith_locked_out: Key,
    gas_leak_safety: Flame,
    ac_heating_failure: Wind,
    roof_drainage_emergency: Droplets
  };

  const Icon = categoryIcons[order.category] || AlertOctagon;
  const progressPercent = (secondsRemaining / 30) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 bg-slate-950 text-white border-2 border-red-600 shadow-2xl shadow-red-600/50 overflow-hidden">
        {/* Animated Top Pulsing Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.2)_10%,_transparent_20%)] bg-[length:16px_16px] animate-pulse opacity-30" />
          
          <div className="flex items-center justify-between relative z-10">
            <Badge className="bg-black/40 text-white border-white/20 text-xs px-2.5 py-1 uppercase font-black tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
              {isAr ? '🚨 نداء استغاثة طارئ فوري' : '🚨 LIVE EMERGENCY SOS'}
            </Badge>

            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs transition-colors"
              title={isSoundMuted ? "Unmute Alarm" : "Mute Alarm"}
            >
              {isSoundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 animate-bounce" />}
            </button>
          </div>

          <div className="mt-2 text-center relative z-10">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-headline">
              {isAr ? order.serviceTitleAr : order.serviceTitleEn}
            </h2>
          </div>
        </div>

        {/* 30s Countdown Circular Progress Bar */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-red-950/40 border border-red-900/60">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
                <Clock className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{isAr ? 'الوقت المتبقي للقبول:' : 'Accept Countdown:'}</span>
                <span className="text-xs font-bold text-red-400">
                  {isAr ? 'سيتم تحويل الطلب تلقائياً بعد انتهاء الوقت' : 'Auto-escalating if not accepted'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-red-500">{secondsRemaining}</span>
              <span className="text-xs font-bold text-slate-400 ml-1">{isAr ? 'ثانية' : 's'}</span>
            </div>
          </div>

          {/* Progress Line */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Job & Location Details Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            {/* Customer & Location */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{order.customer.name}</h4>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-400" />
                    {order.customer.maskedAddress} ({order.customer.wilaya})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-300">
                  {order.craftsman.currentDistanceKm} km {isAr ? 'من موقعك' : 'away'}
                </Badge>
                <div className="text-[11px] text-emerald-400 font-bold mt-1">
                  ~{order.craftsman.estimatedArrivalMinutes} min {isAr ? 'وصول مقدر' : 'arrival'}
                </div>
              </div>
            </div>

            {/* Financial Surge & Guaranteed Rate */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">{isAr ? 'علاوة الطوارئ الفورية:' : 'Emergency Surge Bonus:'}</span>
                <span className="text-base font-black text-amber-400 font-mono">+{order.quotation.emergencySurgeFeeDA.toLocaleString()} DA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">{isAr ? 'التسعيرة المبدئية للعمل:' : 'Base Labor Quote:'}</span>
                <span className="text-base font-black text-white font-mono">{order.quotation.laborCostDA.toLocaleString()} DA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onDecline(order)}
            className="h-12 border-slate-700 hover:bg-slate-800 text-slate-300 font-bold gap-1.5"
          >
            <XCircle className="h-4 w-4 text-slate-400" />
            {isAr ? 'تخطي / اعتذار' : 'Decline Job'}
          </Button>

          <Button
            type="button"
            onClick={() => onAccept(order)}
            className="h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-lg shadow-emerald-600/30 gap-1.5 text-sm"
          >
            <CheckCircle2 className="h-5 w-5" />
            {isAr ? 'قبول والتوجه فوراً' : 'Accept & Dispatch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
