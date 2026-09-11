
import Image from 'next/image';
import Link from 'next/link';
import type { Listing, Professional, Store } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { MapPin, Phone, Tag, Home, Sparkles, CheckCircle2, ShieldCheck, Award, Crown, Gem, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/data/mock';
import { MadeInAlgeriaBadge } from './MadeInAlgeriaBadge';
import { mapPlanToTier, TIER_THEMES } from '@/lib/subscriptionTheme';
import { useLanguage } from '@/context/LanguageContext';

interface ListingCardProps {
  listing: Listing;
  currentUserLocationQuery?: string;
}

export function ListingCard({ listing, currentUserLocationQuery }: ListingCardProps) {
  const { language } = useLanguage();
  const categoryDetails = categories.find(c => c.name === listing.category);
  const CategoryIcon = categoryDetails?.icon;

  const isNeighborhoodPro = listing.type === 'professional' &&
                           currentUserLocationQuery &&
                           (listing as Professional).location?.zipCode?.toLowerCase() === currentUserLocationQuery.toLowerCase();

  const isStore = listing.type === 'store';
  const storeData = isStore ? (listing as Store) : null;

  // Retrieve subscription plan and theme
  const planName = (listing as any).subscriptionPlan || storeData?.subscriptionPlan || 'free';
  const tier = mapPlanToTier(planName);
  const theme = TIER_THEMES[tier];

  // Determine active subscription icon
  const TierIcon = {
    free: Shield,
    bronze: Award, // mapping Award to bronze
    silver: ShieldCheck, // mapping ShieldCheck to silver
    gold: Crown,
    platinum: Gem,
    diamond: Sparkles
  }[tier] || Shield;

  // Verification status
  const isVerified = (listing as any).isVerified || 
                     (listing as any).verifiedBadges?.length > 0 ||
                     false;

  // Safe image resolution
  const mainImage = (Array.isArray(listing.images) && listing.images.length > 0 && typeof listing.images[0] === 'string' && listing.images[0].trim())
    ? listing.images[0]
    : 'https://placehold.co/600x400.png';

  const logoImage = (storeData?.storeLogoUrl && typeof storeData.storeLogoUrl === 'string' && storeData.storeLogoUrl.trim())
    ? storeData.storeLogoUrl
    : null;

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/listings/${listing.id}`} aria-label={`View details for ${listing.name}`}>
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <Image
              src={mainImage}
              alt={listing.name || 'Listing image'}
              width={600}
              height={400}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={listing.dataAiHint || `${listing.type} ${listing.category}`}
            />
          </div>
        </Link>
        {isNeighborhoodPro && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-emerald-500 text-white border-emerald-600 flex items-center gap-1 py-1 px-2 shadow-md z-10">
            <Home className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Neighborhood Pro</span>
          </Badge>
        )}
        {logoImage && (
           <div className="absolute bottom-2 left-2 bg-card p-1 rounded-full shadow-md z-10">
            <Image
                src={logoImage}
                alt={`${listing.name} logo`}
                width={40}
                height={40}
                className="rounded-full object-contain border"
                data-ai-hint="store logo small"
              />
           </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-1 gap-2">
          <CardTitle className="text-xl font-headline flex items-center gap-1.5 flex-wrap">
            <Link 
              href={`/listings/${listing.id}`} 
              className="hover:opacity-85 transition-opacity"
              style={{ color: tier !== 'free' ? theme.accentColor : 'inherit' }}
            >
              {listing.name}
            </Link>
            
            {/* Subscription Icon */}
            {tier !== 'free' && (
              <span className="inline-flex items-center" title={`${theme.nameAr}`}>
                <TierIcon className="h-4.5 w-4.5 shrink-0" style={{ color: theme.accentColor }} />
              </span>
            )}

            {/* Verified Badge */}
            {isVerified && (
              <span className="inline-flex items-center" title="Verified / موثّق">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10 shrink-0" />
              </span>
            )}
          </CardTitle>
          {CategoryIcon && (
             <Badge variant="outline" className="flex items-center gap-1 shrink-0 text-xs">
                <CategoryIcon className="h-3 w-3" />
                {listing.category}
             </Badge>
          )}
        </div>
        {storeData?.isMadeInAlgeria && <MadeInAlgeriaBadge />}
        <div className="flex items-center my-2">
          <StarRating rating={listing.averageRating} size={16} showValue />
          <span className="ml-2 text-sm text-muted-foreground">({listing.reviews.length} reviews)</span>
        </div>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {listing.description}
        </CardDescription>
        <div className="text-sm text-muted-foreground space-y-1">
          {listing.location.city && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span>{listing.location.city}{listing.location.zipCode && `, ${listing.location.zipCode}`}</span>
            </div>
          )}
          {listing.contact.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-primary" />
              <span>{listing.contact.phone}</span>
            </div>
          )}
          {listing.pricing && (
             <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-primary" />
              <span>Pricing: {listing.pricing}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
          <Link href={`/listings/${listing.id}`}>
            {language === 'ar' ? 'زيارة' : language === 'fr' ? 'Visiter' : 'Visit'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
