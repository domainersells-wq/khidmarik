export type ReviewTargetType = 'store' | 'professional' | 'product' | 'service' | 'hall';

export type ReviewStatus = 'pending' | 'approved' | 'flagged' | 'rejected' | 'hidden';

export type ReviewSortOption = 'recent' | 'highest' | 'lowest' | 'helpful';

export type ReviewReportReason = 
  | 'spam' 
  | 'inappropriate' 
  | 'fake_review' 
  | 'harassment' 
  | 'off_topic' 
  | 'other';

export interface ReviewAspectRatings {
  overall: number;          // 1 to 5
  quality: number;          // 1 to 5 (Quality of items / work)
  price: number;            // 1 to 5 (Value for money)
  communication: number;    // 1 to 5 (Clarity & responsiveness)
  punctuality: number;      // 1 to 5 (Speed, delivery & timeliness)
  professionalism: number;  // 1 to 5 (Courteousness & expertise)
}

export interface ReviewMedia {
  id?: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  caption?: string;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  responderId: string;
  responderName: string;
  responderRole: 'store_owner' | 'service_provider' | 'admin';
  replyText: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EnhancedReview {
  id: string;
  targetId: string;
  targetType: ReviewTargetType;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  orderId?: string;
  isVerifiedPurchase: boolean;
  rating: number;
  aspects: ReviewAspectRatings;
  title?: string;
  comment: string;
  mediaUrls: ReviewMedia[];
  helpfulCount: number;
  hasVotedHelpful?: boolean;
  status: ReviewStatus;
  reply?: ReviewReply;
  createdAt: string;
  updatedAt: string;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  total: number;
  average: number;
  aspectAverages: ReviewAspectRatings;
}

export interface ReviewFilterOptions {
  rating?: number;
  hasMedia?: boolean;
  verifiedOnly?: boolean;
  sortBy?: ReviewSortOption;
  searchQuery?: string;
}

export interface EligibleOrderItem {
  id: string;
  title: string;
  date: string;
  amount?: number;
  type: 'order' | 'booking' | 'dispatch';
  alreadyReviewed: boolean;
}

export interface ReviewEligibility {
  isEligible: boolean;
  eligibleOrders: EligibleOrderItem[];
}
