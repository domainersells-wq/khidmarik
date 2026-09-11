'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Store, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { EnhancedReview } from '@/types/reviews';
import { useLanguage } from '@/context/LanguageContext';

interface ReviewReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: EnhancedReview | null;
  onSubmitReply: (reviewId: string, replyText: string) => Promise<{ success: boolean; error?: string }>;
}

export function ReviewReplyModal({
  isOpen,
  onClose,
  review,
  onSubmitReply,
}: ReviewReplyModalProps) {
  const { translate } = useLanguage();
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const res = await onSubmitReply(review.id, replyText.trim());
    setIsSubmitting(false);

    if (res.success) {
      setReplyText('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-sans text-left rtl:text-right">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold rounded-full gap-1">
              <Store className="h-3.5 w-3.5" />
              <span>{translate('officialResponse', 'Official Merchant Response')}</span>
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold font-headline">
            {translate('replyToCustomer', 'Reply to')} {review.authorName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {translate('replyDesc', 'Your public response will be pinned directly below the customer’s review.')}
          </DialogDescription>
        </DialogHeader>

        {/* Customer Review Snippet */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground font-semibold">
            <span>{review.authorName}</span>
            <span>⭐ {review.rating.toFixed(1)}/5.0</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 italic line-clamp-2">
            "{review.comment}"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reply-text" className="text-xs font-bold">
              {translate('yourResponse', 'Your Response')} *
            </Label>
            <Textarea
              id="reply-text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={translate('replyPlaceholder', 'Thank you for your review! We appreciate your feedback...')}
              rows={4}
              required
              className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs resize-none"
            />
          </div>

          <DialogFooter className="p-0 pt-2 flex items-center justify-end gap-2">
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
              disabled={isSubmitting || !replyText.trim()}
              className="rounded-xl text-xs font-bold h-10 px-6 bg-primary hover:bg-primary/95 text-primary-foreground gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{translate('postResponse', 'Post Official Reply')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
