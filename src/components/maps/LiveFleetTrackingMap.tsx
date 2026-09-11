'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Navigation, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Zap, 
  RotateCcw,
  Play,
  Pause,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

interface LiveFleetTrackingMapProps {
  shipmentNumber?: string;
  courierName?: string;
  courierPhone?: string;
  courierVehicle?: string;
  vehicleType?: 'car' | 'motorcycle' | 'van';
  originWilaya?: string;
  destinationWilaya?: string;
  customerAddress?: string;
  initialEtaMinutes?: number;
}

// Pre-defined GPS route simulation (e.g. within Algiers or Sidi Bel Abbès)
const SAMPLE_ROUTE: Coordinate[] = [
  { lat: 35.1950, lng: -0.6380, label: 'مركز التوزيع اللوجستي (Depot)' },
  { lat: 35.1982, lng: -0.6355, label: 'شارع أول نوفمبر' },
  { lat: 35.2010, lng: -0.6320, label: 'مفترق طرق الميدان' },
  { lat: 35.2045, lng: -0.6280, label: 'حي السعادة' },
  { lat: 35.2080, lng: -0.6240, label: 'شارع فلسطين' },
  { lat: 35.2115, lng: -0.6200, label: 'نهج الاستقلال' },
  { lat: 35.2150, lng: -0.6170, label: 'موقع التسليم للزبون (Destination)' },
];

