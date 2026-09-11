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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { ReviewReportReason } from '@/types/reviews';
import { useLanguage } from '@/context/LanguageContext';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string | null;
  onSubmitReport: (reviewId: string, reason: ReviewReportReason, details?: string) => Promise<{ success: boolean }>;
}

export function ReportReviewModal({
  isOpen,
  onClose,
  reviewId,
  onSubmitReport,
}: ReportReviewModalProps) {
  const { translate } = useLanguage();
  const [reason, setReason] = useState<ReviewReportReason>('spam');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!reviewId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await onSubmitReport(reviewId, reason, details.trim() || undefined);
    setIsSubmitting(false);

    if (res.success) {
      setDetails('');
      onClose();
    }
  };

  const reportReasons: Array<{ id: ReviewReportReason; label: string; desc: string }> = [
    { id: 'spam', label: 'Spam or Commercial Promotion', desc: 'Contains promotional links, advertising, or repetitive text' },
    { id: 'fake_review', label: 'Fake or Misleading Review', desc: 'Reviewer never purchased or used the service' },
    { id: 'inappropriate', label: 'Inappropriate or Offensive Content', desc: 'Contains hate speech, profanity, or defamatory statements' },
    { id: 'harassment', label: 'Harassment or Bullying', desc: 'Direct attacks or personal information exposure' },
    { id: 'other', label: 'Other Policy Violation', desc: 'Any other violation of our community standards' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-sans text-left rtl:text-right">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <Flag className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold font-headline">
              {translate('reportThisReview', 'Report Inappropriate Review')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {translate('reportReviewDesc', 'Help us keep Khidmatik authentic. Reports are reviewed by our trust team within 24 hours.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {translate('selectViolationReason', 'Select Violation Reason')} *
            </Label>
            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as ReviewReportReason)}
              className="space-y-2"
            >
              {reportReasons.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={item.id} id={item.id} className="mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.desc}
                    </span>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-details" className="text-xs font-bold">
              {translate('additionalDetails', 'Additional Details (Optional)')}
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={translate('reportDetailsPlaceholder', 'Provide any extra context for our moderation team...')}
              rows={3}
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
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-10 px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{translate('submitReport', 'Submit Report')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
