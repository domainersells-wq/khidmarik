// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview AI-powered search refinement suggestions based on review data, pricing, popularity, and distance.
 *
 * - suggestSearchRefinements - A function that suggests search refinements.
 * - SuggestSearchRefinementsInput - The input type for the suggestSearchRefinements function.
 * - SuggestSearchRefinementsOutput - The output type for the suggestSearchRefinements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSearchRefinementsInputSchema = z.object({
  searchTerm: z.string().describe('The current search term.'),
  reviewData: z.array(z.object({
    rating: z.number().describe('The rating given in the review (e.g., 1-5).'),
    comment: z.string().describe('The text content of the review.'),
  })).optional().describe('Optional array of review data for the current search term.'),
  pricing: z.string().optional().describe('The pricing for the listing (e.g., $, $$, $$$).'),
  popularity: z.number().optional().describe('A numerical value representing the popularity of the listing (e.g., number of views, clicks).'),
  distance: z.number().optional().describe('The distance to the listing from the user in miles.'),
});
export type SuggestSearchRefinementsInput = z.infer<typeof SuggestSearchRefinementsInputSchema>;

const SuggestSearchRefinementsOutputSchema = z.object({
  suggestedRefinements: z.array(z.string()).describe('An array of suggested search refinements based on the input data.'),
});
export type SuggestSearchRefinementsOutput = z.infer<typeof SuggestSearchRefinementsOutputSchema>;

export async function suggestSearchRefinements(input: SuggestSearchRefinementsInput): Promise<SuggestSearchRefinementsOutput> {
  return suggestSearchRefinementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSearchRefinementsPrompt',
  input: {schema: SuggestSearchRefinementsInputSchema},
  output: {schema: SuggestSearchRefinementsOutputSchema},
  prompt: `Based on the current search term "{{searchTerm}}", and the following data, suggest some search refinements that the user might find helpful.

Review Data: {{#if reviewData}}{{#each reviewData}}Rating: {{{rating}}}, Comment: {{{comment}}}
{{/each}}{{else}}No review data available{{/if}}
Pricing: {{{pricing}}}
Popularity: {{{popularity}}}
Distance: {{{distance}}}

Consider all available data to come up with refinements.

Output an array of strings representing the suggestions.

Example output: ["Cheaper options", "Highly rated", "Closer to me", "Newest listings"]
`,
});

const suggestSearchRefinementsFlow = ai.defineFlow(
  {
    name: 'suggestSearchRefinementsFlow',
    inputSchema: SuggestSearchRefinementsInputSchema,
    outputSchema: SuggestSearchRefinementsOutputSchema,
  },
  async input => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("AI API key is missing. Returning default fallback refinements.");
      return { suggestedRefinements: ["Cheaper options", "Highly rated", "Closer to me", "Newest listings"] };
    }
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (err) {
      console.error("Genkit suggest search refinements flow execution failed:", err);
      return { suggestedRefinements: ["Cheaper options", "Highly rated", "Closer to me", "Newest listings"] };
    }
  }
);
