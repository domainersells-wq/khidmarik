
'use client';

import Image from 'next/image';
import type { GroupOrderItem, PriceTier } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingCart, Share2, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface GroupOrderItemCardProps {
  item: GroupOrderItem;
}

export function GroupOrderItemCard({ item }: GroupOrderItemCardProps) {
  const { toast } = useToast();

  const getCurrentPriceAndNextTier = () => {
    let currentPrice = item.basePrice;
    let nextTierInfo: any = null;
    let progressToNextTier = 0;
    let buyersNeededForNextTier = Infinity;

    // Sort tiers by minBuyers to ensure correct price application
    const sortedTiers = [...item.priceTiers].sort((a, b) => a.minBuyers - b.minBuyers);

    for (const tier of sortedTiers) {
      if (item.currentBuyers >= tier.minBuyers) {
        currentPrice = tier.price;
      } else {
        // This is the next tier the group is aiming for
        if (!nextTierInfo) {
          nextTierInfo = tier;
          buyersNeededForNextTier = tier.minBuyers - item.currentBuyers;
          progressToNextTier = (item.currentBuyers / tier.minBuyers) * 100;
        }
      }
    }
    
    // If all tiers are met, find the best price
    if (!nextTierInfo && sortedTiers.length > 0 && item.currentBuyers >= sortedTiers[sortedTiers.length -1].minBuyers) {
        currentPrice = sortedTiers[sortedTiers.length -1].price;
        progressToNextTier = 100; // Max progress
        buyersNeededForNextTier = 0;
    }


    return { currentPrice, nextTierInfo, progressToNextTier, buyersNeededForNextTier };
  };

  const { currentPrice, nextTierInfo, progressToNextTier, buyersNeededForNextTier } = getCurrentPriceAndNextTier();

  const handleJoinGroupOrder = () => {
    toast({
      title: "Joined Group Order (Conceptual)",
      description: `You've joined the group order for ${item.name}. Current price: ${currentPrice.toFixed(2)} DA.`,
    });
    // In a real app, you'd update currentBuyers and potentially re-evaluate price.
  };

  const handleShareDeal = () => {
    if (navigator.share) {
      navigator.share({
        title: `Group Order Deal: ${item.name}`,
        text: `Join the group order for ${item.name} and get it for as low as ${item.priceTiers[item.priceTiers.length - 1].price.toFixed(2)} DA! Current price: ${currentPrice.toFixed(2)} DA.`,
        url: item.shareUrl || window.location.href, // Use specific share URL if available
      }).then(() => {
        toast({ title: "Deal Shared!", description: "Thanks for sharing!" });
      }).catch(console.error);
    } else {
       toast({
        title: "Share Deal (Conceptual)",
        description: `Deal for ${item.name} shared! (Sharing via native share not available). URL: ${item.shareUrl || window.location.href}`,
      });
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg w-full">
      <CardHeader className="p-0 relative">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={item.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(item.name)}`}
            alt={item.name}
            width={600}
            height={400}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            data-ai-hint={item.dataAiHint || item.name.toLowerCase().split(' ').slice(0,2).join(' ')}
          />
        </div>
        <Badge variant="destructive" className="absolute top-2 left-2 text-xs py-1 px-2 shadow-md z-10">
          GROUP BUY
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-3">
        <CardTitle className="text-xl font-headline mb-1">{item.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {item.description}
        </CardDescription>

        <div>
          <h4 className="text-sm font-semibold mb-1">Price Tiers:</h4>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
            {item.priceTiers.sort((a,b) => a.minBuyers - b.minBuyers).map((tier, idx) => (
              <li key={idx} className={item.currentBuyers >= tier.minBuyers ? 'font-medium text-primary' : ''}>
                {tier.minBuyers}+ buyers: {tier.price.toFixed(2)} DA
              </li>
            ))}
             <li>Base price: {item.basePrice.toFixed(2)} DA (if no tier met)</li>
          </ul>
        </div>
        
        <div className="p-3 bg-muted/50 rounded-md space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">Current Price:</span>
                <span className="font-bold text-2xl text-primary">{currentPrice.toFixed(2)} DA</span>
            </div>
             <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{item.currentBuyers} Current Buyers</span>
            </div>
            {nextTierInfo && buyersNeededForNextTier > 0 && (
            <>
              <Progress value={progressToNextTier} className="w-full h-2" />
              <p className="text-xs text-primary text-center">
                Only {buyersNeededForNextTier} more buyer(s) needed for {nextTierInfo.price.toFixed(2)} DA!
              </p>
            </>
            )}
            {buyersNeededForNextTier === 0 && (
                 <p className="text-xs text-green-600 font-semibold text-center">
                    Best price tier reached!
                </p>
            )}
        </div>


      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col sm:flex-row gap-2">
        <Button
          onClick={handleJoinGroupOrder}
          className="w-full sm:flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label={`Join group order for ${item.name}`}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Join Group Order
        </Button>
        <Button
          onClick={handleShareDeal}
          variant="outline"
          className="w-full sm:flex-1"
          aria-label={`Share deal for ${item.name}`}
        >
          <Share2 className="mr-2 h-4 w-4" /> Share Deal
        </Button>
      </CardFooter>
    </Card>
  );
}
