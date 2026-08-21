
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { FreelancerProfile } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/listings/StarRating';
import { Palette, MapPin, Briefcase } from 'lucide-react'; // Using Briefcase for skills
import { getDigitalServiceCategoryBySlug } from '@/data/mock';

interface FreelancerCardProps {
  freelancer: FreelancerProfile;
}

export function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const categoryDetails = getDigitalServiceCategoryBySlug(freelancer.digitalCategorySlug);
  const CategoryIcon = categoryDetails?.icon || Palette;

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/digital-services/${freelancer.id}`} aria-label={`View details for ${freelancer.name}`}>
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <Image
              src={freelancer.images[0] || 'https://placehold.co/600x400.png'}
              alt={freelancer.name}
              width={600}
              height={400}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={freelancer.tagline || freelancer.name}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl font-headline">
            <Link href={`/digital-services/${freelancer.id}`} className="hover:text-primary transition-colors">
              {freelancer.name}
            </Link>
          </CardTitle>
          <Badge variant="outline" className="ml-2 flex items-center gap-1 shrink-0 text-xs">
            <CategoryIcon className="h-3 w-3" />
            {categoryDetails?.name || freelancer.digitalCategorySlug}
          </Badge>
        </div>
        {freelancer.tagline && (
          <p className="text-sm text-muted-foreground mb-2 font-medium">{freelancer.tagline}</p>
        )}
        <div className="flex items-center mb-2">
          <StarRating rating={freelancer.averageRating} size={16} />
          <span className="ml-2 text-sm text-muted-foreground">({freelancer.reviews.length} reviews)</span>
        </div>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {freelancer.description}
        </CardDescription>
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          <Briefcase className="h-4 w-4 mr-2 text-primary" />
          Top Skills: {freelancer.skills.slice(0, 3).join(', ')}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          {freelancer.location.city} (Primarily Remote)
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/digital-services/${freelancer.id}`}>View Profile & Services</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
