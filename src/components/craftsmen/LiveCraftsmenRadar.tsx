'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Radar, 
  Wrench, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Star, 
  Clock, 
  AlertCircle,
  Radio,
  Flame,
  Key,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export interface RadarCraftsman {
  id: string;
  name: string;
  profession: string;
  professionType: 'plumber' | 'electrician' | 'locksmith' | 'ac_technician';
  avatarUrl: string;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
  phone: string;
  status: 'available' | 'on_route' | 'busy';
  xPercent: number; // For radar positioning
  yPercent: number;
}

const SAMPLE_NEARBY_CRAFTSMEN: RadarCraftsman[] = [
  {
    id: 'rad-001',
    name: 'عبد القادر معوش',
    profession: 'سباك طوارئ ومعالجة تسريبات',
    professionType: 'plumber',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    rating: 4.96,
    distanceKm: 1.8,
    etaMinutes: 7,
    phone: '0661 11 22 33',
    status: 'available',
    xPercent: 62,
    yPercent: 35,
  },
  {
    id: 'rad-002',
    name: 'رياض سلطاني',
    profession: 'كهربائي قواطع وشورت سيركوي',
    professionType: 'electrician',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    rating: 4.89,
    distanceKm: 2.6,
    etaMinutes: 11,
    phone: '0555 44 55 66',
    status: 'available',
    xPercent: 32,
    yPercent: 68,
  },
  {
    id: 'rad-003',
    name: 'ياسين بلعربي',
    profession: 'فتح أقفال وأبواب مصفحة 24/7',
    professionType: 'locksmith',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    rating: 4.93,
    distanceKm: 3.4,
    etaMinutes: 14,
    phone: '0770 77 88 99',
    status: 'available',
    xPercent: 78,
    yPercent: 70,
  },
  {
    id: 'rad-004',
    name: 'طارق ميهوبي',
    profession: 'صيانة مكيفات وسخانات مياه',
    professionType: 'ac_technician',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    rating: 4.85,
    distanceKm: 4.9,
    etaMinutes: 19,
    phone: '0662 99 00 11',
    status: 'on_route',
    xPercent: 25,
    yPercent: 28,
  }
];

interface LiveCraftsmenRadarProps {
  userWilaya?: string;
  commune?: string;
  onSelectCraftsman?: (craftsman: RadarCraftsman) => void;
}

