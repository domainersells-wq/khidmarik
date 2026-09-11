'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShoppingBag, 
  Calendar, 
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UnifiedSearchResultItem } from '@/types/search';
import { cn } from '@/lib/utils';

interface UnifiedResultCardProps {
  item: UnifiedSearchResultItem;
  viewMode?: 'grid' | 'list';
}

export function UnifiedResultCard({ item, viewMode = 'grid' }: UnifiedResultCardProps) {
  const isList = viewMode === 'list';

  // Render Entity Type Badge
  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'products':
        return { text: 'منتج', color: 'bg-blue-500/10 text-blue-600 border-blue-200' };
      case 'services':
        return { text: 'خدمة معتمدة', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
      case 'providers':
        return { text: 'حرفي / مقدم خدمة', color: 'bg-purple-500/10 text-purple-600 border-purple-200' };
      case 'stores':
        return { text: 'متجر', color: 'bg-amber-500/10 text-amber-600 border-amber-200' };
      case 'listings':
        return { text: 'دليل / قاعة', color: 'bg-rose-500/10 text-rose-600 border-rose-200' };
      case 'bookings':
        return { text: 'حجز فوري', color: 'bg-teal-500/10 text-teal-600 border-teal-200' };
      case 'categories':
        return { text: 'تصنيف', color: 'bg-slate-500/10 text-slate-600 border-slate-200' };
      default:
        return { text: 'عنصر', color: 'bg-muted text-muted-foreground border-border' };
    }
  };

  const typeInfo = getEntityTypeLabel(item.entityType);

  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between",
        isList ? "sm:flex-row gap-4 p-4" : "p-0"
      )}
    >
      {/* Media / Image Section */}
      <div className={cn("relative overflow-hidden bg-muted", isList ? "w-full sm:w-48 h-44 sm:h-auto rounded-xl flex-shrink-0" : "w-full h-48")}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
            <ShoppingBag className="h-10 w-10 opacity-30" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end z-10">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md", typeInfo.color)}>
            {typeInfo.text}
          </span>
          {item.badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm animate-pulse">
              {item.badge}
            </span>
          )}
        </div>

        {/* Distance Badge if applicable */}
        {item.distanceKm !== undefined && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-black/70 text-white backdrop-blur-md flex items-center gap-1">
              <MapPin className="h-3 w-3 text-red-400" />
              <span>{item.distanceKm} كم منك</span>
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={cn("flex-1 flex flex-col justify-between", isList ? "p-0" : "p-4")}>
        <div className="space-y-2">
          {/* Category & Rating Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium truncate max-w-[150px]">{item.categoryName}</span>
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              <span>{item.rating.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground font-normal">({item.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <Link href={item.actionUrl} className="block group-hover:text-primary transition-colors">
            <h4 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-snug">
              {item.title}
            </h4>
          </Link>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Metadata Chips (Location, Verification, Delivery) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              <MapPin className="h-3 w-3 text-primary" />
              <span>{item.wilaya}</span>
              {item.city && <span className="opacity-70">({item.city})</span>}
            </span>

            {item.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>موثق</span>
              </span>
            )}

            {item.deliveryAvailable && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                <Truck className="h-3 w-3 text-blue-600" />
                <span>توصيل 58 ولاية</span>
              </span>
            )}
          </div>
        </div>

        {/* Footer: Price & Action CTA */}
        <div className="pt-4 mt-2 border-t border-border/40 flex items-center justify-between gap-2">
          <div>
            {item.price > 0 ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-primary">
                    {item.discountPrice ? item.discountPrice.toLocaleString('fr-DZ') : item.price.toLocaleString('fr-DZ')}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">{item.currency}</span>
                  {item.priceUnit && <span className="text-[10px] text-muted-foreground font-normal">/ {item.priceUnit}</span>}
                </div>
                {item.discountPrice && (
                  <span className="text-[11px] text-muted-foreground line-through">
                    {item.price.toLocaleString('fr-DZ')} {item.currency}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {item.entityType === 'categories' ? 'تصفح الفئة' : 'تواصل لمعرفة السعر'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {item.bookingUrl ? (
              <Button size="sm" asChild className="h-8 px-3 text-xs rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <Link href={item.bookingUrl} className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>حجز فوري</span>
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild className="h-8 px-3 text-xs rounded-xl font-semibold hover:bg-primary hover:text-primary-foreground group-hover:border-primary transition-all">
                <Link href={item.actionUrl} className="flex items-center gap-1">
                  <span>تفاصيل</span>
                  <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
