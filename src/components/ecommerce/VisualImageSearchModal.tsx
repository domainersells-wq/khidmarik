'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  UploadCloud, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  RotateCcw,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface VisualMatchProduct {
  id: string;
  titleAr: string;
  titleEn: string;
  storeName: string;
  wilaya: string;
  priceDA: number;
  similarityScore: number;
  imageUrl: string;
  category: string;
}

const MOCK_VISUAL_MATCHES: VisualMatchProduct[] = [
  {
    id: 'prod_901',
    titleAr: 'سماعات بلوتوث رأس احترافية مع شاحن Type-C',
    titleEn: 'Pro Over-Ear Bluetooth Studio Headset',
    storeName: 'إلكترونيك الجزائر (Alger Tech Store)',
    wilaya: 'الجزائر العاصمة',
    priceDA: 4200,
    similarityScore: 97,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    category: 'إلكترونيات وسماعات'
  },
  {
    id: 'prod_902',
    titleAr: 'سماعات عازلة للضوضاء موديل ستوديو X3',
    titleEn: 'Studio X3 Active Noise Cancelling Headphones',
    storeName: 'ديجيتال بليدة (Blida Digital)',
    wilaya: 'البليدة',
    priceDA: 3800,
    similarityScore: 92,
    imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&auto=format&fit=crop&q=80',
    category: 'إلكترونيات وسماعات'
  },
  {
    id: 'prod_903',
    titleAr: 'سماعات لاسلكية قابلة للطي أسود مطفي',
    titleEn: 'Foldable Matte Black Wireless Headphones',
    storeName: 'تيك ستور وهران (Oran Gadgets)',
    wilaya: 'وهران',
    priceDA: 4500,
    similarityScore: 88,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
    category: 'إلكترونيات وسماعات'
  }
];

interface VisualImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: VisualMatchProduct) => void;
}

export function VisualImageSearchModal({
  isOpen,
  onClose,
  onSelectProduct
}: VisualImageSearchModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [matches, setMatches] = useState<VisualMatchProduct[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      triggerAiScan(url);
    }
  };

  const handleSampleSearch = (sampleUrl: string) => {
    setPreviewImage(sampleUrl);
    triggerAiScan(sampleUrl);
  };

  const triggerAiScan = (imgUrl: string) => {
    setIsScanning(true);
    setMatches([]);
    setTimeout(() => {
      setIsScanning(false);
      setMatches(MOCK_VISUAL_MATCHES);
    }, 1500);
  };

  const handleReset = () => {
    setPreviewImage(null);
    setMatches([]);
    setIsScanning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl" dir={isAr ? 'rtl' : 'ltr'}>
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">
                {isAr ? 'البحث البصري الذكي بالذكاء الاصطناعي (AI Visual Search)' : 'AI Visual Product & Spare Parts Search'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr 
                  ? 'التقط أو ارفع صورة لأي منتج أو قطعة غيار للعثور الفوري على البدائل المتوفرة في المتاجر المحلية' 
                  : 'Snap or upload a photo to instantly locate matching items & spare parts in local stores'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Upload Area / Image Preview Area */}
          {!previewImage ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  id="visual-search-input" 
                  className="hidden" 
                />
                <label htmlFor="visual-search-input" className="cursor-pointer space-y-3 flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <UploadCloud className="h-8 w-8 animate-bounce" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                      {isAr ? 'انقر لرفع صورة من جهازك أو اسحبها هنا' : 'Click to upload image or drag & drop'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {isAr ? 'يدعم صور المنتجات، الملصقات، وقطع الغيار (PNG, JPG, WebP)' : 'Supports products, tags & replacement parts'}
                    </span>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground font-bold text-xs h-9 rounded-xl pointer-events-none">
                    {isAr ? 'اختيار صورة الآن' : 'Browse Files'}
                  </Button>
                </label>
              </div>

              {/* Sample Images for quick demonstration */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground block">
                  {isAr ? 'أو جرب البحث باستخدام عينات جاهزة:' : 'Or try sample product searches:'}
                </span>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {[
                    { label: 'سماعات ستوديو', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' },
                    { label: 'صمام ماء نحاسي', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300' },
                    { label: 'ساعة ذكية', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSampleSearch(sample.url)}
                      className="flex items-center gap-2 p-2 rounded-xl border bg-card hover:border-primary transition-all text-xs font-bold shrink-0"
                    >
                      <img src={sample.url} alt="Sample" className="h-8 w-8 rounded-lg object-cover" />
                      <span>{sample.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Preview with Scanning Animation Overlay */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-slate-900 text-white border shadow-inner">
                <div className="relative h-44 w-44 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/50">
                  <img src={previewImage} alt="Uploaded Query" className="h-full w-full object-cover" />
                  
                  {isScanning && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center">
                      <div className="w-full h-1 bg-emerald-400 absolute top-0 animate-[bounce_2s_infinite]" />
                      <Sparkles className="h-8 w-8 text-white animate-spin" />
                      <span className="text-[10px] font-bold text-white mt-2 bg-slate-950/80 px-2 py-0.5 rounded">
                        جاري التحليل والمطابقة...
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-right">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Badge className="bg-emerald-500 text-white font-bold text-xs">
                      AI Vision Engine Active
                    </Badge>
                  </div>
                  <h4 className="font-bold text-base">
                    {isScanning 
                      ? (isAr ? 'جاري استخراج الميزات البصرية ومطابقة المخزون...' : 'Extracting visual features & matching SKU stock...') 
                      : (isAr ? `تم العثور على (${matches.length}) منتجات متطابقة في المتاجر المحلية` : `Found ${matches.length} matching products in local stores`)}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {isAr ? 'تمت مقارنة شكل القطعة والمواصفات عبر شبكة المتاجر المعتمدة' : 'Shape and specs matched across verified stores'}
                  </p>

                  <div className="pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleReset}
                      className="bg-transparent border-slate-700 hover:bg-slate-800 text-white text-xs h-8 rounded-xl gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {isAr ? 'البحث بصورة أخرى' : 'Upload Different Photo'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Matched Products Results Grid */}
              {!isScanning && matches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-muted-foreground">{isAr ? 'النتائج المتطابقة حسب نسبة التطابق:' : 'Best Visual Matches:'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">تطابق عالي الدقة (97% - 88%)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {matches.map(product => (
                      <div 
                        key={product.id}
                        className="p-3.5 rounded-2xl border bg-card hover:border-primary hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border">
                            <img src={product.imageUrl} alt={product.titleAr} className="h-full w-full object-cover" />
                            <Badge className="absolute top-2 right-2 bg-emerald-600 text-white font-bold text-[10px] shadow-sm">
                              {product.similarityScore}% تطابق
                            </Badge>
                          </div>

                          <h5 className="font-bold text-xs line-clamp-2 leading-tight">
                            {isAr ? product.titleAr : product.titleEn}
                          </h5>

                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{product.storeName}</p>
                            <p>{product.wilaya}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t flex justify-between items-center">
                          <span className="font-black font-mono text-sm text-primary" suppressHydrationWarning>
                            {product.priceDA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {isAr ? 'دج' : 'DZD'}
                          </span>
                          <Button 
                            size="sm"
                            onClick={() => {
                              onSelectProduct?.(product);
                              onClose();
                            }}
                            className="h-8 text-xs font-bold rounded-xl px-3 bg-primary text-primary-foreground"
                          >
                            {isAr ? 'عرض السلعة' : 'View Item'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
