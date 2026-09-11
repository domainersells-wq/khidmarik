export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number; // In meters
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface PlaceSuggestion {
  id: string;
  name: string;
  formattedAddress: string;
  city?: string;
  wilaya?: string;
  wilayaCode?: string;
  country?: string;
  coordinates: LocationCoordinates;
  placeType?: 'wilaya' | 'commune' | 'business' | 'street' | 'landmark' | 'custom';
  isKhidmatikListing?: boolean;
  khidmatikListingId?: string;
}

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteResult {
  distanceKm: number; // Real road/driving distance
  durationMinutes: number; // Estimated travel time in minutes
  formattedDistance: string; // e.g., "4.2 كم" or "4.2 km"
  formattedDuration: string; // e.g., "12 دقيقة" or "12 mins"
  polylineCoordinates: Array<[number, number]>; // Array of [lat, lng] points for drawing polyline
  steps?: RouteStep[];
  startCoordinates: LocationCoordinates;
  destinationCoordinates: LocationCoordinates;
  trafficStatus?: 'normal' | 'moderate' | 'heavy';
}

export interface CategoryMarkerConfig {
  categoryKey: string;
  labelAr: string;
  labelEn: string;
  labelFr: string;
  iconSymbol: string;
  primaryColor: string;
  badgeBg: string;
  textColor: string;
}

export interface GeocodeResult {
  formattedAddress: string;
  streetNumber?: string;
  route?: string;
  city: string;
  commune?: string;
  wilaya: string;
  wilayaCode?: string;
  country: string;
  coordinates: LocationCoordinates;
  placeId?: string;
}

export type GeolocationErrorCode = 
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNSUPPORTED'
  | 'POOR_ACCURACY'
  | 'UNKNOWN';

export interface GeolocationErrorResult {
  code: GeolocationErrorCode;
  messageAr: string;
  messageEn: string;
  messageFr: string;
  originalError?: any;
}
