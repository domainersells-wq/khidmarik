'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { messagingService } from '@/services/messagingService';
import { ReportReason } from '@/types/messaging';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  conversationId?: string;
  messageId?: string;
}

export function ReportUserModal({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  conversationId,
  messageId
}: ReportUserModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { translate } = useLanguage();

  const [reason, setReason] = useState<ReportReason>('inappropriate_content');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons: { id: ReportReason; labelAr: string; labelEn: string; desc: string }[] = [
    { id: 'inappropriate_content', labelAr: 'محتوى غير لائق أو مسيء', labelEn: 'Inappropriate or abusive content', desc: 'Offensive language, nudity, or inappropriate behavior' },
    { id: 'harassment', labelAr: 'مضايقة أو تهديد', labelEn: 'Harassment or threats', desc: 'Bullying, persistent unwanted messages, or intimidation' },
    { id: 'fraud', labelAr: 'احتيال أو نشاط مشبوه', labelEn: 'Scam, fraud, or suspicious activity', desc: 'Attempting to deceive, counterfeit goods, or fake profile' },
    { id: 'off_platform_payment', labelAr: 'طلب دفع خارج المنصة (تجاوز الضمان)', labelEn: 'Off-platform payment request', desc: 'Requesting cash or bypassing Khidmatik escrow guarantee' },
    { id: 'spam', labelAr: 'إعلانات مزعجة أو سبام', labelEn: 'Spam or unsolicited advertising', desc: 'Repeated promotional messages or unsolicited offers' },
    { id: 'other', labelAr: 'سبب آخر', labelEn: 'Other reason', desc: 'Any other violation of terms' }
  ];

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ title: 'Please log in to submit a report', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await messagingService.reportUser({
        reporterId: user.id,
        reportedUserId: targetUserId,
        conversationId,
        messageId,
        reason,
        description: description.trim()
      });

      if (res.success) {
        toast({
          title: translate('reportSubmitted', 'Report Submitted'),
          description: translate('reportSubmittedDesc', 'Thank you. Our trust and safety team will review this report within 24 hours.')
        });
        setDescription('');
        onClose();
      } else {
        toast({
          title: 'Report failed',
          description: res.error || 'Please try again later.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 font-sans">
        <DialogHeader className="space-y-2 text-left rtl:text-right">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {translate('reportUser', 'Report User')}: {targetUserName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {translate('reportUserDesc', 'Your report is confidential. Help us keep Khidmatik safe and authentic.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-left rtl:text-right text-xs">
          <div className="space-y-2">
            <Label className="font-semibold text-slate-800 dark:text-slate-200">
              {translate('selectReason', 'Select a reason')}
            </Label>
            <RadioGroup
              value={reason}
              onValueChange={(val) => setReason(val as ReportReason)}
              className="space-y-2"
            >
              {reportReasons.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    reason === r.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <RadioGroupItem value={r.id} id={r.id} className="mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {translate(`report_${r.id}`, r.labelEn)}
                    </span>
                    <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-slate-800 dark:text-slate-200">
              {translate('additionalDetails', 'Additional Details (Optional)')}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={translate('reportDetailsPlaceholder', 'Describe the issue or specify details...')}
              className="rounded-xl border-input text-xs min-h-[75px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            {translate('cancel', 'Cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isSubmitting ? translate('submitting', 'Submitting...') : translate('submitReport', 'Submit Report')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
