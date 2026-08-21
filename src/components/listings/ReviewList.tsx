
'use client';

import type { Review } from '@/types';
import { StarRating } from './StarRating';
import { format } from 'date-fns';

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (!reviews || reviews.length === 0) {
    return <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{review.author}</h4>
            <StarRating rating={review.rating} size={16} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{format(new Date(review.date), 'PPP')}</p>
          <p className="mt-2">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
