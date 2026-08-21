
'use server';
/**
 * @fileOverview AI-powered proactive assistant for personalized suggestions.
 *
 * - getProactiveSuggestions - A function that generates reminders and recommendations.
 * - ProactiveAssistantInput - The input type for the getProactiveSuggestions function.
 * - ProactiveAssistantOutput - The return type for the getProactiveSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AssistantSuggestion } from '@/types';

const ProactiveAssistantInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom suggestions are being generated.'),
  currentDate: z.string().describe('The current date in ISO format (e.g., YYYY-MM-DD), to help with time-sensitive suggestions.'),
  // Conceptually, you might add more user context here if available, like recent searches or profile preferences.
});
export type ProactiveAssistantInput = z.infer<typeof ProactiveAssistantInputSchema>;

const SuggestionSchema = z.object({
    id: z.string().describe("A unique ID for the suggestion (e.g., 'ac-maintenance-reminder')."),
    title: z.string().describe('A short, catchy title for the suggestion (e.g., "AC Check-up Time!").'),
    message: z.string().describe('The personalized message from the assistant to the user. Should be friendly and helpful, not purely promotional. Max 2-3 sentences.'),
    iconName: z.string().optional().describe("Optional: The name of a lucide-react icon to display with the suggestion (e.g., 'Wrench', 'ShoppingCart')."),
    actionText: z.string().optional().describe('Optional: Text for an action button (e.g., "Book AC Service", "Browse Water Filters").'),
    actionLink: z.string().optional().describe('Optional: A relative URL for the action button (e.g., "/listings?category=hvac-services", "/marketplace?query=water+filter").'),
    actionType: z.enum(['navigate', 'call_function']).optional().describe("Optional: Hints how the UI should handle the action. 'navigate' for links, 'call_function' for more complex actions (conceptual)."),
});

const ProactiveAssistantOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('An array of 1-3 personalized suggestions or reminders for the user. Empty array if no relevant suggestions.'),
});
export type ProactiveAssistantOutput = z.infer<typeof ProactiveAssistantOutputSchema>;

export async function getProactiveSuggestions(input: ProactiveAssistantInput): Promise<ProactiveAssistantOutput> {
  return proactiveAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proactiveAssistantPrompt',
  input: {schema: ProactiveAssistantInputSchema},
  output: {schema: ProactiveAssistantOutputSchema},
  prompt: `You are Khidmatik Assistant, a friendly and insightful personal assistant for users of the Khidmatik app in Algeria.
Your goal is to provide proactive, helpful, and timely reminders or suggestions to enhance the user's experience and well-being.
The current date is: {{{currentDate}}}. User ID: {{{userId}}}.

IMPORTANT: You do NOT have access to a real user database. You must *imagine* a plausible recent service history or app interaction for this user ({{{userId}}}) to base your suggestions on. Be creative and logical.
For example:
- If their ID contains "ac_user", imagine they had an AC installation or service about 11 months ago.
- If their ID contains "new_shop_owner", imagine they recently registered a new shop on Khidmatik.
- If their ID is generic like "user123", imagine a common scenario like a seasonal need or a follow-up to a typical service.

Based on this *imagined* history and the current date, generate 1 to 2 highly relevant and personalized suggestions.
Your suggestions should feel like advice from a caring assistant, not an advertisement.

Focus on:
- Maintenance reminders (e.g., "It's been about a year since your AC service...").
- Opportunities to use complementary Khidmatik services (e.g., "Since you recently hired a painter, perhaps consider professional cleaning services?").
- Seasonal needs (e.g., "Winter is approaching, have you checked your heating system?").
- Reminders for consumable products if a related service was performed (e.g., "Time to change your water filter?").
- If suggesting a Khidmatik feature, mention it naturally (e.g., "You can securely pay through the Khidmatik Escrow Wallet.").

For each suggestion, provide:
- A unique 'id' (e.g., 'ac-maintenance-reminder', 'water-filter-check').
- A short, engaging 'title'.
- A personalized 'message' (2-3 sentences).
- Optional: 'iconName' (a valid lucide-react icon name like 'Wrench', 'ShoppingCart', 'CalendarClock', 'Sparkles').
- Optional: 'actionText' for a button.
- Optional: 'actionLink' (a relative Khidmatik app URL like '/listings?category=hvac-services' or '/marketplace?query=filters').
- Optional: 'actionType' ('navigate' for links).

Example for AC Maintenance:
Title: "AC Tune-Up Time?"
Message: "Hello! With the warmer season around the corner (current date: {{{currentDate}}}), it might be a good time to get your AC serviced. Regular maintenance ensures it runs efficiently all summer. We can help you find trusted HVAC technicians in your area."
iconName: "AirVent"
actionText: "Find HVAC Technicians"
actionLink: "/listings?category=hvac-services"
actionType: "navigate"

Example for new shop owner:
Title: "Boost Your New Shop!"
Message: "Congratulations on your new venture! Now that your shop is listed, have you considered professional logo design or digital marketing services to attract more customers? Khidmatik has talented local freelancers who can help."
iconName: "Palette"
actionText: "Explore Digital Services"
actionLink: "/digital-services"
actionType: "navigate"

If no truly relevant or timely suggestion comes to mind for the imagined scenario, return an empty 'suggestions' array.
Do not make up fake statistics or overly pushy sales language. Be genuinely helpful.
Output valid JSON matching the ProactiveAssistantOutputSchema.
`,
});

const proactiveAssistantFlow = ai.defineFlow(
  {
    name: 'proactiveAssistantFlow',
    inputSchema: ProactiveAssistantInputSchema,
    outputSchema: ProactiveAssistantOutputSchema,
  },
  async (input): Promise<ProactiveAssistantOutput> => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("AI API key is missing. Returning default proactive suggestions.");
      return {
        suggestions: [
          {
            id: "ac-maintenance-reminder",
            title: "AC Tune-Up Time?",
            message: "Hello! With the warmer season around the corner, it might be a good time to get your AC serviced. We can help you find trusted HVAC technicians in your area.",
            iconName: "Wrench",
            actionText: "Find HVAC Technicians",
            actionLink: "/listings?category=hvac-services",
            actionType: "navigate"
          },
          {
            id: "digital-services-promo",
            title: "Boost Your Shop!",
            message: "Congratulations on your new venture! Consider professional logo design or digital marketing services to attract more marketing leads.",
            iconName: "Palette",
            actionText: "Explore Digital Services",
            actionLink: "/digital-services",
            actionType: "navigate"
          }
        ]
      };
    }
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (err) {
      console.error("Genkit proactive assistant flow execution failed:", err);
      return { suggestions: [] };
    }
  }
);

