'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Image as ImageIcon, 
  ShieldCheck, 
  Eye, 
  Split, 
  UploadCloud, 
  AlertCircle,
  Clock,
  Columns
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { JobVerificationPhotos } from '@/types/craftsmen';

interface BeforeAfterPhotoCaptureProps {
  photos: JobVerificationPhotos;
  onUpdatePhotos: (updated: JobVerificationPhotos) => void;
  userRole: 'craftsman' | 'customer' | 'admin';
  orderStatus: string;
}

export function BeforeAfterPhotoCapture({
  photos,
  onUpdatePhotos,
  userRole,
  orderStatus
}: BeforeAfterPhotoCaptureProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [sliderPos, setSliderPos] = useState<number>(50); // for interactive comparison slider
  const [isCapturingBefore, setIsCapturingBefore] = useState(false);
  const [isCapturingAfter, setIsCapturingAfter] = useState(false);

  const sampleBeforePhoto = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80'; // pipe leak broken
  const sampleAfterPhoto = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80'; // shiny fixed pipe plumbing

  const handleCaptureBefore = () => {
    setIsCapturingBefore(true);
    setTimeout(() => {
      setIsCapturingBefore(false);
      onUpdatePhotos({
        ...photos,
        beforePhotoUrl: sampleBeforePhoto,
        beforeTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        beforeNotes: isAr ? 'تم توثيق الكسر والتسرب المائي قبل بدء الأشغال' : 'Documented pipe fracture prior to disassembly'
      });
      toast({
        title: isAr ? '📸 تم التقاط وتأكيد صورة ما قبل العمل (Before Photo)' : '📸 Before Photo Verified',
        description: isAr ? 'تم فتح شاشة التنفيذ وبدء حساب وقت الصيانة بنجاح!' : 'Job execution screen & timer unlocked!'
      });
    }, 900);
  };

  const handleCaptureAfter = () => {
    setIsCapturingAfter(true);
    setTimeout(() => {
      setIsCapturingAfter(false);
      onUpdatePhotos({
        ...photos,
        afterPhotoUrl: sampleAfterPhoto,
        afterTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        afterNotes: isAr ? 'تم استبدال الأنبوب والتأكد من عدم وجود أي تسرب تحت الضغط' : 'Replaced valve and verified zero leakage under pressure'
      });
      toast({
        title: isAr ? '📸 تم التقاط وتأكيد صورة ما بعد العمل (After Photo)' : '📸 After Photo Verified',
        description: isAr ? 'تم حفظ التوثيق البصري بنجاح وتمكين العميل من المعاينة قبل كود الإغلاق.' : 'Visual proof saved for customer inspection & OTP completion.'
      });
    }, 900);
  };

  const handleTogglePortfolio = (checked: boolean) => {
    onUpdatePhotos({
      ...photos,
      showcaseInPortfolio: checked,
      customerAnonymityConfirmed: checked ? true : photos.customerAnonymityConfirmed
    });
    toast({
      title: checked 
        ? (isAr ? '✓ سيتم عرض العمل في معرض أعمالك العام' : '✓ Added to Public Portfolio Showcase')
        : (isAr ? 'تم إخفاء العمل من المعرض العام' : 'Removed from Public Portfolio'),
      description: checked 
        ? (isAr ? 'مع ضمان حجب بيانات العميل وموقعه الجغرافي بنسبة 100% حفاظاً على الخصوصية.' : 'Customer identity and location are 100% anonymised.')
        : undefined
    });
  };

  const hasBothPhotos = !!photos.beforePhotoUrl && !!photos.afterPhotoUrl;

  return (
    <Card className="shadow-md border overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {isAr ? 'التوثيق البصري الإلزامي (قبل وبعد العمل)' : 'Mandatory Before & After Job Verification'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr 
                ? 'شرط أمني إلزامي لتأكيد حالة العطل قبل البدء وإثبات جودة الإصلاح النهائي لحماية الطرفين' 
                : 'Enforced photographic verification to prevent disputes and guarantee work quality'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            {photos.beforePhotoUrl ? (
              <Badge className="bg-emerald-600 text-white text-[10px]">
                {isAr ? '✓ تم توثيق البدء' : '✓ Before Verified'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-400 text-[10px]">
                {isAr ? 'إلزامي لبدء العمل' : 'Required to Start'}
              </Badge>
            )}
            {photos.afterPhotoUrl && (
              <Badge className="bg-emerald-600 text-white text-[10px]">
                {isAr ? '✓ تم توثيق الإنجاز' : '✓ After Verified'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* State 1 & State 2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* PHOTO 1: BEFORE REPAIR */}
          <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {isAr ? '1. صورة العطل قبل البدء (Before Photo):' : '1. Before Repair (Issue Capture):'}
              </span>
              {photos.beforeTimestamp && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  {photos.beforeTimestamp}
                </span>
              )}
            </div>

            {photos.beforePhotoUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border h-48 bg-black">
                  <img 
                    src={photos.beforePhotoUrl} 
                    alt="Before Repair" 
                    className="h-full w-full object-cover" 
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-[11px]">
                    {photos.beforeNotes || (isAr ? 'تم التوثيق بواسطة الكاميرا المعتمدة' : 'Verified Camera Capture')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center bg-white dark:bg-slate-950">
                <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">
                  {isAr ? 'يجب التقاط صورة واضحة للعطل لفتح عداد العمل' : 'Take high-res photo of issue to unlock job'}
                </p>
                {userRole === 'craftsman' && (
                  <Button
                    size="sm"
                    onClick={handleCaptureBefore}
                    disabled={isCapturingBefore}
                    className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5"
                  >
                    <Camera className="h-4 w-4" />
                    {isCapturingBefore ? (isAr ? 'جاري الالتقاط...' : 'Capturing...') : (isAr ? 'التقاط صورة العطل الآن' : 'Capture Before Photo')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* PHOTO 2: AFTER REPAIR */}
          <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {isAr ? '2. صورة الإصلاح المكتمل (After Photo):' : '2. After Repair (Completed Work):'}
              </span>
              {photos.afterTimestamp && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  {photos.afterTimestamp}
                </span>
              )}
            </div>

            {photos.afterPhotoUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border h-48 bg-black">
                  <img 
                    src={photos.afterPhotoUrl} 
                    alt="After Repair" 
                    className="h-full w-full object-cover" 
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-emerald-950/80 backdrop-blur-sm text-emerald-300 px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {photos.afterNotes || (isAr ? 'تم إنجاز وتجربة الإصلاح بنجاح' : 'Job verified and completed')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center bg-white dark:bg-slate-950">
                <Sparkles className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">
                  {photos.beforePhotoUrl 
                    ? (isAr ? 'يتم التقاط صورة بعد الانتهاء لإتاحة رمز الإغلاق' : 'Capture completed fix photo upon finishing')
                    : (isAr ? 'مقفل حتى يتم توثيق بداية العمل أولاً' : 'Locked until Before Photo is captured')}
                </p>
                {userRole === 'craftsman' && photos.beforePhotoUrl && (
                  <Button
                    size="sm"
                    onClick={handleCaptureAfter}
                    disabled={isCapturingAfter}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                  >
                    <Camera className="h-4 w-4" />
                    {isCapturingAfter ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'التقاط صورة ما بعد العمل' : 'Capture After Photo')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SIDE-BY-SIDE INTERACTIVE COMPARISON SLIDER (When both are captured) */}
        {hasBothPhotos && (
          <div className="p-4 rounded-2xl border bg-slate-900 text-white space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Columns className="h-4 w-4" />
                {isAr ? 'معاينة المقارنة التفاعلية قبل / بعد (Side-by-Side Slider):' : 'Interactive Side-by-Side Proof Comparison:'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'اسحب المؤشر لليمين واليسار' : 'Drag slider to compare'}
              </span>
            </div>

            {/* Split Image View */}
            <div className="relative h-64 rounded-xl overflow-hidden border border-slate-700 select-none">
              {/* After Image (Base) */}
              <img 
                src={photos.afterPhotoUrl} 
                alt="After" 
                className="absolute inset-0 h-full w-full object-cover" 
              />
              
              {/* Before Image (Clipped by slider) */}
              <div 
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-2xl"
                style={{ width: `${sliderPos}%` }}
              >
                <img 
                  src={photos.beforePhotoUrl} 
                  alt="Before" 
                  className="absolute inset-0 h-full max-w-none object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  BEFORE (قبل)
                </div>
              </div>

              <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                AFTER (بعد)
              </div>
            </div>

            {/* Slider Control */}
            <input 
              type="range" 
              min={0} 
              max={100} 
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>
        )}

        {/* Portfolio Showcase Toggle */}
        <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {isAr ? 'عرض هذا الإنجاز في معرض أعمال الحرفي العام (Portfolio Showcase)' : 'Showcase this repair in public portfolio'}
            </Label>
            <p className="text-[11px] text-muted-foreground">
              {isAr 
                ? 'يتم حجب بيانات العميل وموقعه واسمه بنسبة 100% لضمان الخصوصية التامة' 
                : 'Customer address and personal info will remain 100% anonymous'}
            </p>
          </div>
          <Switch 
            checked={photos.showcaseInPortfolio}
            onCheckedChange={handleTogglePortfolio}
            disabled={!hasBothPhotos}
          />
        </div>
      </CardContent>
    </Card>
  );
}
