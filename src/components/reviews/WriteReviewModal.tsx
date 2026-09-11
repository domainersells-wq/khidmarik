'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Star,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Video,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ReviewAspectRatings, ReviewMedia, ReviewEligibility, ReviewTargetType } from '@/types/reviews';
import { reviewService } from '@/services/reviewService';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: ReviewTargetType;
  targetTitle?: string;
  eligibility: ReviewEligibility;
  onSubmitSuccess: () => void;
}

export function WriteReviewModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetTitle,
  eligibility,
  onSubmitSuccess,
}: WriteReviewModalProps) {
  const { translate } = useLanguage();
  const { user } = useAuth();

  // Selected Order
  const unreviewedOrders = eligibility.eligibleOrders.filter((o) => !o.alreadyReviewed);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    unreviewedOrders[0]?.id || ''
  );

  // Overall & 5 criteria ratings
  const [overallRating, setOverallRating] = useState<number>(5);
  const [aspects, setAspects] = useState<ReviewAspectRatings>({
    overall: 5,
    quality: 5,
    price: 5,
    communication: 5,
    punctuality: 5,
    professionalism: 5,
  });

  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [mediaList, setMediaList] = useState<ReviewMedia[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAspectChange = (key: keyof ReviewAspectRatings, val: number) => {
    setAspects((prev) => ({ ...prev, [key]: val }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await reviewService.uploadMedia(file, targetId, user?.id || 'anonymous');
        setMediaList((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please log in to submit a review.');
      return;
    }

    if (!comment.trim()) {
      setErrorMessage('Please enter your review comments.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await reviewService.submitReview({
      targetId,
      targetType,
      authorId: user.id,
      authorName: user.name || 'Customer',
      authorAvatar: user.avatarUrl,
      orderId: selectedOrderId || undefined,
      rating: overallRating,
      aspects: {
        ...aspects,
        overall: overallRating,
      },
      title: title.trim() || undefined,
      comment: comment.trim(),
      mediaUrls: mediaList,
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onClose();
      onSubmitSuccess();
    }
  };

  const criteriaConfigs: Array<{
    key: keyof ReviewAspectRatings;
    labelEn: string;
    descEn: string;
  }> = [
    { key: 'quality', labelEn: 'Quality of Work / Products', descEn: 'Craftsmanship, condition, and accuracy' },
    { key: 'price', labelEn: 'Price & Value for Money', descEn: 'Fairness of price compared to market quality' },
    { key: 'communication', labelEn: 'Communication & Response', descEn: 'Clarity, politeness, and responsiveness' },
    { key: 'punctuality', labelEn: 'Punctuality & Delivery Speed', descEn: 'Meeting agreed timelines and milestones' },
    { key: 'professionalism', labelEn: 'Professionalism & Expertise', descEn: 'Skill, reliability, and respectful service' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 font-sans max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-left rtl:text-right">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-full gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{translate('verifiedReview', 'Verified Customer Review')}</span>
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 font-headline">
            {translate('rateAndReview', 'Rate & Review')} {targetTitle ? `"${targetTitle}"` : ''}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {translate('writeReviewDesc', 'Share your genuine experience with detailed multi-criteria feedback.')}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-left rtl:text-right">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Order / Booking Selector */}
          {unreviewedOrders.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                {translate('selectOrderToReview', 'Select Completed Order / Service')}
              </Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-10 text-xs font-semibold">
                  <SelectValue placeholder="Select completed order..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl font-sans">
                  {unreviewedOrders.map((ord) => (
                    <SelectItem key={ord.id} value={ord.id} className="text-xs">
                      {ord.title} ({new Date(ord.date).toLocaleDateString()}) {ord.amount ? `- ${ord.amount} DA` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 2. Overall Rating (Big 5-Star Selector) */}
          <div className="p-4 rounded-2xl bg-amber-400/5 dark:bg-amber-400/10 border border-amber-400/20 text-center space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {translate('overallRating', 'Overall Rating')}
            </Label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setOverallRating(star)}
                  className="p-1 rounded-xl hover:scale-110 active:scale-95 transition-all text-amber-400"
                >
                  <Star
                    className={cn(
                      "h-8 w-8",
                      star <= overallRating
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "text-slate-300 dark:text-slate-700"
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300 block">
              {overallRating} / 5.0 Stars
            </span>
          </div>

          {/* 3. 5 Detailed Structured Criteria */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {translate('rateSpecificAspects', 'Detailed Aspect Ratings')}
            </h4>

            <div className="space-y-3">
              {criteriaConfigs.map((crit) => {
                const currentVal = aspects[crit.key];

                return (
                  <div key={crit.key} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-200/40 dark:border-slate-800/40 last:border-none">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {translate(`criteria_${crit.key}`, crit.labelEn)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {crit.descEn}
                      </span>
                    </div>

                    {/* Mini 5-star selector */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => handleAspectChange(crit.key, star)}
                          className="p-0.5 hover:scale-110 transition-transform text-amber-400"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              star <= currentVal
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-700"
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold font-mono w-4 text-center ml-1">
                        {currentVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Review Title & Text */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="review-title" className="text-xs font-bold">
                {translate('reviewTitle', 'Review Headline (Optional)')}
              </Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={translate('reviewTitlePlaceholder', 'e.g. Excellent service and authentic products!')}
                className="rounded-xl border-slate-200 dark:border-slate-800 h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review-comment" className="text-xs font-bold">
                {translate('detailedReview', 'Detailed Review')} *
              </Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={translate('detailedReviewPlaceholder', 'What did you like or dislike? How was the service, communication, and delivery?')}
                rows={4}
                required
                className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs resize-none"
              />
            </div>
          </div>

          {/* 5. Photo & Video Upload Zone */}
          <div className="space-y-2">
            <Label className="text-xs font-bold block">
              {translate('addPhotosVideos', 'Add Photos or Video Clips (Optional)')}
            </Label>

            <div className="flex items-center gap-2 flex-wrap">
              {mediaList.map((media, idx) => (
                <div
                  key={idx}
                  className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group shrink-0"
                >
                  {media.type === 'video' ? (
                    <div className="h-full w-full bg-slate-900 flex items-center justify-center text-white">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                  ) : (
                    <img src={media.url} alt="Review upload" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia || mediaList.length >= 6}
                className="h-16 w-28 rounded-xl border-dashed border-2 border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-[10px] font-semibold"
              >
                {isUploadingMedia ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>{translate('uploadMedia', 'Upload Media')}</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {translate('mediaUploadHint', 'Upload up to 6 high-resolution photos or video demonstrations.')}
            </p>
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="p-0 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs h-10 px-4"
            >
              {translate('cancel', 'Cancel')}
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="rounded-xl text-xs font-bold h-10 px-6 bg-primary hover:bg-primary/95 text-primary-foreground gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>{translate('publishReview', 'Publish Verified Review')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
