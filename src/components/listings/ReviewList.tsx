'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Star,
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  PenSquare,
  RefreshCw,
} from 'lucide-react';
import { EnhancedReview, ReviewTargetType, ReviewSortOption } from '@/types/reviews';
import { useEnhancedReviews } from '@/hooks/useEnhancedReviews';
import { StructuredReviewSummary } from '@/components/reviews/StructuredReviewSummary';
import { StructuredReviewCard } from '@/components/reviews/StructuredReviewCard';
import { WriteReviewModal } from '@/components/reviews/WriteReviewModal';
import { ReviewReplyModal } from '@/components/reviews/ReviewReplyModal';
import { ReportReviewModal } from '@/components/reviews/ReportReviewModal';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface ReviewListProps {
  listingId?: string;
  targetId?: string;
  targetType?: ReviewTargetType;
  targetTitle?: string;
  canReply?: boolean;
}

export function ReviewList({
  listingId,
  targetId: propTargetId,
  targetType = 'store',
  targetTitle,
  canReply = false,
}: ReviewListProps) {
  const targetId = propTargetId || listingId || '';
  const { translate } = useLanguage();
  const { user } = useAuth();

  const {
    reviews,
    distribution,
    eligibility,
    filters,
    setFilters,
    isLoading,
    toggleHelpful,
    submitReply,
    reportReview,
    reloadReviews,
  } = useEnhancedReviews(targetId, targetType);

  // Modals state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [replyingReview, setReplyingReview] = useState<EnhancedReview | null>(null);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Handle star filter toggle from summary or filter bar
  const handleSelectStarFilter = (star?: number) => {
    setFilters((prev) => ({ ...prev, rating: star }));
  };

  // Filtered reviews by local search keyword
  const displayReviews = reviews.filter((r) => {
    if (!searchKeyword.trim()) return true;
    const q = searchKeyword.toLowerCase();
    return (
      r.authorName.toLowerCase().includes(q) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      r.comment.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Structured Review Summary Banner */}
      <StructuredReviewSummary
        distribution={distribution}
        selectedStarFilter={filters.rating}
        onSelectStarFilter={handleSelectStarFilter}
        onOpenWriteModal={() => setIsWriteModalOpen(true)}
      />

      {/* 2. Interactive Filter & Sorting Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={!filters.rating && !filters.hasMedia && !filters.verifiedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({})}
            className="rounded-xl text-xs h-8 px-3 font-semibold"
          >
            {translate('all', 'All')} ({distribution.total})
          </Button>

          <Button
            variant={filters.verifiedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters((prev) => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
            className="rounded-xl text-xs h-8 px-3 font-semibold gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{translate('verifiedOnly', 'Verified Only')}</span>
          </Button>

          <Button
            variant={filters.hasMedia ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters((prev) => ({ ...prev, hasMedia: !prev.hasMedia }))}
            className="rounded-xl text-xs h-8 px-3 font-semibold gap-1.5"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>{translate('withPhotosVideos', 'With Photos & Videos')}</span>
          </Button>
        </div>

        {/* Right: Search & Sort */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Keyword search input */}
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={translate('searchReviews', 'Search reviews...')}
              className="h-8 text-xs pl-8 rtl:pl-3 rtl:pr-8 rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Sort Selector */}
          <Select
            value={filters.sortBy || 'recent'}
            onValueChange={(val) => setFilters((prev) => ({ ...prev, sortBy: val as ReviewSortOption }))}
          >
            <SelectTrigger className="h-8 rounded-xl border-slate-200 dark:border-slate-800 text-xs w-36 font-semibold">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl font-sans">
              <SelectItem value="recent" className="text-xs">{translate('mostRecent', 'Most Recent')}</SelectItem>
              <SelectItem value="highest" className="text-xs">{translate('highestRating', 'Highest Rating')}</SelectItem>
              <SelectItem value="lowest" className="text-xs">{translate('lowestRating', 'Lowest Rating')}</SelectItem>
              <SelectItem value="helpful" className="text-xs">{translate('mostHelpful', 'Most Helpful')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Review Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>{translate('loadingReviews', 'Loading verified reviews...')}</span>
        </div>
      ) : displayReviews.length === 0 ? (
        <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {translate('noReviewsFound', 'No reviews matching your filters')}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {translate('beTheFirstReview', 'Have you completed an order or service here? Share your verified feedback with the community.')}
          </p>
          <Button
            onClick={() => setIsWriteModalOpen(true)}
            size="sm"
            className="rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/95 text-primary-foreground h-9 px-4"
          >
            <PenSquare className="h-3.5 w-3.5" />
            <span>{translate('writeAReview', 'Write a Verified Review')}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayReviews.map((review) => (
            <StructuredReviewCard
              key={review.id}
              review={review}
              onToggleHelpful={toggleHelpful}
              onOpenReplyModal={(r) => setReplyingReview(r)}
              onOpenReportModal={(id) => setReportingReviewId(id)}
              canReply={canReply || !!user?.isStoreOwner || user?.role === 'SUPER_ADMIN'}
            />
          ))}
        </div>
      )}

      {/* 4. Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        targetId={targetId}
        targetType={targetType}
        targetTitle={targetTitle}
        eligibility={eligibility}
        onSubmitSuccess={reloadReviews}
      />

      {/* 5. Provider Reply Modal */}
      <ReviewReplyModal
        isOpen={!!replyingReview}
        onClose={() => setReplyingReview(null)}
        review={replyingReview}
        onSubmitReply={submitReply}
      />

      {/* 6. Report Review Modal */}
      <ReportReviewModal
        isOpen={!!reportingReviewId}
        onClose={() => setReportingReviewId(null)}
        reviewId={reportingReviewId}
        onSubmitReport={reportReview}
      />
    </div>
  );
}
