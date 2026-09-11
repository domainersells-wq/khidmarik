'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  MessageCircle,
  Flag,
  ChevronDown,
  ChevronUp,
  Play,
  CornerDownRight,
  Store,
  Wrench,
  CheckCircle2,
  X
} from 'lucide-react';
import { EnhancedReview, ReviewMedia } from '@/types/reviews';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow, format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StructuredReviewCardProps {
  review: EnhancedReview;
  onToggleHelpful: (reviewId: string) => void;
  onOpenReplyModal: (review: EnhancedReview) => void;
  onOpenReportModal: (reviewId: string) => void;
  canReply?: boolean;
}

export function StructuredReviewCard({
  review,
  onToggleHelpful,
  onOpenReplyModal,
  onOpenReportModal,
  canReply = false,
}: StructuredReviewCardProps) {
  const { language, translate } = useLanguage();
  const [showAspects, setShowAspects] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<ReviewMedia | null>(null);

  // Date locale
  const dateLocale = language === 'ar' ? ar : language === 'fr' ? fr : undefined;
  const formattedDate = review.createdAt
    ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: dateLocale })
    : '';

  const { aspects } = review;
  const isLongComment = review.comment.length > 250;
  const displayComment = isLongComment && !isExpanded
    ? `${review.comment.substring(0, 250)}...`
    : review.comment;

  return (
    <div className="p-5 md:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 font-sans text-left rtl:text-right">
      {/* Header: Author Info + Date */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-primary/10">
            <AvatarImage src={review.authorAvatar} alt={review.authorName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {review.authorName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-headline">
                {review.authorName}
              </span>
              {review.isVerifiedPurchase && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>{translate('verifiedPurchase', 'Verified Purchase')}</span>
                </Badge>
              )}
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* 5-Star Rating Badge */}
        <div className="flex items-center gap-1 bg-amber-400/10 dark:bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-xl shrink-0">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Review Title & Body */}
      <div className="space-y-1.5">
        {review.title && (
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {review.title}
          </h4>
        )}
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {displayComment}
        </p>
        {isLongComment && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-primary hover:underline pt-1 block"
          >
            {isExpanded ? translate('showLess', 'Show less') : translate('readMore', 'Read more')}
          </button>
        )}
      </div>

      {/* Media Attachments Gallery */}
      {review.mediaUrls && review.mediaUrls.length > 0 && (
        <div className="flex items-center gap-2.5 flex-wrap pt-1">
          {review.mediaUrls.map((media, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedMedia(media)}
              className="relative group h-20 w-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0 hover:ring-2 hover:ring-primary transition-all"
            >
              {media.type === 'video' ? (
                <div className="h-full w-full flex items-center justify-center bg-slate-900 text-white">
                  <Play className="h-6 w-6 text-primary fill-primary" />
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={media.caption || 'Review photo'}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 6-Criteria Breakdown Accordion / Chips */}
      <div className="pt-1">
        <button
          onClick={() => setShowAspects(!showAspects)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
        >
          <span>{translate('viewCriteriaRatings', 'Detailed Criteria Ratings')}</span>
          {showAspects ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showAspects && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[11px] space-y-0.5">
              <span className="text-muted-foreground block">{translate('criteria_quality', 'Quality')}</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">⭐ {aspects.quality}/5</span>
            </div>
            <div className="text-[11px] space-y-0.5">
              <span className="text-muted-foreground block">{translate('criteria_price', 'Price / Value')}</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">⭐ {aspects.price}/5</span>
            </div>
            <div className="text-[11px] space-y-0.5">
              <span className="text-muted-foreground block">{translate('criteria_communication', 'Communication')}</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">⭐ {aspects.communication}/5</span>
            </div>
            <div className="text-[11px] space-y-0.5">
              <span className="text-muted-foreground block">{translate('criteria_punctuality', 'Punctuality')}</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">⭐ {aspects.punctuality}/5</span>
            </div>
            <div className="text-[11px] space-y-0.5">
              <span className="text-muted-foreground block">{translate('criteria_professionalism', 'Professionalism')}</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">⭐ {aspects.professionalism}/5</span>
            </div>
          </div>
        )}
      </div>

      {/* Provider / Merchant Official Response */}
      {review.reply && (
        <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary border-t border-b border-r rtl:border-l border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-md gap-1">
                <Store className="h-3 w-3" />
                <span>{translate('sellerResponse', 'Provider Response')}</span>
              </Badge>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {review.reply.responderName}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatDistanceToNow(new Date(review.reply.createdAt), { addSuffix: true, locale: dateLocale })}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {review.reply.replyText}
          </p>
        </div>
      )}

      {/* Footer Actions: Helpful button, Reply button, Report button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleHelpful(review.id)}
            className={cn(
              "h-8 px-3 rounded-xl text-xs font-semibold gap-1.5",
              review.hasVotedHelpful
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", review.hasVotedHelpful && "fill-primary")} />
            <span>{translate('helpful', 'Helpful')}</span>
            {review.helpfulCount > 0 && (
              <span className="font-mono font-bold ml-0.5">({review.helpfulCount})</span>
            )}
          </Button>

          {canReply && !review.reply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenReplyModal(review)}
              className="h-8 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{translate('reply', 'Reply')}</span>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenReportModal(review.id)}
          className="h-8 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-destructive gap-1"
          title={translate('reportReview', 'Report Review')}
        >
          <Flag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{translate('report', 'Report')}</span>
        </Button>
      </div>

      {/* Lightbox Preview Dialog for Review Media */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none rounded-3xl overflow-hidden flex flex-col items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Review Media Lightbox</DialogTitle>
            <DialogDescription>Customer attached photo or video review</DialogDescription>
          </DialogHeader>
          {selectedMedia && (
            <div className="relative w-full max-h-[80vh] flex flex-col items-center justify-center">
              {selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] w-auto rounded-2xl"
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || 'Review media'}
                  className="max-h-[75vh] w-auto object-contain rounded-2xl"
                />
              )}
              {selectedMedia.caption && (
                <p className="text-white text-xs mt-3 text-center px-4 font-medium">
                  {selectedMedia.caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
