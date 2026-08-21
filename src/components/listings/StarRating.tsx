import { Star, StarHalf } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  valueClassName?: string;
  iconProps?: Omit<LucideProps, 'size' | 'className'>;
}

export function StarRating({
  rating,
  totalStars = 5,
  size = 16,
  className = '',
  showValue = false,
  valueClassName = 'text-sm font-semibold ml-1.5 text-foreground',
  iconProps = {},
}: StarRatingProps) {
  // Clamp rating between 0 and totalStars
  const normalizedRating = Math.min(Math.max(0, rating), totalStars);
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.25 && normalizedRating % 1 < 0.75;
  
  // If decimal is >= 0.75, round up to full star. If < 0.25, round down to empty.
  const displayFullStars = normalizedRating % 1 >= 0.75 ? fullStars + 1 : fullStars;
  const displayHalfStar = hasHalfStar;
  const displayEmptyStars = Math.max(0, totalStars - displayFullStars - (displayHalfStar ? 1 : 0));

  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Rating: ${rating} out of ${totalStars} stars`}>
      {/* Full Stars */}
      {[...Array(displayFullStars)].map((_, i) => (
        <Star 
          key={`full-${i}`} 
          size={size} 
          className="text-amber-500 fill-amber-500 transition-all duration-200 hover:scale-110" 
          {...iconProps} 
        />
      ))}
      
      {/* Half Star */}
      {displayHalfStar && (
        <StarHalf 
          key="half" 
          size={size} 
          className="text-amber-500 fill-amber-500 transition-all duration-200 hover:scale-110" 
          {...iconProps} 
        />
      )}
      
      {/* Empty Stars */}
      {[...Array(displayEmptyStars)].map((_, i) => (
        <Star 
          key={`empty-${i}`} 
          size={size} 
          className="text-muted-foreground/30 dark:text-zinc-700" 
          {...iconProps} 
        />
      ))}
      
      {/* Optional numeric value */}
      {showValue && (
        <span className={valueClassName}>
          {normalizedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

