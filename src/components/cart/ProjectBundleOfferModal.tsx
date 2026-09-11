'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Wrench, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  Truck,
  MessageCircle,
  MapPin,
  Clock
} from 'lucide-react';
import { algerianWilayas } from '@/data/algerian-wilayas';

export interface CertifiedTechnician {
  id: string;
  name: string;
  professionAr: string;
  professionEn: string;
  avatarUrl: string;
  rating: number;
  completedJobs: number;
  phone: string;
  wilayaCode: string;
  wilayaName: string;
  installationFee: number;
  warrantyMonths: number;
  nextAvailableSlot: string;
}

export const SAMPLE_TECHNICIANS: CertifiedTechnician[] = [
  {
    id: 'tech-001',
    name: 'كريم بلحاج (Karim Belhadj)',
    professionAr: 'فني تكييف وتبريد معتمد',
    professionEn: 'Certified HVAC & AC Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    rating: 4.95,
    completedJobs: 342,
    phone: '0661 23 45 67',
    wilayaCode: '16',
    wilayaName: 'الجزائر العاصمة',
    installationFee: 3500,
    warrantyMonths: 12,
    nextAvailableSlot: 'غداً صباحاً (09:30)',
  },
  {
    id: 'tech-002',
    name: 'مصطفى بوزيان (Mustapha Bouziane)',
    professionAr: 'خبير سباكة وتدفئة مركزية',
    professionEn: 'Certified Plumbing & Heating Expert',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.91,
    completedJobs: 289,
    phone: '0555 89 12 34',
    wilayaCode: '22',
    wilayaName: 'سيدي بلعباس',
    installationFee: 2800,
    warrantyMonths: 6,
    nextAvailableSlot: 'اليوم بعد الظهر (14:00)',
  },
  {
    id: 'tech-003',
    name: 'حمزة عماري (Hamza Ammari)',
    professionAr: 'كهربائي معتمد وأنظمة إنارة',
    professionEn: 'Certified Master Electrician',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4.88,
    completedJobs: 215,
    phone: '0770 45 67 89',
    wilayaCode: '31',
    wilayaName: 'وهران',
    installationFee: 2500,
    warrantyMonths: 6,
    nextAvailableSlot: 'غداً ظهراً (13:30)',
  }
];

interface ProjectBundleOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  productImage?: string;
  userWilayaCode?: string;
  onAddBundle: (bundleDetails: {
    technician: CertifiedTechnician;
    installationFee: number;
    scheduledDate: string;
  }) => void;
}

