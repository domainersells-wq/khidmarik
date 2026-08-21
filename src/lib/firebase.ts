
'use client'; // This will be used by client components

import type { ConversionFunnelData, GeographicOrderData } from '@/types';

// --- CONCEPTUAL FIREBASE ANALYTICS MOCK ---
// In a real app, this would import from the Firebase SDK
// import { getAnalytics, logEvent as firebaseLogEvent } from "firebase/analytics";

/**
 * Conceptually logs an event to Firebase Analytics.
 * In this mock, it just logs to the console.
 * @param eventName The name of the event to log.
 * @param eventParams Optional parameters for the event.
 */
export function logEvent(eventName: string, eventParams?: { [key: string]: any }) {
  console.log(`[Firebase Analytics Mock] Event logged: ${eventName}`, eventParams || '');
  // Real implementation:
  // const analytics = getAnalytics();
  // firebaseLogEvent(analytics, eventName, eventParams);
}

/**
 * Conceptually retrieves conversion funnel data from Firebase Analytics or Firestore.
 * This is a mock function that simulates an async data fetch.
 * @param devMode - If true, returns dummy data. Otherwise, simulates an empty or error state.
 * @returns A promise that resolves to an array of conversion funnel data.
 */
export async function getConversionFunnelData(devMode: boolean = false): Promise<ConversionFunnelData[]> {
  console.log(`[Firebase Mock] Fetching conversion funnel data (devMode: ${devMode})`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return [
    { step: 'Visited Store', count: devMode ? 320 : 180, fill: '#4f46e5' },
    { step: 'Viewed Product', count: devMode ? 210 : 110, fill: '#6366f1' },
    { step: 'Added to Cart', count: devMode ? 130 : 65, fill: '#818cf8' },
    { step: 'Initiated Checkout', count: devMode ? 75 : 30, fill: '#a5b4fc' },
    { step: 'Completed Purchase', count: devMode ? 38 : 14, fill: '#10b981' }
  ];
}

/**
 * Conceptually retrieves order data aggregated by Wilaya from a database.
 * This is a mock function that simulates an async data fetch.
 * @param devMode - If true, returns dummy data. Otherwise, simulates an empty or error state.
 * @param timePeriod - A conceptual filter for the data fetch.
 * @returns A promise that resolves to an array of geographic order data.
 */
export async function getOrdersPerWilaya(devMode: boolean = false, timePeriod: 'day' | 'week' | 'month' = 'month'): Promise<GeographicOrderData[]> {
  console.log(`[Firebase Mock] Fetching orders per Wilaya (devMode: ${devMode}, period: ${timePeriod})`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Adjust data slightly based on time period for visual feedback
  const multiplier = timePeriod === 'day' ? 0.15 : timePeriod === 'week' ? 0.55 : 1;
  const baseData = [
    { wilaya: "Algiers", count: Math.round(140 * multiplier), total: 380000 * multiplier },
    { wilaya: "Oran", count: Math.round(95 * multiplier), total: 245000 * multiplier },
    { wilaya: "Sétif", count: Math.round(70 * multiplier), total: 165000 * multiplier },
    { wilaya: "Constantine", count: Math.round(82 * multiplier), total: 198000 * multiplier },
    { wilaya: "Tizi Ouzou", count: Math.round(48 * multiplier), total: 105000 * multiplier },
    { wilaya: "S.B. Abbès", count: Math.round(35 * multiplier), total: 85000 * multiplier },
  ];

  return baseData;
}

    