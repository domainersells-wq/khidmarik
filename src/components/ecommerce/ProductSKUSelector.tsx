'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Sparkles, 
  Package, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Truck, 
  Tag, 
  Coins, 
  Heart, 
  Share2, 
  Camera,
  Star
} from 'lucide-react';
import { ProductVariationGroup, ProductSKU } from '@/types/ecommerce';
import { useLanguage } from '@/context/LanguageContext';

interface ProductSKUSelectorProps {
  variationGroups: ProductVariationGroup[];
  skuList: ProductSKU[];
  basePriceDA: number;
  onSelectionChange?: (selectedSku: ProductSKU, selectedQuantity: number) => void;
  onOpenVisualSearch?: () => void;
}

export function ProductSKUSelector({
  variationGroups,
  skuList,
  basePriceDA,
  onSelectionChange,
  onOpenVisualSearch
}: ProductSKUSelectorProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = language === 'ar';

  // Selected option for each group
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variationGroups.forEach(g => {
      if (g.options.length > 0) {
        initial[g.id] = g.options[0].id;
      }
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Derive Combination Key & Active SKU
  const combinationKey = useMemo(() => {
    return variationGroups
      .map(g => selectedOptions[g.id])
      .filter(Boolean)
      .join('_');
  }, [variationGroups, selectedOptions]);

  const activeSKU = useMemo(() => {
    const found = skuList.find(sku => sku.combinationKey === combinationKey || sku.id === combinationKey);
    if (found) return found;
    return skuList[0] || {
      id: 'sku_default',
      combinationKey: 'default',
      skuCode: 'DZ-SKU-001',
      priceDA: basePriceDA,
      originalPriceDA: basePriceDA * 1.25,
      stockQuantity: 15,
      imageGallery: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80'
      ]
    };
  }, [skuList, combinationKey, basePriceDA]);

  const handleOptionSelect = (groupId: string, optionId: string) => {
    const next = { ...selectedOptions, [groupId]: optionId };
    setSelectedOptions(next);
    setActiveImageIndex(0);
  };

  const isOutOfStock = activeSKU.stockQuantity <= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-card rounded-3xl p-6 border shadow-sm">
      
      {/* 1. Dynamic Gallery & Image Thumbnails (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        {/* Main Image Viewer with Visual Search Trigger */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border group">
          <img 
            src={activeSKU.imageGallery[activeImageIndex] || activeSKU.imageGallery[0]} 
            alt="Product Preview" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Visual AI Search Trigger Button */}
          {onOpenVisualSearch && (
            <button
              onClick={onOpenVisualSearch}
              className="absolute top-3 left-3 bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border border-white/20 transition-all hover:scale-105"
              title={isAr ? 'البحث البصري عن منتجات مشابهة بالصورة' : 'Search similar items by image'}
            >
              <Camera className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'بحث بالصورة' : 'Visual Search'}</span>
            </button>
          )}

          {/* Stock Status Badge */}
          <div className="absolute bottom-3 right-3">
            {isOutOfStock ? (
              <Badge variant="destructive" className="font-bold text-xs">
                {isAr ? 'نفذت الكمية' : 'Out of Stock'}
              </Badge>
            ) : (
              <Badge className="bg-emerald-600/90 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1">
                <Check className="h-3 w-3" />
                {isAr ? `متوفر في المخزن (${activeSKU.stockQuantity} قطعة)` : `In Stock (${activeSKU.stockQuantity})`}
              </Badge>
            )}
          </div>
        </div>

        {/* Thumbnail Selector */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {activeSKU.imageGallery.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                activeImageIndex === idx ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt="Thumbnail" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Variation Engine & Pricing Details (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Title & SKU Code */}
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono font-bold text-muted-foreground">
              SKU: {activeSKU.skuCode}
            </Badge>
            <Badge className="bg-red-500 text-white font-bold text-[10px]">
              {isAr ? 'عروض الشراء المباشر' : 'Verified Merchant'}
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 dark:text-white">
            {isAr ? 'سماعات لاسلكية برو بخاصية عزل الضوضاء النشط' : 'Wireless Pro Noise Cancelling Studio Headphones'}
          </h2>

          {/* Price Display with Discount & Coins Rate */}
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-3xl font-black text-red-600 font-mono" suppressHydrationWarning>
              {activeSKU.priceDA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} <span className="text-sm font-bold">{isAr ? 'دج' : 'DZD'}</span>
            </span>
            {activeSKU.originalPriceDA > activeSKU.priceDA && (
              <span className="text-sm text-muted-foreground line-through font-mono" suppressHydrationWarning>
                {activeSKU.originalPriceDA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {isAr ? 'دج' : 'DZD'}
              </span>
            )}
            <Badge className="bg-red-500/10 text-red-600 border-red-200 text-xs font-bold" suppressHydrationWarning>
              -{Math.round(((activeSKU.originalPriceDA - activeSKU.priceDA) / activeSKU.originalPriceDA) * 100)}%
            </Badge>
          </div>
        </div>

        {/* Dynamic Variation Groups (Colors, Sizes, Models) */}
        <div className="space-y-4 pt-2 border-t">
          {variationGroups.map(group => {
            const currentSelectedOptId = selectedOptions[group.id];

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? group.nameAr : group.nameEn}:
                  </span>
                  <span className="font-semibold text-primary">
                    {group.options.find(o => o.id === currentSelectedOptId)?.[isAr ? 'nameAr' : 'nameEn']}
                  </span>
                </div>

                {/* Variation Option Selectors */}
                <div className="flex flex-wrap gap-2.5">
                  {group.options.map(option => {
                    const isSelected = currentSelectedOptId === option.id;

                    if (group.type === 'color') {
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleOptionSelect(group.id, option.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            isSelected 
                              ? 'border-primary ring-2 ring-primary/25 bg-primary/5 text-primary shadow-xs' 
                              : 'hover:border-slate-400 bg-background text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span 
                            className="h-4 w-4 rounded-full border shadow-2xs shrink-0" 
                            style={{ backgroundColor: option.value }} 
                          />
                          <span>{isAr ? option.nameAr : option.nameEn}</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOptionSelect(group.id, option.id)}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary text-primary-foreground shadow-xs' 
                            : 'hover:border-slate-400 bg-background text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isAr ? option.nameAr : option.nameEn}
                        {option.extraPriceDA > 0 && ` (+${option.extraPriceDA} دج)`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quantity Selector & Quick Actions */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'الكمية المطلوبة:' : 'Quantity:'}
            </span>

            <div className="flex items-center border rounded-xl bg-background p-1 gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg"
                disabled={quantity <= 1}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="font-mono font-bold text-sm w-8 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg"
                disabled={quantity >= activeSKU.stockQuantity}
                onClick={() => setQuantity(q => Math.min(activeSKU.stockQuantity, q + 1))}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Total Calculation & Action Buttons */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{isAr ? 'إجمالي السعر للكمية:' : 'Total Price:'}</span>
              <span className="text-lg font-black font-mono text-primary" suppressHydrationWarning>
                {(activeSKU.priceDA * quantity).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {isAr ? 'دج' : 'DZD'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button 
                variant="outline"
                className="font-bold text-xs h-11 rounded-xl border-primary text-primary hover:bg-primary/10"
                disabled={isOutOfStock}
                onClick={() => onSelectionChange?.(activeSKU, quantity)}
              >
                {isAr ? 'إضافة للسلة' : 'Add to Cart'}
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs h-11 rounded-xl shadow-md shadow-red-600/25"
                disabled={isOutOfStock}
                onClick={() => onSelectionChange?.(activeSKU, quantity)}
              >
                {isAr ? 'شراء فوري مع حماية المشتري' : 'Buy Now with Escrow'}
              </Button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
