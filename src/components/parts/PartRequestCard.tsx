
'use client';

import type { PartRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, PackageSearch, SearchCheck, AlertTriangle, Hourglass } from 'lucide-react';
import { partCategories } from '@/data/mock';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface PartRequestCardProps {
  request: PartRequest;
}

export function PartRequestCard({ request }: PartRequestCardProps) {
  const { toast } = useToast();
  const categoryDetails = partCategories.find(cat => cat.slug === request.categorySlug);
  const CategoryIcon = categoryDetails?.icon || PackageSearch;

  const handleViewDetails = () => {
    toast({
      title: "Action Required (Conceptual)",
      description: `Details/matches for "${request.partName}" would open here.`,
      duration: 5000
    });
  };
  
  const urgencyMap = {
    low: { label: 'Low Urgency', color: 'bg-green-100 text-green-700 border-green-300', icon: Hourglass },
    medium: { label: 'Medium Urgency', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Hourglass },
    high: { label: 'High Urgency', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  };
  const currentUrgency = request.urgency ? urgencyMap[request.urgency] : null;
  const UrgencyIcon = currentUrgency?.icon;


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-border">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold line-clamp-2">{request.partName}</CardTitle>
            {currentUrgency && UrgencyIcon && (
                 <Badge variant="outline" className={`text-xs ${currentUrgency.color} flex items-center gap-1.5`}>
                    <UrgencyIcon className="h-3.5 w-3.5" />
                    {currentUrgency.label}
                </Badge>
            )}
        </div>
        {request.deviceModel && (
            <CardDescription className="text-sm text-muted-foreground">
                For Device: {request.deviceModel}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <CategoryIcon className="h-4 w-4 mr-2 text-primary" />
          <span>Category: {categoryDetails?.name || request.categorySlug}</span>
        </div>
        <p className="text-sm text-foreground line-clamp-3">
          {request.partDescription}
        </p>
        <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between items-center">
            <div className="flex items-center">
                <CalendarDays className="h-3.5 w-3.5 mr-1"/>
                Requested: {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </div>
            <Badge variant={request.status === 'active' ? 'default' : 'secondary'} className={request.status === 'active' ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <Button onClick={handleViewDetails} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <SearchCheck className="mr-2 h-4 w-4" /> View Details / Matches (AI Powered)
        </Button>
      </CardFooter>
    </Card>
  );
}
