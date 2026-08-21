import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';

export const reviewService = {
  /**
   * Submit a review for a listing (store, professional, freelancer)
   */
  async submitReview(review: {
    listingId: string;
    authorId: string;
    authorName: string;
    rating: number;
    comment: string;
    detailedRatings?: {
      timeliness?: number;
      qualityOfWork?: number;
      cleanliness?: number;
    };
  }): Promise<any> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        listing_id: review.listingId,
        author_id: review.authorId,
        author_name: review.authorName,
        rating: review.rating,
        comment: review.comment,
        detailed_ratings: review.detailedRatings || {}
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // After adding review, recalculate Average Rating on store/professional listing
    // We check if it is a store first
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('id', review.listingId)
      .maybeSingle();

    if (store) {
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('listing_id', review.listingId);

      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
        await supabase
          .from('stores')
          .update({ average_rating: parseFloat(avg.toFixed(1)) })
          .eq('id', review.listingId);
      }
    }

    return data;
  },

  /**
   * Get reviews of a listing
   */
  async getReviewsForListing(listingId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      author: r.author_name,
      rating: r.rating,
      comment: r.comment,
      date: r.created_at,
      detailedRatings: r.detailed_ratings
    }));
  }
};
