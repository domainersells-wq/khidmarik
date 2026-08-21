
// This component is effectively part of src/app/digital-services/[id]/page.tsx for now
// See ServicePackageCardDisplay function within src/app/digital-services/[id]/page.tsx
// If you need a separate file, the content would be similar to this:

/*
'use client';

import type { ServicePackage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface ServicePackageCardProps {
  pkg: ServicePackage;
  freelancerName: string;
}

export function ServicePackageCard({ pkg, freelancerName }: ServicePackageCardProps) {
  const { toast } = useToast();

  const handleRequestPackage = () => {
    toast({
        title: `Requested "${pkg.name}" from ${freelancerName} (Conceptual)`,
        description: `Price: ${pkg.price.toLocaleString()} DA. This would initiate a discussion. Payment via Escrow Wallet.`,
        duration: 6000
    });
  };

  return (
    <Card className="bg-card flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl">{pkg.name}</CardTitle>
        <p className="text-2xl font-bold text-primary pt-1">{pkg.price.toLocaleString()} DA</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
        <h4 className="font-semibold text-md mb-2">What's Included:</h4>
        <ul className="space-y-1.5 text-sm">
          {pkg.deliverables.map((d, i) => (
            <li key={i} className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 shrink-0" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={handleRequestPackage} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <DollarSign className="mr-2 h-4 w-4" /> Request This Package
        </Button>
      </CardFooter>
    </Card>
  );
}
*/
// No actual file content change here, as it's integrated. This is a placeholder.
