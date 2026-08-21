
'use server';
/**
 * @fileOverview AI-powered listing description generator.
 *
 * - generateListingDescription - A function that generates a listing description.
 * - GenerateListingDescriptionInput - The input type for the generateListingDescription function.
 * - GenerateListingDescriptionOutput - The return type for the generateListingDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateListingDescriptionInputSchema = z.object({
  businessName: z.string().describe('The name of the business or professional.'),
  listingType: z.enum(['store', 'professional']).describe('The type of listing (store or professional).'),
  category: z.string().describe('The category of the business or profession (e.g., Restaurant, Plumber, Clothing Store).'),
  keywords: z.string().describe('A few keywords or a short phrase describing the business, its unique selling points, or services offered (e.g., "family-friendly, authentic Italian, fresh pasta", "emergency 24/7, licensed, affordable", "latest fashion trends, local designers").'),
});
export type GenerateListingDescriptionInput = z.infer<typeof GenerateListingDescriptionInputSchema>;

const GenerateListingDescriptionOutputSchema = z.object({
  generatedDescription: z.string().describe('An engaging and informative description for the listing, up to 3-4 sentences long.'),
});
export type GenerateListingDescriptionOutput = z.infer<typeof GenerateListingDescriptionOutputSchema>;

export async function generateListingDescription(input: GenerateListingDescriptionInput): Promise<GenerateListingDescriptionOutput> {
  return generateListingDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateListingDescriptionPrompt',
  input: {schema: GenerateListingDescriptionInputSchema},
  output: {schema: GenerateListingDescriptionOutputSchema},
  prompt: `You are an expert marketing copywriter tasked with generating a compelling and informative business listing description.

Business Name: {{{businessName}}}
Listing Type: {{{listingType}}}
Category: {{{category}}}
Keywords/Focus: {{{keywords}}}

Based on the information provided, write an engaging description for this business/professional. The description should be approximately 2-4 sentences long.
Highlight its key features and what makes it appealing to potential customers.
Maintain a positive and inviting tone.
Do not use markdown.
Ensure the output is a single string for the 'generatedDescription' field.
`,
});

const generateListingDescriptionFlow = ai.defineFlow(
  {
    name: 'generateListingDescriptionFlow',
    inputSchema: GenerateListingDescriptionInputSchema,
    outputSchema: GenerateListingDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
