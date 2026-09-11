import type { PlaceSuggestion, LocationCoordinates } from './types';
import { algerianWilayas } from '@/data/algerian-wilayas';

// Default Algeria bounding viewport
export const ALGERIA_BOUNDS = {
  north: 37.1,
  south: 18.9,
  west: -8.7,
  east: 12.0,
};

export class PlacesSearchService {
  private static instance: PlacesSearchService;
  private sessionToken: string = '';
  private indexedPlaces: PlaceSuggestion[] = [];

  constructor() {
    this.sessionToken = this.generateSessionToken();
    this.buildLocalIndex();
  }

  public static getInstance(): PlacesSearchService {
    if (!PlacesSearchService.instance) {
      PlacesSearchService.instance = new PlacesSearchService();
    }
    return PlacesSearchService.instance;
  }

  public generateSessionToken(): string {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  private buildLocalIndex() {
    const list: PlaceSuggestion[] = [];

    algerianWilayas.forEach((w) => {
      const wilayaNum = parseInt(w.code) || 1;
      // Default coordinate centers for major wilayas
      let wLat = 35.0 + (wilayaNum % 7) * 0.4 - 1.0;
      let wLng = 0.0 + (wilayaNum % 9) * 0.8 - 2.0;

      if (w.code === '22') { wLat = 35.1903; wLng = -0.6309; } // Sidi Bel Abbès
      else if (w.code === '31') { wLat = 35.6987; wLng = -0.6349; } // Oran
      else if (w.code === '16') { wLat = 36.7538; wLng = 3.0588; } // Algiers
      else if (w.code === '25') { wLat = 36.3650; wLng = 6.6147; } // Constantine
      else if (w.code === '13') { wLat = 34.8783; wLng = -1.3150; } // Tlemcen
      else if (w.code === '29') { wLat = 35.3975; wLng = 0.1417; } // Mascara

      // 1. Add Wilaya Entry
      list.push({
        id: `wilaya_${w.code}`,
        name: `ولاية ${w.name}`,
        formattedAddress: `${w.name} (${w.name_en}), الجزائر`,
        city: w.name,
        wilaya: w.name,
        wilayaCode: w.code,
        country: 'الجزائر / Algeria',
        placeType: 'wilaya',
        coordinates: { lat: wLat, lng: wLng },
      });

      // 2. Add Municipalities
      w.municipalities?.forEach((m, idx) => {
        const mLat = wLat + ((idx % 5) * 0.02 - 0.04);
        const mLng = wLng + ((idx % 7) * 0.02 - 0.06);

        list.push({
          id: `commune_${m.code}`,
          name: m.name,
          formattedAddress: `${m.name} (${m.name_fr || m.name_en || ''}) - ولاية ${w.name}`,
          city: m.name,
          wilaya: w.name,
          wilayaCode: w.code,
          country: 'الجزائر / Algeria',
          placeType: 'commune',
          coordinates: { lat: parseFloat(mLat.toFixed(5)), lng: parseFloat(mLng.toFixed(5)) },
        });
      });
    });

    this.indexedPlaces = list;
  }

  /**
   * Search places, cities, wilayas, and landmarks with autocomplete suggestions.
   * Biased toward current user coordinates or map viewport.
   */
  public async searchPlaces(
    query: string,
    options?: {
      userLocation?: LocationCoordinates | null;
      language?: 'ar' | 'fr' | 'en';
      limit?: number;
    }
  ): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const limit = options?.limit || 8;

    // 1. Search in local indexed places (Wilayas + Municipalities + Landmarks)
    const localMatches = this.indexedPlaces.filter((place) => {
      return (
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.formattedAddress.toLowerCase().includes(normalizedQuery) ||
        (place.wilaya && place.wilaya.toLowerCase().includes(normalizedQuery)) ||
        (place.wilayaCode && place.wilayaCode === normalizedQuery)
      );
    });

    // Sort by proximity if userLocation is available
    if (options?.userLocation) {
      const uLat = options.userLocation.lat;
      const uLng = options.userLocation.lng;
      localMatches.sort((a, b) => {
        const distA = Math.hypot(a.coordinates.lat - uLat, a.coordinates.lng - uLng);
        const distB = Math.hypot(b.coordinates.lat - uLat, b.coordinates.lng - uLng);
        return distA - distB;
      });
    }

    return localMatches.slice(0, limit);
  }
}

export const placesSearchService = PlacesSearchService.getInstance();
