
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-search-refinements.ts';
import '@/ai/flows/generate-listing-description-flow.ts';
import '@/ai/flows/suggest-digital-services-flow.ts';
import '@/ai/flows/proactive-assistant-flow.ts'; // Added new flow
