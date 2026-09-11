import type { LocationCoordinates, GeolocationErrorResult, GeolocationErrorCode } from './types';

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Check if native geolocation API is supported by the current browser.
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  }

  /**
   * Request user's real device GPS position with high accuracy (enableHighAccuracy: true, timeout: 20000, maximumAge: 0).
   */
  public getCurrentPosition(
    options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  ): Promise<{ coordinates: LocationCoordinates }> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const err: GeolocationErrorResult = {
          code: 'UNSUPPORTED',
          messageAr: 'خاصية تحديد الموقع الجغرافي غير مدعومة في هذا المتصفح.',
          messageEn: 'Geolocation is not supported by this browser.',
          messageFr: 'La géolocalisation n\'est pas prise en charge par ce navigateur.',
        };
        return reject(err);
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);

          // Coordinate bounds validation
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return reject({
              code: 'POSITION_UNAVAILABLE',
              messageAr: 'تم استلام إحداثيات غير صالحة من الجهاز.',
              messageEn: 'Invalid coordinates received from device.',
              messageFr: 'Coordonnées invalides reçues de l\'appareil.',
            });
          }

          const coordinates: LocationCoordinates = {
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lng.toFixed(6)),
            accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          };
          resolve({ coordinates });
        },
        (error) => {
          let code: GeolocationErrorCode = 'UNKNOWN';
          let messageAr = 'حدث خطأ غير متوقع أثناء محاولة جلب موقعك.';
          let messageEn = 'An unexpected error occurred while fetching your location.';
          let messageFr = 'Une erreur inattendue est survenue lors de la récupération de votre position.';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              code = 'PERMISSION_DENIED';
              messageAr = 'تم رفض إذن الوصول للموقع. يرجى السماح بالوصول للموقع في إعدادات المتصفح.';
              messageEn = 'Location access was denied. Please allow location permissions in your browser settings.';
              messageFr = 'L\'accès à la localisation a été refusé. Veuillez autoriser la localisation.';
              break;

            case error.POSITION_UNAVAILABLE:
              code = 'POSITION_UNAVAILABLE';
              messageAr = 'إشارة الـ GPS غير متوفرة حالياً على جهازك. يرجى تفعيل الـ GPS والاتصال بالشبكة.';
              messageEn = 'GPS signal is currently unavailable. Please enable GPS and network.';
              messageFr = 'Signal GPS indisponible. Veuillez activer le GPS et la connexion.';
              break;

            case error.TIMEOUT:
              code = 'TIMEOUT';
              messageAr = 'انتهت مهلة طلب تحديد الموقع بدقة. يرجى المحاولة مجدداً في مكان مكشوف.';
              messageEn = 'Location request timed out. Please try again in an open area.';
              messageFr = 'Le délai de localisation a expiré. Veuillez réessayer.';
              break;
          }

          const errResult: GeolocationErrorResult = {
            code,
            messageAr,
            messageEn,
            messageFr,
            originalError: error,
          };
          reject(errResult);
        },
        options
      );
    });
  }

  /**
   * Watch user location in real-time as they move.
   */
  public watchPosition(
    onSuccess: (coordinates: LocationCoordinates) => void,
    onError?: (error: GeolocationErrorResult) => void
  ): number | null {
    if (!this.isSupported()) return null;

    this.clearWatch();

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates: LocationCoordinates = {
          lat: parseFloat(position.coords.latitude.toFixed(6)),
          lng: parseFloat(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };
        onSuccess(coordinates);
      },
      (error) => {
        if (onError) {
          onError({
            code: 'POSITION_UNAVAILABLE',
            messageAr: 'تعذر تحديث إشارة الموقع المباشرة.',
            messageEn: 'Unable to update live GPS signal.',
            messageFr: 'Impossible de mettre à jour la position GPS.',
            originalError: error,
          });
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );

    return this.watchId;
  }

  /**
   * Clear active location watcher.
   */
  public clearWatch() {
    if (this.watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Format accuracy description string clearly.
   */
  public formatAccuracy(accuracyMeters?: number, language: string = 'ar'): { text: string; isPrecise: boolean } {
    if (!accuracyMeters) {
      return {
        text: language === 'ar' ? 'موقع تقريبي' : 'Approximate location',
        isPrecise: false,
      };
    }

    if (accuracyMeters <= 50) {
      return {
        text: language === 'ar' ? `دقة الموقع: حوالي ${accuracyMeters} م` : `Location accuracy: ~${accuracyMeters} m`,
        isPrecise: true,
      };
    }

    if (accuracyMeters <= 200) {
      return {
        text: language === 'ar' ? `دقة متوسطة: ±${accuracyMeters} م` : `Moderate accuracy: ±${accuracyMeters} m`,
        isPrecise: true,
      };
    }

    return {
      text: language === 'ar' 
        ? `موقع تقريبي (±${accuracyMeters} م)` 
        : `Approximate location (±${accuracyMeters} m)`,
      isPrecise: false,
    };
  }

  /**
   * Calculate Haversine straight-line distance between two coordinates in kilometers.
   */
  public calculateDistanceKm(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((end.lat - start.lat) * Math.PI) / 180;
    const dLon = ((end.lng - start.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((start.lat * Math.PI) / 180) *
        Math.cos((end.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Format distance string cleanly (meters if < 1km, kilometers if >= 1km).
   */
  public formatDistance(distanceKm: number, language: string = 'ar'): string {
    if (distanceKm < 1) {
      const meters = Math.round(distanceKm * 1000);
      return language === 'ar' ? `${meters} متر` : `${meters} m`;
    }
    return language === 'ar' ? `${distanceKm.toFixed(1)} كم` : `${distanceKm.toFixed(1)} km`;
  }
}

export const locationService = LocationService.getInstance();
