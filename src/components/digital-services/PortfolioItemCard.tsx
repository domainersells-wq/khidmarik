
// This component is effectively part of src/app/digital-services/[id]/page.tsx for now
// If it were more complex or reused elsewhere, it would be a separate file.
// For simplicity in this large change, I've integrated its logic directly into the detail page.
// See PortfolioItemCardDisplay function within src/app/digital-services/[id]/page.tsx
// If you need a separate file, the content would be similar to this:

/*
'use client';

import Image from 'next/image';
import type { PortfolioItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface PortfolioItemCardProps {
  item: PortfolioItem;
}

export function PortfolioItemCard({ item }: PortfolioItemCardProps) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {item.imageUrl && (
        <div className="aspect-video bg-muted w-full">
          <Image
            src={item.imageUrl}
            alt={item.title}
            width={400}
            height={225}
            className="object-cover w-full h-full"
            data-ai-hint={item.dataAiHint || item.title.toLowerCase().split(" ").slice(0,2).join(" ")}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{item.description}</p>
        {item.projectUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={item.projectUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Project
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
*/
// No actual file content change here, as it's integrated. This is a placeholder.
