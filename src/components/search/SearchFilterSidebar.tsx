'use client';

import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  MapPin, 
  Tag, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  LocateFixed, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { categories, algerianWilayas } from '@/data/mock';
import type { SearchFilterState } from '@/types/search';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SearchFilterSidebarProps {
  filters: SearchFilterState;
  onChange: (updated: Partial<SearchFilterState>) => void;
  onReset: () => void;
  className?: string;
}

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];
const RATING_OPTIONS = [
  { value: 4.5, label: '4.5★ فأكثر (ممتاز جداً)' },
  { value: 4.0, label: '4.0★ فأكثر (جيد جداً)' },
  { value: 3.0, label: '3.0★ فأكثر (مقبول)' },
];

export function SearchFilterSidebar({ filters, onChange, onReset, className }: SearchFilterSidebarProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState<string>(filters.minPrice?.toString() || '');
  const [maxPriceInput, setMaxPriceInput] = useState<string>(filters.maxPrice?.toString() || '');

  // Locate user's GPS coordinates
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'تحديد الموقع غير مدعوم',
        description: 'المتصفح لا يدعم الوصول إلى الموقع الجغرافي.',
        variant: 'destructive',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onChange({
          userLat: pos.coords.latitude,
          userLng: pos.coords.longitude,
          distanceKm: filters.distanceKm || 25
        });
        toast({
          title: 'تم تحديد موقعك بدقة 📍',
          description: `تم تفعيل فلترة المسافة (خط العرض: ${pos.coords.latitude.toFixed(2)}, خط الطول: ${pos.coords.longitude.toFixed(2)})`,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        toast({
          title: 'تعذر تحديد الموقع',
          description: 'يرجى السماح بالوصول إلى الموقع أو اختيار الولاية يدوياً.',
          variant: 'destructive',
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleApplyPrice = () => {
    const minP = minPriceInput ? parseFloat(minPriceInput) : undefined;
    const maxP = maxPriceInput ? parseFloat(maxPriceInput) : undefined;
    onChange({ minPrice: minP, maxPrice: maxP, page: 1 });
  };

  return (
    <aside className={cn("w-full bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">فلاتر البحث المتقدمة</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>إعادة ضبط</span>
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['category', 'location', 'price', 'rating', 'availability']} className="w-full">
        {/* 1. CATEGORY & SUBCATEGORY */}
        <AccordionItem value="category" className="border-border/40">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span>التصنيف والفئة</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              <button
                onClick={() => onChange({ category: undefined, subcategory: undefined, page: 1 })}
                className={cn(
                  "w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                  !filters.category || filters.category === 'all'
                    ? "bg-primary/15 text-primary font-bold"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span>جميع الفئات</span>
                {(!filters.category || filters.category === 'all') && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
              {categories.map((cat) => {
                const isSelected = filters.category === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onChange({ category: cat.slug, subcategory: undefined, page: 1 })}
                    className={cn(
                      "w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                      isSelected
                        ? "bg-primary/15 text-primary font-bold"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. LOCATION & DISTANCE RADIUS */}
        <AccordionItem value="location" className="border-border/40">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>الموقع والمسافة (الجزائر)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-1">
            {/* GPS Locate Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="w-full h-9 rounded-xl border-dashed border-primary/40 hover:border-primary text-xs flex items-center justify-center gap-2 font-medium"
            >
              <LocateFixed className={cn("h-4 w-4 text-primary", isLocating && "animate-spin")} />
              <span>{isLocating ? 'جارِ تحديد موقعك...' : 'استخدام موقعي الحالي (GPS)'}</span>
            </Button>

            {/* Distance Slider if Coordinates are Active */}
            {filters.userLat && filters.userLng && (
              <div className="space-y-2 p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">أقصى مسافة:</span>
                  <span className="font-bold text-primary">{filters.distanceKm || 25} كم</span>
                </div>
                <div className="flex gap-1.5">
                  {DISTANCE_OPTIONS.map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => onChange({ distanceKm: dist, page: 1 })}
                      className={cn(
                        "flex-1 py-1 rounded-md text-[11px] font-semibold border transition-all",
                        filters.distanceKm === dist
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {dist} كم
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wilaya Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">اختر الولاية:</Label>
              <select
                value={filters.wilaya || 'all'}
                onChange={(e) => onChange({ wilaya: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
                className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">جميع الولايات الـ 58</option>
                {algerianWilayas.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.name} ({w.name_fr})
                  </option>
                ))}
              </select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. PRICE RANGE (DZD) */}
        <AccordionItem value="price" className="border-border/40">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>نطاق السعر (دج DZD)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">الحد الأدنى (دج)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">الحد الأقصى (دج)</Label>
                <Input
                  type="number"
                  placeholder="100,000"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleApplyPrice}
              className="w-full h-8 text-xs rounded-lg font-medium"
            >
              تطبيق نطاق السعر
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* 4. MINIMUM RATING */}
        <AccordionItem value="rating" className="border-border/40">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>التقييم والجودة</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => onChange({ minRating: undefined, page: 1 })}
              className={cn(
                "w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                !filters.minRating
                  ? "bg-primary/15 text-primary font-bold"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <span>جميع التقييمات</span>
              {!filters.minRating && <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
            {RATING_OPTIONS.map((rate) => {
              const isSelected = filters.minRating === rate.value;
              return (
                <button
                  key={rate.value}
                  type="button"
                  onClick={() => onChange({ minRating: rate.value, page: 1 })}
                  className={cn(
                    "w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                    isSelected
                      ? "bg-primary/15 text-primary font-bold"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>{rate.label}</span>
                  </span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        {/* 5. VERIFICATION & AVAILABILITY TOGGLES */}
        <AccordionItem value="availability" className="border-border/40">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>الموثوقية والجاهزية</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/40">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>موثق فقط (Verified)</span>
                </Label>
                <p className="text-[10px] text-muted-foreground">عرض الحرفيين والمتاجر المعتمدة رسمياً</p>
              </div>
              <Switch
                checked={!!filters.onlyVerified}
                onCheckedChange={(checked) => onChange({ onlyVerified: checked, page: 1 })}
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/40">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-blue-600" />
                  <span>توصيل متاح (Delivery)</span>
                </Label>
                <p className="text-[10px] text-muted-foreground">شحن وتوصيل للباب إلى 58 ولاية</p>
              </div>
              <Switch
                checked={!!filters.onlyDelivery}
                onCheckedChange={(checked) => onChange({ onlyDelivery: checked, page: 1 })}
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/40">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>جاهز ومتوفر حالياً</span>
                </Label>
                <p className="text-[10px] text-muted-foreground">في المخزون / متاح للحجز الفوري</p>
              </div>
              <Switch
                checked={!!filters.onlyAvailable}
                onCheckedChange={(checked) => onChange({ onlyAvailable: checked, page: 1 })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
