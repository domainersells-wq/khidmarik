
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { DetailedRatings, Review } from '@/types'; // Added Review type

interface ReviewFormProps {
  listingId: string;
  onReviewSubmitSuccess?: (newReview: Review) => void; // Updated callback
}

const StarRatingInput = ({
  label,
  rating,
  onRatingChange,
  maxRating = 5
}: {
  label: string;
  rating: number;
  onRatingChange: (value: number) => void;
  maxRating?: number;
}) => {
  return (
    <div>
      <Label className="block text-sm font-medium mb-2">{label}</Label>
      <RadioGroup
        onValueChange={(value) => onRatingChange(parseInt(value))}
        value={rating.toString()}
        className="flex space-x-1"
        aria-label={`Rate ${label.toLowerCase()}`}
      >
        {[...Array(maxRating)].map((_, i) => {
          const starValue = i + 1;
          return (
            <div key={starValue} className="flex items-center">
              <RadioGroupItem value={starValue.toString()} id={`${label.toLowerCase()}-${starValue}`} className="peer sr-only" />
              <Label
                htmlFor={`${label.toLowerCase()}-${starValue}`}
                className="cursor-pointer transition-colors peer-aria-checked:text-accent text-muted-foreground hover:text-accent"
              >
                <Star
                  className={`h-6 w-6 ${rating >= starValue ? 'fill-accent' : 'fill-muted/70'}`}
                />
                <span className="sr-only">{starValue} star{starValue > 1 ? 's' : ''}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};


export function ReviewForm({ listingId, onReviewSubmitSuccess }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [timeliness, setTimeliness] = useState<number>(0);
  const [qualityOfWork, setQualityOfWork] = useState<number>(0);
  const [cleanliness, setCleanliness] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (overallRating === 0 || !comment.trim() || !author.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name, an overall rating, and a comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call

    const detailedRatings: DetailedRatings = {};
    if (timeliness > 0) detailedRatings.timeliness = timeliness;
    if (qualityOfWork > 0) detailedRatings.qualityOfWork = qualityOfWork;
    if (cleanliness > 0) detailedRatings.cleanliness = cleanliness;

    const newReview: Review = {
      id: `rev-${Date.now()}`, // Simple unique ID for client-side
      author,
      rating: overallRating,
      comment,
      date: new Date().toISOString(),
      detailedRatings: Object.keys(detailedRatings).length > 0 ? detailedRatings : undefined,
    };

    console.log('Review submitted for listing:', listingId, newReview);
    
    if (onReviewSubmitSuccess) {
      onReviewSubmitSuccess(newReview); // Callback to parent with the new review data
    } else {
      // Fallback toast if no callback is provided
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. It helps improve visibility and trust on Khidmatik.",
      });
    }

    // Reset form
    setOverallRating(0);
    setTimeliness(0);
    setQualityOfWork(0);
    setCleanliness(0);
    setComment('');
    setAuthor('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card border rounded-lg shadow-md">
      <h3 className="text-xl font-semibold font-headline">Leave a Review</h3>
      
      <div>
        <Label htmlFor="author" className="block text-sm font-medium mb-1">Your Name *</Label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <StarRatingInput label="Overall Rating *" rating={overallRating} onRatingChange={setOverallRating} />

      <div className="space-y-4 pt-2 border-t mt-4">
        <h4 className="text-md font-medium text-muted-foreground">Detailed Ratings (Optional)</h4>
        <StarRatingInput label="Timeliness" rating={timeliness} onRatingChange={setTimeliness} />
        <StarRatingInput label="Quality of Work" rating={qualityOfWork} onRatingChange={setQualityOfWork} />
        <StarRatingInput label="Cleanliness" rating={cleanliness} onRatingChange={setCleanliness} />
      </div>


      <div>
        <Label htmlFor="comment" className="block text-sm font-medium mb-1">Your Comment *</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          required
          className="focus:ring-primary focus:border-primary"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
