'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Sparkle, 
  Smile, 
  Wallet, 
  HeartHandshake, 
  EyeOff, 
  Award,
  UploadCloud,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MutualReviewState, CustomerEvaluation, CraftsmanEvaluation } from '@/types/craftsmen';

interface MutualTwoWayReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'customer' | 'craftsman' | 'admin';
  reviews: MutualReviewState;
  onSubmitReview: (updatedReviews: MutualReviewState) => void;
  craftsmanName: string;
  customerName: string;
}

export function MutualTwoWayReviewModal({
  isOpen,
  onClose,
  userRole,
  reviews,
  onSubmitReview,
  craftsmanName,
  customerName
}: MutualTwoWayReviewModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  // Customer Form State
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [customerChips, setCustomerChips] = useState({
    punctuality: true,
    cleanliness: true,
    technicalSkill: true,
    pricingTransparency: true
  });
  const [customerComment, setCustomerComment] = useState('عمل احترافي وممتاز وسرعة في الحضور والاستجابة.');

  // Craftsman Form State
  const [craftsmanRating, setCraftsmanRating] = useState<number>(5);
  const [craftsmanChips, setCraftsmanChips] = useState({
    safetyAndRespect: true,
    paymentPromptness: true,
    workEnvironmentSafe: true,
    clearInstructions: true
  });
  const [craftsmanComment, setCraftsmanComment] = useState('عميل محترم جداً، بيئة عمل مريحة وسرعة في السداد.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let updated: MutualReviewState = { ...reviews };

    if (userRole === 'customer') {
      const custEval: CustomerEvaluation = {
        rating: customerRating,
        chips: customerChips,
        comment: customerComment,
        submittedAt: new Date().toISOString()
      };
      updated.customerReview = custEval;
    } else if (userRole === 'craftsman') {
      const craftEval: CraftsmanEvaluation = {
        rating: craftsmanRating,
        chips: craftsmanChips,
        comment: craftsmanComment,
        submittedAt: new Date().toISOString()
      };
      updated.craftsmanReview = craftEval;
    }

    // Check if double-blind reveal triggers (both submitted)
    if (updated.customerReview && updated.craftsmanReview) {
      updated.isRevealed = true;
      updated.revealedAt = new Date().toISOString();
    }

    onSubmitReview(updated);
    onClose();

    toast({
      title: isAr ? '🌟 تم تسجيل تقييمك بنجاح!' : '🌟 Evaluation Submitted Successfully!',
      description: isAr 
        ? (updated.isRevealed 
            ? 'اكتمل التقييم المتبادل من الطرفين وأصبح مرئياً للجميع!' 
            : 'نظام التقييم مزدوج التعمية (Double-Blind) - سيظهر التقييم فور تقييم الطرف الآخر أو بعد 48 ساعة.')
        : (updated.isRevealed
            ? 'Both parties evaluated! Reviews are now publicly visible.'
            : 'Double-blind review stored. Will unlock once both parties submit.')
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-6 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2 shadow-inner">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-headline">
            {isAr ? 'نظام التقييم والسمعة المتبادل (Two-Way Rating)' : 'Mutual Two-Way Rating System'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <EyeOff className="h-3.5 w-3.5 text-primary" />
            {isAr 
              ? 'تقييم مزدوج التعمية (Double-Blind): لا يرى أي طرف تقييم الآخر حتى يقدم كلاهما تقييمه' 
              : 'Double-blind review: hidden until both parties submit to guarantee fairness'}
          </DialogDescription>
        </DialogHeader>

        {/* CUSTOMER EVALUATING CRAFTSMAN */}
        {userRole === 'customer' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* 5-Star Rating Selector */}
            <div className="text-center space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
              <span className="text-xs font-bold text-muted-foreground block">
                {isAr ? `كيف كانت تجربة الخدمة مع الحرفي (${craftsmanName})؟` : `Rate your experience with ${craftsmanName}:`}
              </span>
              <div className="flex justify-center items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCustomerRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        star <= customerRating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-300 dark:text-slate-700'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600 font-headline">
                {customerRating === 5 ? (isAr ? 'ممتاز وخدمة مثالية 🌟' : 'Exceptional 5/5') : `${customerRating} / 5`}
              </span>
            </div>

            {/* Categorical Chips */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{isAr ? 'معايير جودة الخدمة (اختر ما ينطبق):' : 'Quality Assessment Chips:'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'punctuality', titleAr: '⏱️ الالتزام بالوقت والسرعة', titleEn: '⏱️ Punctuality' },
                  { key: 'cleanliness', titleAr: '🧹 النظافة بعد انتهاء العمل', titleEn: '🧹 Cleanliness' },
                  { key: 'technicalSkill', titleAr: '🛠️ المهارة والاحترافية', titleEn: '🛠️ Technical Skill' },
                  { key: 'pricingTransparency', titleAr: '🧾 الشفافية في الأسعار', titleEn: '🧾 Fair Pricing' },
                ].map((chip) => {
                  const isSelected = (customerChips as any)[chip.key];
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setCustomerChips({ ...customerChips, [chip.key]: !isSelected })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? chip.titleAr : chip.titleEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label className="text-xs font-bold">{isAr ? 'ملاحظاتك ومراجعتك للعمل *' : 'Review & Comments *'}</Label>
              <Textarea 
                value={customerComment}
                onChange={(e) => setCustomerComment(e.target.value)}
                placeholder="اكتب تفاصيل تجربتك هنا..."
                className="text-xs mt-1"
                rows={3}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {isAr ? 'إرسال التقييم بأمان' : 'Submit Secure Review'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* CRAFTSMAN EVALUATING CUSTOMER */}
        {userRole === 'craftsman' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* 5-Star Rating Selector */}
            <div className="text-center space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
              <span className="text-xs font-bold text-muted-foreground block">
                {isAr ? `كيف كانت تجربة العمل والتعامل مع العميل (${customerName})؟` : `Rate your experience working with ${customerName}:`}
              </span>
              <div className="flex justify-center items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCraftsmanRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        star <= craftsmanRating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-300 dark:text-slate-700'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600 font-headline">
                {craftsmanRating === 5 ? (isAr ? 'عميل رائع ومحترم 🌟' : 'Excellent Client 5/5') : `${craftsmanRating} / 5`}
              </span>
            </div>

            {/* Categorical Chips for Craftsman */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{isAr ? 'معايير تقييم العميل وبيئة العمل:' : 'Client Evaluation Chips:'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'safetyAndRespect', titleAr: '🤝 الاحترام وحسن الاستقبال', titleEn: '🤝 Safety & Respect' },
                  { key: 'paymentPromptness', titleAr: '💳 سرعة وتيسير الدفع', titleEn: '💳 Prompt Payment' },
                  { key: 'workEnvironmentSafe', titleAr: '🏡 بيئة عمل آمنة ومريحة', titleEn: '🏡 Safe Work Area' },
                  { key: 'clearInstructions', titleAr: '📋 وضوح شرح المشكلة', titleEn: '📋 Clear Description' },
                ].map((chip) => {
                  const isSelected = (craftsmanChips as any)[chip.key];
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setCraftsmanChips({ ...craftsmanChips, [chip.key]: !isSelected })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? chip.titleAr : chip.titleEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label className="text-xs font-bold">{isAr ? 'ملاحظاتك وتقييمك للعميل *' : 'Review for Customer *'}</Label>
              <Textarea 
                value={craftsmanComment}
                onChange={(e) => setCraftsmanComment(e.target.value)}
                placeholder="اكتب انطباعك عن التعامل..."
                className="text-xs mt-1"
                rows={3}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {isAr ? 'إرسال التقييم بأمان' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
