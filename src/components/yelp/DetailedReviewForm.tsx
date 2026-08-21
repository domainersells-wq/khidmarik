'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/LanguageContext';
import { Star, Image as ImageIcon, Video, HelpCircle, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { yelpService } from '@/services/yelpService';
import type { Review } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DetailedReviewFormProps {
  listingId: string;
  onReviewSubmitSuccess: (newReview: Review) => void;
  userId?: string;
  userName?: string;
}

export function DetailedReviewForm({ listingId, onReviewSubmitSuccess, userId, userName }: DetailedReviewFormProps) {
  const { language } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isFakeReviewWarning, setIsFakeReviewWarning] = useState(false);

  // Review subcategories
  const [quality, setQuality] = useState(5);
  const [price, setPrice] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [speed, setSpeed] = useState(5);
  const [staff, setStaff] = useState(5);

  const checkFakeReviewPattern = (text: string) => {
    // Simple AI heuristics detection for mock spam:
    // Repeated phrases, excessive exclamation marks, spam keywords like "buy now", "discount code".
    const spamTerms = ['amazing cheap', 'visit this site', 'make money', 'super clean wow'];
    const hasRepeatedExclamation = /!!!+/.test(text);
    const hasSpamTerm = spamTerms.some(term => text.toLowerCase().includes(term));
    const isTooShort = text.trim().length > 0 && text.trim().length < 5;
    
    setIsFakeReviewWarning(hasRepeatedExclamation || hasSpamTerm || isTooShort);
  };

  const handleMediaUpload = () => {
    // Mock image/video attachment addition
    const mockImageUrls = [
      'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=500&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&fit=crop'
    ];
    const randomImg = mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];
    setMediaUrls(prev => [...prev, randomImg]);
    toast({ title: language === 'ar' ? 'تم رفع الصورة' : 'Image Uploaded successfully (Mock)' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({ title: language === 'ar' ? 'الرجاء إدخال تعليق' : 'Please write a comment', variant: 'destructive' });
      return;
    }

    if (isFakeReviewWarning) {
      toast({ 
        title: language === 'ar' ? 'تحذير تقييم مشبوه' : 'Suspicious Review Flagged',
        description: language === 'ar' ? 'نظام الذكاء الاصطناعي اكتشف نمط كتابة غير طبيعي.' : 'AI detected spam patterns. Please write an authentic review.',
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    const authorName = userName || 'Anonymous Client';
    const authorId = userId || 'anonymous_user';

    const newReview = await yelpService.submitDetailedReview({
      listingId,
      authorId,
      authorName,
      rating,
      comment,
      detailedRatings: {
        qualityOfWork: quality,
        timeliness: speed,
        cleanliness,
        staff,
        price
      },
      mediaUrls
    });

    onReviewSubmitSuccess(newReview);
    setComment('');
    setMediaUrls([]);
    setIsSubmitting(false);
  };

  const isRtl = language === 'ar';

  return (
    <form onSubmit={handleSubmit} className="border p-5 rounded-2xl bg-card space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-headline font-bold text-lg text-foreground">
          {isRtl ? 'اكتب مراجعة تفصيلية' : 'Write a Detailed Review'}
        </h3>
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {isRtl ? 'التحقق بالذكاء الاصطناعي' : 'AI Verified Review'}
        </Badge>
      </div>

      {/* Main Overall Star selection */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground block">
          {isRtl ? 'التقييم العام *' : 'Overall Rating *'}
        </label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-yellow-400 hover:scale-115 transition-transform"
            >
              <Star className={`h-8 w-8 ${star <= rating ? 'fill-current' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Multi-criteria detailed ratings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
        {[
          { label: isRtl ? 'جودة الخدمة' : 'Quality of Work', val: quality, set: setQuality },
          { label: isRtl ? 'مناسبة السعر' : 'Value / Price', val: price, set: setPrice },
          { label: isRtl ? 'النظافة' : 'Cleanliness', val: cleanliness, set: setCleanliness },
          { label: isRtl ? 'السرعة والوقت' : 'Speed / Timeliness', val: speed, set: setSpeed },
          { label: isRtl ? 'تعامل الموظفين' : 'Staff Friendliness', val: staff, set: setStaff }
        ].map((item, idx) => (
          <div key={idx} className="space-y-1 bg-muted/40 p-2.5 rounded-xl border">
            <span className="text-xs font-bold text-muted-foreground block">{item.label}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => item.set(star)}
                  className="text-yellow-400"
                >
                  <Star className={`h-4.5 w-4.5 ${star <= item.val ? 'fill-current' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Review Comment input */}
      <div className="space-y-2 relative">
        <label className="text-sm font-bold text-foreground block">
          {isRtl ? 'تعليقك *' : 'Your Review *'}
        </label>
        <Textarea
          placeholder={isRtl ? 'شاركنا تفاصيل تجربتك مع الخدمة...' : 'Describe your experience with this service...'}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            checkFakeReviewPattern(e.target.value);
          }}
          className={cn("min-h-[100px]", isFakeReviewWarning && "border-destructive focus-visible:ring-destructive")}
        />

        {isFakeReviewWarning && (
          <div className="text-xs text-destructive font-bold flex items-center gap-1 mt-1.5 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            {isRtl ? 'تنبيه: تم اكتشاف محتوى مكرر أو نمط غير مرغوب فيه!' : 'Warning: AI flags potential spam or repetitive patterns!'}
          </div>
        )}
      </div>

      {/* Attach Media */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMediaUpload}
          className="flex items-center gap-1 text-xs"
        >
          <ImageIcon className="h-4 w-4 text-primary" />
          {isRtl ? 'أضف صور' : 'Attach Photos'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toast({ title: isRtl ? 'تم إضافة الفيديو' : 'Attached video (Mock)' })}
          className="flex items-center gap-1 text-xs"
        >
          <Video className="h-4 w-4 text-primary" />
          {isRtl ? 'أضف فيديو' : 'Attach Video'}
        </Button>
        
        {/* Render uploaded image previews */}
        <div className="flex gap-2 items-center">
          {mediaUrls.map((url, idx) => (
            <img key={idx} src={url} alt="attached thumbnail" className="w-10 h-10 object-cover rounded-lg border shadow-sm" />
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-headline font-bold"
      >
        {isSubmitting ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال التقييم' : 'Submit Review')}
      </Button>
    </form>
  );
}

export default DetailedReviewForm;
