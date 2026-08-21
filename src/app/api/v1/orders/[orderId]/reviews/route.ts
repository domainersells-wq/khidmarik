import { NextRequest, NextResponse } from 'next/server';

interface ReviewStoreItem {
  orderId: string;
  customerRating?: number;
  customerComment?: string;
  customerChips?: any;
  craftsmanRating?: number;
  craftsmanComment?: string;
  craftsmanChips?: any;
  isRevealed: boolean;
  autoRevealDeadline: string;
  revealedAt?: string;
}

const mockReviewStore: Record<string, ReviewStoreItem> = {
  'SOS-2026-8941': {
    orderId: 'SOS-2026-8941',
    isRevealed: false,
    autoRevealDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const review = mockReviewStore[orderId];

  if (!review) {
    return NextResponse.json({ success: true, isSubmitted: false, isRevealed: false });
  }

  // If not revealed, return masked/blind representation
  if (!review.isRevealed) {
    return NextResponse.json({
      success: true,
      orderId,
      isRevealed: false,
      hasCustomerSubmitted: !!review.customerRating,
      hasCraftsmanSubmitted: !!review.craftsmanRating,
      autoRevealDeadline: review.autoRevealDeadline,
      message: 'Double-blind review active. Reviews will reveal once both parties submit or 48h deadline passes.'
    });
  }

  return NextResponse.json({
    success: true,
    orderId,
    isRevealed: true,
    reviews: review
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { role, rating, comment, chips } = body; // role: 'customer' | 'craftsman'

    if (!role || !rating || !['customer', 'craftsman'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_FIELDS', message: 'Role (customer or craftsman) and Rating (1-5) are required.' },
        { status: 400 }
      );
    }

    if (!mockReviewStore[orderId]) {
      mockReviewStore[orderId] = {
        orderId,
        isRevealed: false,
        autoRevealDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
      };
    }

    const review = mockReviewStore[orderId];

    if (role === 'customer') {
      review.customerRating = Number(rating);
      review.customerComment = comment;
      review.customerChips = chips;
    } else {
      review.craftsmanRating = Number(rating);
      review.craftsmanComment = comment;
      review.craftsmanChips = chips;
    }

    // Check double-blind reveal
    const bothSubmitted = !!review.customerRating && !!review.craftsmanRating;
    if (bothSubmitted) {
      review.isRevealed = true;
      review.revealedAt = new Date().toISOString();
    }

    mockReviewStore[orderId] = review;

    return NextResponse.json({
      success: true,
      orderId,
      isRevealed: review.isRevealed,
      message: review.isRevealed
        ? 'Both parties have submitted evaluations. Ratings are now publicly unblinded & revealed!'
        : 'Your review is securely stored in double-blind state. Will reveal once counterparty submits.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
