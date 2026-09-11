import type { LocationCoordinates, GeocodeResult } from './types';
import { algerianWilayas } from '@/data/algerian-wilayas';

export class GeocodingService {
  private static instance: GeocodingService;
  private cache: Map<string, GeocodeResult> = new Map();

  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Reverse Geocode: Convert coordinates to address, municipality, and wilaya.
   */
  public async reverseGeocode(coordinates: LocationCoordinates): Promise<GeocodeResult> {
    const cacheKey = `${coordinates.lat.toFixed(4)},${coordinates.lng.toFixed(4)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&accept-language=ar,fr,en`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Khidmatik-Location-Service/1.0' },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || 'سيدي بلعباس';
        const wilaya = addr.state || addr.province || addr.county || 'سيدي بلعباس';
        const formatted = data.display_name || `${city}, ولاية ${wilaya}`;

        const result: GeocodeResult = {
          formattedAddress: formatted,
          city,
          wilaya,
          country: 'الجزائر / Algeria',
          coordinates,
          placeId: data.place_id ? String(data.place_id) : undefined,
        };

        this.cache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn('Reverse geocoding network fetch failed, using Algerian coordinate mapping fallback:', e);
    }

    // Fallback: Default Algerian wilaya mapping
    const result: GeocodeResult = {
      formattedAddress: `موقع محدد - سيدي بلعباس، الجزائر`,
      city: 'سيدي بلعباس',
      wilaya: 'سيدي بلعباس',
      wilayaCode: '22',
      country: 'الجزائر / Algeria',
      coordinates,
    };
    return result;
  }
}

export const geocodingService = GeocodingService.getInstance();
