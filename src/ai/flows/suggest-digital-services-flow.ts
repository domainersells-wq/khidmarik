
'use server';
/**
 * @fileOverview AI-powered digital service suggestions based on user's physical service context.
 *
 * - suggestDigitalServices - A function that suggests relevant digital services.
 * - SuggestDigitalServicesInput - The input type for the suggestDigitalServices function.
 * - SuggestDigitalServicesOutput - The return type for the suggestDigitalServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {digitalServiceCategories} from '@/data/mock'; // To help AI suggest valid categories

const SuggestDigitalServicesInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom suggestions are being made.'),
  recentPhysicalServiceContext: z.string().describe('A brief description of a recent physical service the user engaged with or is setting up (e.g., "opened a new restaurant", "booked a painter for their new shop", "setting up an office").'),
});
export type SuggestDigitalServicesInput = z.infer<typeof SuggestDigitalServicesInputSchema>;

const SuggestedServiceSchema = z.object({
    serviceName: z.string().describe('A specific digital service name (e.g., "Logo Design", "Social Media Marketing Setup", "Website Development").'),
    category: z.string().describe(`The category slug of the suggested digital service. Must be one of: ${digitalServiceCategories.map(c => c.slug).join(', ')}`),
    rationale: z.string().describe('A brief explanation (1-2 sentences) why this digital service is relevant to the user\'s physical service context.'),
});

const SuggestDigitalServicesOutputSchema = z.object({
  suggestedServices: z.array(SuggestedServiceSchema).describe('An array of 2-3 suggested digital services relevant to the user\'s context.'),
});
export type SuggestDigitalServicesOutput = z.infer<typeof SuggestDigitalServicesOutputSchema>;

export async function suggestDigitalServices(input: SuggestDigitalServicesInput): Promise<SuggestDigitalServicesOutput> {
  return suggestDigitalServicesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDigitalServicesPrompt',
  input: {schema: SuggestDigitalServicesInputSchema},
  output: {schema: SuggestDigitalServicesOutputSchema},
  prompt: `You are an expert business consultant helping users of Khidmatik, a platform connecting users with local physical and digital service providers across Algeria.
A user (ID: {{{userId}}}) has recently engaged with or is setting up a physical service described as: "{{{recentPhysicalServiceContext}}}".

Based on this context, suggest 2-3 relevant digital services that would benefit them.
For each suggestion, provide:
1.  A specific 'serviceName'.
2.  The 'category' slug from the following list: ${digitalServiceCategories.map(c => `${c.name} (slug: ${c.slug})`).join('; ')}.
3.  A short 'rationale' (1-2 sentences) explaining why it's a good fit.

Focus on services that complement the setup or operation of a business or project related to their physical service.
For example, if they are "opening a new coffee shop", suggest "Logo Design" (graphic-design) because a new business needs branding, or "Social Media Page Setup" (digital-marketing) to attract customers.
If they "booked a painter for their new shop", they might also need "Interior Design Consultation (Digital)" or "Promotional Flyer Design".

Return the suggestions as an array in the 'suggestedServices' field.
Keep suggestions concise and practical for a local business or individual in Algeria.
`,
});

const suggestDigitalServicesFlow = ai.defineFlow(
  {
    name: 'suggestDigitalServicesFlow',
    inputSchema: SuggestDigitalServicesInputSchema,
    outputSchema: SuggestDigitalServicesOutputSchema,
  },
  async (input) => {
    // In a real scenario, you might fetch more user data using input.userId
    const {output} = await prompt(input);
    return output!;
  }
);