export function LiveFleetTrackingMap({
  shipmentNumber = 'KHM-2026-904128',
  courierName = 'حمزة بن عاشور',
  courierPhone = '0550 12 34 56',
  courierVehicle = 'دراجة شحن سريعة (Express Moto)',
  vehicleType = 'motorcycle',
  originWilaya = '22 - سيدي بلعباس',
  destinationWilaya = 'حي الوفاء، سيدي بلعباس',
  customerAddress = 'عمارة 14، الطابق 2، شقة 5',
  initialEtaMinutes = 14,
}: LiveFleetTrackingMapProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [currentSpeed, setCurrentSpeed] = useState(38); // km/h
  const [secondsRemaining, setSecondsRemaining] = useState(initialEtaMinutes * 60);
  const [progressPercent, setProgressPercent] = useState(25);

  const totalSteps = SAMPLE_ROUTE.length - 1;

  // Real-time animation ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 10) return 10;
        return prev - 1 * speedMultiplier;
      });

      // Fluctuate speed slightly for realism
      setCurrentSpeed((prev) => {
        const delta = (Math.random() - 0.5) * 6;
        const newSpeed = Math.round(Math.max(25, Math.min(65, prev + delta)));
        return newSpeed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  // Step advancement timer
  useEffect(() => {
    if (!isPlaying) return;

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps) {
          setIsPlaying(false);
          return totalSteps;
        }
        const next = prev + 1;
        setProgressPercent(Math.round((next / totalSteps) * 100));
        return next;
      });
    }, 4500 / speedMultiplier);

    return () => clearInterval(stepInterval);
  }, [isPlaying, speedMultiplier, totalSteps]);

  const formatEta = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} دقيقة و ${secs < 10 ? '0' : ''}${secs} ثانية`;
  };

  const currentCoord = SAMPLE_ROUTE[currentStepIndex];
  const remainingDistanceKm = Math.max(0.3, ((totalSteps - currentStepIndex) * 0.75)).toFixed(1);

  return (
    <Card className="overflow-hidden border-2 border-primary/30 shadow-xl bg-card rounded-2xl text-right">
      {/* Top Status Header */}
      <div className="bg-gradient-to-l from-primary/20 via-primary/10 to-background p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-1 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
            <span>بث حي ومباشر (LIVE GPS)</span>
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {shipmentNumber}
          </Badge>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-muted-foreground block">الوقت المتبقي المقدر للوصول (ETA):</span>
          <span className="text-base sm:text-lg font-black text-primary font-mono flex items-center gap-1.5 justify-end">
            <Clock className="h-4 w-4 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
            {formatEta(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Visual Animated Map Surface */}
      <div className="relative h-72 sm:h-96 w-full bg-slate-900 overflow-hidden select-none">
        {/* Map Grid Background Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #38bdf8 1px, transparent 1px),
              linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Satellite Street Contours */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <svg className="w-full h-full">
            <path
              d="M 50,220 Q 200,180 400,210 T 700,120 T 950,80"
              fill="none"
              stroke="#0284c7"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 50,220 Q 200,180 400,210 T 700,120 T 950,80"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeDasharray="8 8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Live Moving Marker along Route */}
        <div 
          className="absolute transition-all duration-1000 ease-out z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${Math.min(92, Math.max(8, (currentStepIndex / totalSteps) * 85 + 6))}%`,
            top: `${Math.max(22, 75 - (currentStepIndex / totalSteps) * 50)}%`,
          }}
        >
          {/* Beacon pulse circle */}
          <div className="absolute -inset-3 rounded-full bg-sky-400/30 animate-ping" />
          <div className="relative bg-primary text-primary-foreground p-3 rounded-full shadow-2xl border-2 border-white flex items-center justify-center">
            <Navigation className="h-6 w-6 transform rotate-45 text-white" />
          </div>

          {/* Floating Live Tag */}
          <div className="mt-2 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-sky-400/40 shadow-md backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{courierName}</span>
            <span className="text-sky-300 font-mono">({currentSpeed} km/h)</span>
          </div>
        </div>

        {/* Origin Marker */}
        <div className="absolute left-6 bottom-8 z-10 flex flex-col items-center">
          <div className="bg-amber-500 text-white p-2 rounded-xl border border-white shadow-md">
            <Truck className="h-4 w-4" />
          </div>
          <span className="mt-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md">
            مركز التوزيع
          </span>
        </div>

        {/* Destination Marker */}
        <div className="absolute right-6 top-8 z-10 flex flex-col items-center">
          <div className="bg-emerald-600 text-white p-2.5 rounded-full border-2 border-white shadow-lg animate-bounce">
            <MapPin className="h-5 w-5 fill-white" />
          </div>
          <span className="mt-1 bg-emerald-950/90 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
            عنوان التسليم المحدد
          </span>
        </div>

        {/* Telemetry Overlay Card (HUD) */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-white text-xs space-y-1 shadow-2xl">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Compass className="h-3.5 w-3.5" />
            <span>بيانات الملاحة الحية</span>
          </div>
          <p className="text-[11px] text-slate-300">
            المسافة المتبقية: <strong className="text-white font-mono">{remainingDistanceKm} km</strong>
          </p>
          <p className="text-[11px] text-slate-300">
            الموقع الحالي: <span className="text-sky-200 font-semibold">{currentCoord.label}</span>
          </p>
        </div>

        {/* Playback simulation controls */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'إيقاف مؤقت للمحاكاة' : 'استئناف المحاكاة'}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-white hover:bg-white/20 font-mono"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
          >
            {speedMultiplier}x
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => {
              setCurrentStepIndex(0);
              setSecondsRemaining(initialEtaMinutes * 60);
              setIsPlaying(true);
            }}
            title="إعادة تشغيل المسار"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 space-y-2 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{SAMPLE_ROUTE[SAMPLE_ROUTE.length - 1].label}</span>
          <span className="font-bold text-foreground">{progressPercent}% تم إنجاز المسار</span>
          <span>{SAMPLE_ROUTE[0].label}</span>
        </div>
        <Progress value={progressPercent} className="h-2.5 bg-muted" />
      </div>

      {/* Courier/Craftsman Details & Direct Contact */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-row-reverse">
          <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0 text-primary font-bold text-base shadow-sm">
            {courierName.slice(0, 2)}
          </div>
          <div className="text-right">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 justify-end">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{courierName}</span>
            </h4>
            <p className="text-xs text-muted-foreground">{courierVehicle}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">موصول بنظام الاتصال المشفر</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            asChild
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 font-bold"
          >
            <a href={`tel:${courierPhone}`}>
              <Phone className="h-3.5 w-3.5" />
              اتصال مباشر بالمندوب
            </a>
          </Button>

          <Button 
            asChild
            variant="outline"
            className="flex-1 sm:flex-none border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs gap-1.5 font-semibold"
          >
            <a href={`https://wa.me/213${courierPhone.replace(/\s+/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              محادثة واتساب
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