export function LiveCraftsmenRadar({
  userWilaya = 'سيدي بلعباس',
  commune = 'وسط المدينة',
  onSelectCraftsman,
}: LiveCraftsmenRadarProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedCraftsman, setSelectedCraftsman] = useState<RadarCraftsman | null>(SAMPLE_NEARBY_CRAFTSMEN[0]);
  const [isScanning, setIsScanning] = useState(true);

  const filteredCraftsmen = SAMPLE_NEARBY_CRAFTSMEN.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.professionType === activeFilter;
  });

  const handleDispatch = (craftsman: RadarCraftsman) => {
    if (onSelectCraftsman) {
      onSelectCraftsman(craftsman);
    }
    toast({
      title: '🚨 تم إطلاق طلب التدخل السريع SOS',
      description: `تم إشعار الحرفي ${craftsman.name} وهو في طريقه إليك الآن (ETA: ${craftsman.etaMinutes} دقائق). كود الأمان START OTP في انتظار وصوله.`,
    });
  };

  return (
    <Card className="border-2 border-red-500/30 bg-card rounded-2xl overflow-hidden shadow-2xl text-right">
      {/* Radar Header */}
      <div className="bg-gradient-to-l from-red-500/20 via-red-500/10 to-background p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 px-3 py-1 shadow-sm">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>رادار طوارئ الحرفيين الميداني (LIVE RADAR)</span>
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">58 Wilayas Grid</span>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">نطاق المسح الجغرافي النشط:</p>
          <span className="text-sm font-bold text-foreground flex items-center gap-1 justify-end">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            {userWilaya} • {commune} (دائرة قطرها 5 كم)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left/Main Radar Screen (7 cols) */}
        <div className="lg:col-span-7 relative h-80 sm:h-96 bg-slate-950 flex items-center justify-center overflow-hidden select-none border-b lg:border-b-0 lg:border-l border-border">
          {/* Concentric Radar Rings */}
          <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20" />
          <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20" />
          <div className="absolute w-64 h-64 rounded-full border border-emerald-500/30" />
          <div className="absolute w-80 h-80 rounded-full border border-emerald-500/20" />

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-emerald-500/20" />
          <div className="absolute h-full w-[1px] bg-emerald-500/20" />

          {/* Rotating Sonar Beam Sweep */}
          <div 
            className="absolute w-72 h-72 rounded-full pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.35) 0deg, rgba(16, 185, 129, 0) 65deg)',
              animation: 'spin 4s linear infinite',
            }}
          />

          {/* Center User Location Marker (You) */}
          <div className="relative z-20 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg animate-ping absolute" />
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-lg relative z-10" />
            <span className="mt-1 bg-red-950/90 text-red-300 border border-red-500/50 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              موقعك الحالي
            </span>
          </div>

          {/* Blips of Nearby Craftsmen */}
          {filteredCraftsmen.map((craftsman) => {
            const isSelected = selectedCraftsman?.id === craftsman.id;
            return (
              <button
                key={craftsman.id}
                onClick={() => setSelectedCraftsman(craftsman)}
                className="absolute z-30 transition-transform hover:scale-125 focus:outline-none flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group"
                style={{
                  left: `${craftsman.xPercent}%`,
                  top: `${craftsman.yPercent}%`,
                }}
              >
                {/* Ping ring */}
                <span className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping" />
                
                {/* Blip Dot / Avatar */}
                <div className={`relative w-8 h-8 rounded-full overflow-hidden border-2 shadow-lg transition-all ${
                  isSelected ? 'border-amber-400 ring-4 ring-amber-400/40 scale-110' : 'border-emerald-400'
                }`}>
                  <Image
                    src={craftsman.avatarUrl}
                    alt={craftsman.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Mini Tooltip on hover/select */}
                <span className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-amber-500 text-slate-950 font-black' 
                    : 'bg-slate-900/90 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {craftsman.name.split(' ')[0]} ({craftsman.etaMinutes} د)
                </span>
              </button>
            );
          })}

          {/* Telemetry Corner Stats */}
          <div className="absolute top-3 right-3 z-20 bg-slate-900/80 backdrop-blur-xs border border-emerald-500/30 rounded-lg p-2 text-emerald-400 text-[11px] font-mono space-y-0.5">
            <div>RADAR: ONLINE • 24/7</div>
            <div className="text-white">حرفيون متاحون: {filteredCraftsmen.length}</div>
          </div>
        </div>

        {/* Right Details & Fast Dispatch (5 cols) */}
        <div className="lg:col-span-5 p-5 space-y-4 flex flex-col justify-between">
          {/* Filter Pills */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">تصفية حسب نوع العطل الطارئ:</span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
                className="h-7 text-xs rounded-lg"
              >
                الكل
              </Button>
              <Button
                variant={activeFilter === 'plumber' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('plumber')}
                className="h-7 text-xs rounded-lg"
              >
                💧 سباكة
              </Button>
              <Button
                variant={activeFilter === 'electrician' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('electrician')}
                className="h-7 text-xs rounded-lg"
              >
                ⚡ كهرباء
              </Button>
              <Button
                variant={activeFilter === 'locksmith' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('locksmith')}
                className="h-7 text-xs rounded-lg"
              >
                🔑 أقفال
              </Button>
              <Button
                variant={activeFilter === 'ac_technician' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('ac_technician')}
                className="h-7 text-xs rounded-lg"
              >
                ❄️ تكييف
              </Button>
            </div>
          </div>

          {/* Active Selected Craftsman Card */}
          {selectedCraftsman ? (
            <div className="p-4 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-transparent space-y-3">
              <div className="flex items-start justify-between gap-3 flex-row-reverse">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary shrink-0">
                  <Image
                    src={selectedCraftsman.avatarUrl}
                    alt={selectedCraftsman.name}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                      <ShieldCheck className="h-3 w-3 ml-1 inline" /> موثق أمنياً
                    </Badge>
                    <h4 className="font-bold text-base text-foreground">{selectedCraftsman.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedCraftsman.profession}</p>

                  <div className="flex items-center justify-end gap-3 text-xs pt-1">
                    <span className="text-muted-foreground">
                      المسافة: <strong className="text-foreground">{selectedCraftsman.distanceKm} km</strong>
                    </span>
                    <span className="inline-flex items-center text-amber-500 font-bold">
                      <Star className="h-3 w-3 fill-amber-500 mr-1 inline" />
                      {selectedCraftsman.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Speed & ETA Highlights */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                <div className="p-2 rounded-lg bg-background border text-center">
                  <span className="text-muted-foreground text-[10px] block">وقت الوصول التقديري</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    ⚡ {selectedCraftsman.etaMinutes} دقائق فقط
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-background border text-center">
                  <span className="text-muted-foreground text-[10px] block">أمان المعاملة</span>
                  <span className="text-foreground font-bold text-xs flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> كود Dual-OTP
                  </span>
                </div>
              </div>

              {/* Fast Summon Action */}
              <Button
                onClick={() => handleDispatch(selectedCraftsman)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs gap-2 py-5 shadow-lg"
              >
                <Zap className="h-4 w-4 fill-white" />
                طلب فوري للتدخل السريع SOS ({selectedCraftsman.name.split(' ')[0]})
              </Button>
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground text-xs">
              انقر على أي حرفي في الرادار لعرض بياناته والطلب الفوري.
            </div>
          )}

          <p className="text-[11px] text-muted-foreground text-center">
            🛡️ جميع الحرفيين مسجلون بسجل تجاري وبطاقة هوية معتمدة مع ضمان الوساطة المالية.
          </p>
        </div>
      </div>
    </Card>
  );
}
