'use client';

import React from 'react';
import { X, RotateCcw, MapPin, Tag, DollarSign, Star, ShieldCheck, Truck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SearchFilterState } from '@/types/search';

interface ActiveFilterChipsProps {
  filters: SearchFilterState;
  onRemoveFilter: (key: keyof SearchFilterState) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({ filters, onRemoveFilter, onClearAll }: ActiveFilterChipsProps) {
  const activeChips: { key: keyof SearchFilterState; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (filters.category && filters.category !== 'all') {
    activeChips.push({
      key: 'category',
      label: `الفئة: ${filters.category}`,
      icon: Tag
    });
  }

  if (filters.subcategory && filters.subcategory !== 'all') {
    activeChips.push({
      key: 'subcategory',
      label: `التصنيف الفرعي: ${filters.subcategory}`,
      icon: Tag
    });
  }

  if (filters.wilaya && filters.wilaya !== 'all') {
    activeChips.push({
      key: 'wilaya',
      label: `الولاية: ${filters.wilaya}`,
      icon: MapPin
    });
  }

  if (filters.distanceKm && filters.userLat) {
    activeChips.push({
      key: 'distanceKm',
      label: `في نطاق ${filters.distanceKm} كم`,
      icon: MapPin
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    const priceText = filters.minPrice && filters.maxPrice
      ? `${filters.minPrice} - ${filters.maxPrice} دج`
      : filters.minPrice
      ? `من ${filters.minPrice} دج`
      : `حتى ${filters.maxPrice} دج`;
    activeChips.push({
      key: 'minPrice',
      label: `السعر: ${priceText}`,
      icon: DollarSign
    });
  }

  if (filters.minRating) {
    activeChips.push({
      key: 'minRating',
      label: `${filters.minRating}★ فأكثر`,
      icon: Star
    });
  }

  if (filters.onlyVerified) {
    activeChips.push({
      key: 'onlyVerified',
      label: 'موثق فقط',
      icon: ShieldCheck
    });
  }

  if (filters.onlyDelivery) {
    activeChips.push({
      key: 'onlyDelivery',
      label: 'توصيل متاح',
      icon: Truck
    });
  }

  if (filters.onlyAvailable) {
    activeChips.push({
      key: 'onlyAvailable',
      label: 'متوفر حالياً',
      icon: Clock
    });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-xs font-medium text-muted-foreground ltr:mr-1 rtl:ml-1">الفلاتر المفعلة:</span>
      
      {activeChips.map((chip) => {
        const Icon = chip.icon;
        return (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 animate-fade-in shadow-sm"
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{chip.label}</span>
            <button
              onClick={() => onRemoveFilter(chip.key)}
              className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
              title="إزالة الفلتر"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
      >
        <RotateCcw className="h-3 w-3" />
        <span>مسح الكل</span>
      </Button>
    </div>
  );
}
