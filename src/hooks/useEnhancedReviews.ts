'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  EnhancedReview,
  RatingDistribution,
  ReviewFilterOptions,
  ReviewEligibility,
  ReviewTargetType,
  ReviewAspectRatings,
  ReviewMedia,
  ReviewReportReason,
} from '@/types/reviews';
import { reviewService } from '@/services/reviewService';
import { useToast } from '@/hooks/use-toast';

export function useEnhancedReviews(
  targetId: string,
  targetType: ReviewTargetType = 'store',
  initialFilters: ReviewFilterOptions = {}
) {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id || 'guest';

  const [reviews, setReviews] = useState<EnhancedReview[]>([]);
  const [distribution, setDistribution] = useState<RatingDistribution>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    total: 0,
    average: 5.0,
    aspectAverages: {
      overall: 5.0,
      quality: 5.0,
      price: 5.0,
      communication: 5.0,
      punctuality: 5.0,
      professionalism: 5.0,
    },
  });
  const [eligibility, setEligibility] = useState<ReviewEligibility>({
    isEligible: false,
    eligibleOrders: [],
  });
  const [filters, setFilters] = useState<ReviewFilterOptions>(initialFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch reviews & distribution
  const fetchReviewsData = useCallback(async () => {
    if (!targetId) return;
    setIsLoading(true);
    try {
      const [list, dist, elig] = await Promise.all([
        reviewService.getReviews(targetId, targetType, filters, userId),
        reviewService.getRatingDistribution(targetId, targetType),
        reviewService.checkReviewEligibility(userId, targetId, targetType),
      ]);

      setReviews(list);
      setDistribution(dist);
      setEligibility(elig);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType, filters, userId]);

  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  // Toggle helpful vote
  const toggleHelpful = async (reviewId: string) => {
    if (!user?.id) {
      toast({ title: 'Please log in to vote', variant: 'destructive' });
      return;
    }

    // Optimistic update
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const currentlyVoted = !!r.hasVotedHelpful;
          return {
            ...r,
            hasVotedHelpful: !currentlyVoted,
            helpfulCount: currentlyVoted ? Math.max(0, r.helpfulCount - 1) : r.helpfulCount + 1,
          };
        }
        return r;
      })
    );

    const res = await reviewService.toggleHelpfulVote(reviewId, user.id);
    if (res.error) {
      // Rollback
      fetchReviewsData();
    }
  };

  // Submit review
  const submitReview = async (data: {
    orderId?: string;
    rating: number;
    aspects: ReviewAspectRatings;
    title?: string;
    comment: string;
    mediaUrls?: ReviewMedia[];
  }) => {
    if (!user?.id) {
      toast({ title: 'Please log in to submit a review', variant: 'destructive' });
      return { success: false, error: 'Login required' };
    }

    setIsSubmitting(true);
    try {
      const res = await reviewService.submitReview({
        targetId,
        targetType,
        authorId: user.id,
        authorName: user.name || 'Customer',
        authorAvatar: user.avatarUrl,
        ...data,
      });

      if (res.error) {
        toast({ title: 'Review Submission Failed', description: res.error, variant: 'destructive' });
        return { success: false, error: res.error };
      }

      toast({
        title: 'Review Published Successfully',
        description: 'Thank you for helping our community with verified feedback!',
      });

      await fetchReviewsData();
      return { success: true };
    } catch (err: any) {
      toast({ title: 'An error occurred', description: err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit reply
  const submitReply = async (reviewId: string, replyText: string) => {
    if (!user?.id) return { success: false, error: 'Login required' };

    const role = user.isStoreOwner ? 'store_owner' : user.role === 'service_provider' ? 'service_provider' : 'admin';
    const res = await reviewService.submitReply(reviewId, user.id, user.name || 'Owner', replyText, role);

    if (res.reply) {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, reply: res.reply } : r))
      );
      toast({ title: 'Reply posted successfully' });
      return { success: true };
    } else {
      toast({ title: 'Failed to post reply', description: res.error, variant: 'destructive' });
      return { success: false, error: res.error };
    }
  };

  // Report review
  const reportReview = async (reviewId: string, reason: ReviewReportReason, details?: string) => {
    if (!user?.id) {
      toast({ title: 'Please log in to report', variant: 'destructive' });
      return { success: false };
    }

    const res = await reviewService.reportReview(reviewId, user.id, reason, details);
    if (res.success) {
      toast({
        title: 'Review Reported',
        description: 'Thank you. Our moderation team will investigate this review.',
      });
      return { success: true };
    } else {
      toast({ title: 'Report failed', description: res.error, variant: 'destructive' });
      return { success: false };
    }
  };

  return {
    reviews,
    distribution,
    eligibility,
    filters,
    setFilters,
    isLoading,
    isSubmitting,
    toggleHelpful,
    submitReview,
    submitReply,
    reportReview,
    reloadReviews: fetchReviewsData,
  };
}
