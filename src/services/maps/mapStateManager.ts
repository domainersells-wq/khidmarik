import type { LocationCoordinates } from './types';
import type { Listing } from '@/types';

export type LocationSource = 'gps' | 'manual' | 'approximate' | 'none';

export interface UserLocationState {
  coordinates: LocationCoordinates;
  accuracy?: number; // meters
  timestamp: number;
  source: LocationSource;
}

export interface PersistentMapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedBusinessId: string | null;
  selectedBusiness: Listing | null;
  userLocation: UserLocationState | null;
  searchQuery: string;
  activeCategory: string;
  selectedDistanceKm: number | null;
  tileMode: string;
}

// Default initial camera center: Sidi Bel Abbès Center (35.1903, -0.6309)
const DEFAULT_CENTER = { lat: 35.1903, lng: -0.6309 };
const DEFAULT_ZOOM = 13;

class MapStateManager {
  private static instance: MapStateManager;

  private state: PersistentMapState = {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    selectedBusinessId: null,
    selectedBusiness: null,
    userLocation: null, // Initial user location is strictly null (NEVER assume default center is user location)
    searchQuery: '',
    activeCategory: 'all',
    selectedDistanceKm: null,
    tileMode: 'streets',
  };

  private listeners: Array<(state: PersistentMapState) => void> = [];

  public static getInstance(): MapStateManager {
    if (!MapStateManager.instance) {
      MapStateManager.instance = new MapStateManager();
    }
    return MapStateManager.instance;
  }

  public getState(): PersistentMapState {
    return { ...this.state };
  }

  public updateState(partial: Partial<PersistentMapState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public setCenter(center: { lat: number; lng: number }, zoom?: number) {
    this.state.center = center;
    if (zoom !== undefined) {
      this.state.zoom = zoom;
    }
    this.notify();
  }

  public setZoom(zoom: number) {
    this.state.zoom = zoom;
    this.notify();
  }

  public setUserLocation(coords: LocationCoordinates, source: LocationSource = 'gps') {
    this.state.userLocation = {
      coordinates: coords,
      accuracy: coords.accuracy,
      timestamp: Date.now(),
      source,
    };
    this.notify();
  }

  public setSelectedBusiness(business: Listing | null) {
    this.state.selectedBusiness = business;
    this.state.selectedBusinessId = business ? business.id : null;
    this.notify();
  }

  public subscribe(listener: (state: PersistentMapState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (e) {
        console.error('Error in mapState listener:', e);
      }
    });
  }
}

export const mapStateManager = MapStateManager.getInstance();