export function ProjectBundleOfferModal({
  isOpen,
  onClose,
  productName,
  productPrice,
  productImage,
  userWilayaCode = '22',
  onAddBundle,
}: ProjectBundleOfferModalProps) {
  const [selectedWilaya, setSelectedWilaya] = useState(userWilayaCode);
  const matchedTechs = SAMPLE_TECHNICIANS.filter((t) => t.wilayaCode === selectedWilaya);
  const activeTech = matchedTechs.length > 0 ? matchedTechs[0] : SAMPLE_TECHNICIANS[0];
  const [chosenTech, setChosenTech] = useState<CertifiedTechnician>(activeTech);
  const [scheduledSlot, setScheduledSlot] = useState(activeTech.nextAvailableSlot);

  const handleConfirm = () => {
    onAddBundle({
      technician: chosenTech,
      installationFee: chosenTech.installationFee,
      scheduledDate: scheduledSlot,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-primary/20 text-card-foreground p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1.5 px-3 py-1 font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>عرض حصري • صفقة متكاملة بضغطة واحدة</span>
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">One-Click Project Pack</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold font-headline text-foreground">
            هل تحتاج لتركيب معتمد وضمان لمنتجك؟
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            وفّر عناء البحث عن حرفي! نوفر لك فني مؤهل ومعتمد في ولايتك ليصلك بالتزامن مع تسليم الطرد تحت مظلة وساطة مالية موحدة (Unified Escrow).
          </DialogDescription>
        </DialogHeader>

        {/* Selected Product Banner */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border mt-2">
          <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-background shrink-0 border">
            <Image
              src={productImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=60'}
              alt={productName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-muted-foreground">الجهاز المحدد في السلة:</p>
            <h4 className="text-sm font-bold truncate text-foreground">{productName}</h4>
            <span className="text-xs font-semibold text-primary">{productPrice.toLocaleString()} DA</span>
          </div>
        </div>

        {/* Wilaya Filter */}
        <div className="space-y-2 text-right mt-3">
          <label className="text-xs font-semibold flex items-center gap-1 text-muted-foreground justify-end">
            <span>اختر ولاية التركيب لمطابقة الفنيين المعتمدين:</span>
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </label>
          <select
            value={selectedWilaya}
            onChange={(e) => {
              setSelectedWilaya(e.target.value);
              const found = SAMPLE_TECHNICIANS.find((t) => t.wilayaCode === e.target.value);
              if (found) {
                setChosenTech(found);
                setScheduledSlot(found.nextAvailableSlot);
              }
            }}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
          >
            {algerianWilayas.map((w: any) => (
              <option key={w.code} value={w.code}>
                {w.code} - {w.name} ({w.name_fr || w.nameFr || ''})
              </option>
            ))}
          </select>
        </div>

        {/* Technician Card */}
        <Card className="p-4 border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-transparent rounded-xl space-y-3 mt-2">
          <div className="flex items-start justify-between gap-3 flex-row-reverse">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary shrink-0 shadow-sm">
              <Image
                src={chosenTech.avatarUrl}
                alt={chosenTech.name}
                fill
                className="object-cover"
              />
              <span className="absolute bottom-0 right-0 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white" />
            </div>

            <div className="flex-1 text-right space-y-1">
              <div className="flex items-center justify-end gap-1.5">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <ShieldCheck className="h-3 w-3 ml-1 inline" /> فني موثق ومعتمد
                </Badge>
                <h3 className="font-bold text-base text-foreground">{chosenTech.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{chosenTech.professionAr}</p>
              
              <div className="flex items-center justify-end gap-3 text-xs pt-1">
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{chosenTech.completedJobs}</strong> عملية منجزة
                </span>
                <span className="inline-flex items-center text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500 mr-1 inline" />
                  {chosenTech.rating}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/80 text-xs">
            <div className="p-2.5 rounded-lg bg-background border text-right">
              <span className="text-muted-foreground block text-[11px]">موعد التركيب المتزامن:</span>
              <span className="font-bold text-foreground flex items-center gap-1 justify-end mt-0.5">
                <Clock className="h-3 w-3 text-primary" /> {scheduledSlot}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border text-right">
              <span className="text-muted-foreground block text-[11px]">أتعاب التركيب والضمان:</span>
              <span className="font-extrabold text-primary text-sm mt-0.5 block">
                +{chosenTech.installationFee.toLocaleString()} DA
              </span>
            </div>
          </div>
        </Card>

        {/* Benefits Checklist */}
        <div className="space-y-2 bg-muted/40 p-3 rounded-xl text-xs text-right border">
          <h5 className="font-bold text-foreground flex items-center justify-end gap-1.5">
            <span>مزايا الصفقة المتكاملة من خدماتك:</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </h5>
          <ul className="space-y-1.5 text-muted-foreground">
            <li className="flex items-center justify-end gap-2">
              <span><strong>وساطة مالية واحدة:</strong> لا تُدفع أتعاب الفني والتاجر إلا بعد التركيب والفحص بنجاح.</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            </li>
            <li className="flex items-center justify-end gap-2">
              <span><strong>ضمان تشغيل {chosenTech.warrantyMonths} أشهر:</strong> في حال حدوث أي عطل بالتركيب يُصلح مجاناً.</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            </li>
            <li className="flex items-center justify-end gap-2">
              <span><strong>إشعار WhatsApp فوري:</strong> تصلك بيانات الحرفي ورابط التتبع المباشر وكود الأمان SMS.</span>
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            </li>
          </ul>
        </div>

        {/* Price Total Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">إجمالي الصفقة المتكاملة (الجهاز + التركيب):</span>
            <span className="text-lg font-black text-primary">
              {(productPrice + chosenTech.installationFee).toLocaleString()} DA
            </span>
          </div>
          <Badge className="bg-primary text-primary-foreground font-bold text-xs">
            توفير 15% على رسوم التركيب
          </Badge>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between pt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs">
            تخطي وشراء الجهاز فقط
          </Button>
          <Button 
            onClick={handleConfirm}
            className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 px-6"
          >
            <Wrench className="h-4 w-4" />
            تأكيد الصفقة وإضافة الفني (+{chosenTech.installationFee.toLocaleString()} DA)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
