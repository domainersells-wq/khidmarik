
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { suggestSearchRefinements, type SuggestSearchRefinementsInput } from '@/ai/flows/suggest-search-refinements';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/LanguageContext';

interface AISearchRefinementsProps {
  initialReviewData?: SuggestSearchRefinementsInput['reviewData'];
  initialPricing?: SuggestSearchRefinementsInput['pricing'];
  initialPopularity?: SuggestSearchRefinementsInput['popularity'];
  currentSearchTerm?: string;
  hasListings: boolean;
}

function AISearchRefinementsContent({
  initialReviewData,
  initialPricing,
  initialPopularity,
  currentSearchTerm,
  hasListings
}: AISearchRefinementsProps) {
  const [refinements, setRefinements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { translate } = useLanguage();

  const handleFetchRefinements = async () => {
    setIsLoading(true);
    setRefinements([]);

    const input: SuggestSearchRefinementsInput = {
      searchTerm: currentSearchTerm || searchParams.get('q') || '',
      reviewData: initialReviewData,
      pricing: initialPricing,
      popularity: initialPopularity,
    };

    try {
      const result = await suggestSearchRefinements(input);
      setRefinements(result.suggestedRefinements);
      if (result.suggestedRefinements.length === 0) {
        toast({ 
          title: translate('aiDiscovery', 'AI Refinements'), 
          description: translate('noRefinementsFound', 'No specific refinements found for the current search.') 
        });
      }
    } catch (error) {
      console.error('Error fetching AI refinements:', error);
      toast({
        title: translate('error', 'Error'),
        description: translate('errRefinements', 'Could not fetch AI search refinements. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinementClick = (refinement: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentQuery = params.get('q') || '';
    params.set('q', `${currentQuery} ${refinement}`.trim());
    router.push(`/listings?${params.toString()}`);
  };

  if (!hasListings && !currentSearchTerm) {
    return null; 
  }

  return (
    <div className="my-6 p-4 bg-card border rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold font-headline flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          {translate('aiRefinementsTitle', 'Need Help Refining Your Search?')}
        </h3>
        <Button onClick={handleFetchRefinements} disabled={isLoading} size="sm" variant="outline">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {translate('getAiSuggestions', 'Get AI Suggestions')}
        </Button>
      </div>
      
      {isLoading && <p className="text-sm text-muted-foreground">{translate('generatingSuggestions', 'Generating suggestions...')}</p>}
      
      {!isLoading && refinements.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {refinements.map((refinement, index) => (
            <Badge
              key={index}
              onClick={() => handleRefinementClick(refinement)}
              variant="secondary"
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors py-1 px-3 text-sm"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleRefinementClick(refinement)}
            >
              {refinement}
            </Badge>
          ))}
        </div>
      )}
      {!isLoading && refinements.length === 0 && (hasListings || currentSearchTerm) && (
        <p className="text-sm text-muted-foreground">
          {translate('aiRefinementsClickDesc', "Click 'Get AI Suggestions' to see if we can help you narrow down your search results.")}
        </p>
      )}
    </div>
  );
}

export function AISearchRefinements(props: AISearchRefinementsProps) {
  return (
    <Suspense fallback={<div className="h-10 bg-slate-50 dark:bg-slate-900 rounded animate-pulse border" />}>
      <AISearchRefinementsContent {...props} />
    </Suspense>
  );
}
