'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  RotateCcw, 
  HelpCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { BuyerProtectionEscrow } from '@/types/ecommerce';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface BuyerProtectionEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrow: BuyerProtectionEscrow;
  onReleaseEscrow?: () => void;
  onOpenDispute?: (reason: string) => void;
}

export function BuyerProtectionEscrowModal({
  isOpen,
  onClose,
  escrow,
  onReleaseEscrow,
  onOpenDispute
}: BuyerProtectionEscrowModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const handleRelease = () => {
    onReleaseEscrow?.();
    toast({
      title: isAr ? '✓ تم تأكيد استلام الطرد وخلوه من العيوب' : '✓ Parcel Inspected & Accepted',
      description: isAr ? 'تم فك حجز الضمان المالي وتحويل المستحقات لمحفظة التاجر.' : 'Escrow released to seller.'
    });
    onClose();
  };

  const handleDisputeSubmit = () => {
    if (!disputeReason.trim()) return;
    onOpenDispute?.(disputeReason);
    toast({
      title: isAr ? '🚨 تم فتح طلب نزاع واسترجاع مالي' : '🚨 Dispute Ticket Opened',
      description: isAr ? 'تم تجميد أموال الضمان وتكليف إدارة المنصة بالتحكيم وفحص الصور.' : 'Funds locked in escrow for admin arbitration.'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-6 rounded-3xl" dir={isAr ? 'rtl' : 'ltr'}>
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                {isAr ? 'نظام حماية المشتري والضمان المالي (Escrow)' : 'Buyer Protection & Escrow Vault'}
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                  {isAr ? 'أموالك بأمان 100%' : '100% Secure'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr 
                  ? 'يتم حجز قيمة الطلب لدى المنصة ولا تُحوّل للبائع إلا بعد فحص الطرد والتأكد من خلوه من العيوب' 
                  : 'Funds are safely locked in platform escrow until you inspect and accept the parcel'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          
          {/* Escrow Status & 5-Day Countdown Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground">{isAr ? 'حالة الضمان المالي:' : 'Escrow Status:'}</span>
              <Badge className="bg-primary text-primary-foreground font-bold text-xs font-mono">
                #{escrow.orderId} • {escrow.escrowStatus}
              </Badge>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-muted-foreground">{isAr ? 'المبلغ المحجوز في الضمان:' : 'Protected Amount:'}</span>
              <span className="text-2xl font-black font-mono text-emerald-600" suppressHydrationWarning>
                {escrow.totalAmountDA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {isAr ? 'دج' : 'DZD'}
              </span>
            </div>

            {/* Countdown Badge */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <Clock className="h-4 w-4 text-amber-600 animate-spin" />
                <span>{isAr ? 'فترة الحماية المتبقية للمعاينة:' : 'Inspection Window Remaining:'}</span>
              </div>
              <span className="font-black font-mono text-amber-900 dark:text-amber-200">
                {escrow.protectionDaysRemaining} {isAr ? 'أيام متبقية' : 'days left'}
              </span>
            </div>
          </div>

          {/* Integrated Algerian Payment Proof Information */}
          <div className="p-3 rounded-xl border bg-card space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-primary" />
                {isAr ? 'طريقة الدفع المعتمدة:' : 'Payment Method:'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'البطاقة الذهبية / CIB (دفع إلكتروني آمن 3DS)' : 'Edahabia / CIB 3DS Secured'}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-600" />
                {isAr ? 'موعد فك الحجز التلقائي:' : 'Auto Release Deadline:'}
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{escrow.autoReleaseDeadline}</span>
            </div>
          </div>

          {/* Actions: Accept & Release vs Open Dispute */}
          {!isDisputeOpen ? (
            <div className="space-y-2.5 pt-2">
              <Button
                onClick={handleRelease}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-11 rounded-xl shadow-md gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isAr ? 'تأكيد استلام الطرد سليم وفك حجز الضمان' : 'Confirm Order Received (Release Escrow)'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsDisputeOpen(true)}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs h-10 rounded-xl gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {isAr ? 'يوجد خلل في المنتج؟ فتح طلب نزاع واسترجاع' : 'Product Defective? Open Dispute'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60">
              <div className="flex justify-between items-center text-xs font-bold text-red-700 dark:text-red-300">
                <span>{isAr ? 'تفاصيل سبب النزاع والاسترجاع:' : 'Dispute & Refund Reason:'}</span>
                <Button size="sm" variant="ghost" onClick={() => setIsDisputeOpen(false)} className="h-6 text-xs px-2">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>

              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={isAr ? 'اذكر تفاصيل المشكلة (مثال: المنتج لا يطابق المواصفات، به كسر، أو لم يصل)...' : 'Describe the issue...'}
                className="w-full h-20 p-2.5 text-xs rounded-xl border bg-background"
              />

              <Button
                onClick={handleDisputeSubmit}
                disabled={!disputeReason.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs h-10 rounded-xl"
              >
                {isAr ? 'إرسال طلب التحكيم وتجميد المبلغ' : 'Submit Dispute & Freeze Funds'}
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
