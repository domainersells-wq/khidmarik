
'use client';

import Image from 'next/image';
import type { ListedPart, PartCondition } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Wrench, MapPin, CalendarDays, PackageSearch } from 'lucide-react';
import { partCategories, algerianWilayas } from '@/data/mock'; // Import algerianWilayas if needed for display
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ListedPartCardProps {
  part: ListedPart;
}

const conditionLabels: Record<PartCondition, string> = {
  'used-working': 'Used - Working Well',
  'used-good': 'Used - Good',
  'used-fair-needs-inspection': 'Used - Fair (Needs Inspection)',
  'for-parts-experts-only': 'For Parts/Experts Only',
};

const conditionColors: Record<PartCondition, string> = {
  'used-working': 'bg-green-100 text-green-800 border-green-300',
  'used-good': 'bg-blue-100 text-blue-800 border-blue-300',
  'used-fair-needs-inspection': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'for-parts-experts-only': 'bg-red-100 text-red-800 border-red-300',
};


export function ListedPartCard({ part }: ListedPartCardProps) {
  const { toast } = useToast();
  const categoryDetails = partCategories.find(cat => cat.slug === part.categorySlug);
  const CategoryIcon = categoryDetails?.icon || PackageSearch;

  const wilayaDetails = part.location?.wilayaCode 
    ? algerianWilayas.find(w => w.code === part.location?.wilayaCode) 
    : null;
  const displayLocation = wilayaDetails ? `${part.location?.city}, ${wilayaDetails.name_fr}` : part.location?.city;


  const handleViewDetails = () => {
    toast({
      title: "Action Required (Conceptual)",
      description: `Details for "${part.partName}" would open here. Implement navigation or modal.`,
      duration: 5000
    });
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border border-border">
      <CardHeader className="p-0 relative">
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <Image
              src={part.imageUrls?.[0] || `https://placehold.co/400x300.png?text=${encodeURIComponent(part.partName)}`}
              alt={part.partName}
              width={400}
              height={300}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {displayLocation && (
            <Badge variant="outline" className="absolute top-2 left-2 bg-background/80 text-xs py-1 px-2 shadow-md z-10 flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> {displayLocation}
            </Badge>
          )}
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <CardTitle className="text-lg font-headline line-clamp-2">{part.partName}</CardTitle>
        
        <div className="text-2xl font-bold text-primary">
          {part.price.toLocaleString()} DA
        </div>

        <Badge variant="secondary" className={`text-xs font-medium ${conditionColors[part.condition]}`}>
          {conditionLabels[part.condition]}
        </Badge>
        
        {part.originalDeviceName && (
            <p className="text-xs text-muted-foreground line-clamp-1">
                <Wrench className="inline h-3 w-3 mr-1" /> From: {part.originalDeviceName}
            </p>
        )}
        
        <div className="flex items-center text-xs text-muted-foreground">
            <CategoryIcon className="h-4 w-4 mr-1.5 text-primary/80" />
            <span>{categoryDetails?.name || part.categorySlug}</span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3">
            {part.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 border-t flex-col items-start space-y-2">
         <Button onClick={handleViewDetails} variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          View Details & Contact Seller
        </Button>
        <div className="text-xs text-muted-foreground flex items-center self-end pt-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1"/>
            Listed: {formatDistanceToNow(new Date(part.createdAt), { addSuffix: true })}
        </div>
      </CardFooter>
    </Card>
  );
}
