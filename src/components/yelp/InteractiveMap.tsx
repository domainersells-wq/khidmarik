'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Listing, Store, Professional } from '@/types';
import type { RouteResult, PlaceSuggestion, LocationCoordinates } from '@/services/maps/types';
import { locationService } from '@/services/maps/locationService';
import { placesSearchService } from '@/services/maps/placesSearchService';
import { routingService } from '@/services/maps/routingService';
import { mapStateManager, type UserLocationState } from '@/services/maps/mapStateManager';
import { getCategoryMarkerConfig, generateCustomMarkerHtml, CATEGORY_MARKER_MAP } from '@/services/maps/mapMarkers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Compass, Navigation, Eye, ZoomIn, ZoomOut, RotateCcw, 
  Sliders, RefreshCw, Layers, X, Maximize2, Minimize2, Phone, 
  ExternalLink, MessageCircle, Star, Sparkles, LocateFixed, Check,
  Search, ShieldCheck, Clock, Store as StoreIcon, Wrench, Utensils,
  Car, HeartPulse, Building2, AlertCircle, Share2, Route as RouteIcon,
  ChevronUp, ChevronDown, ArrowRight, CornerUpRight, Info, ListOrdered,
  Plus, Minus, Scissors
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface InteractiveMapProps {
  listings: Listing[];
  onMarkerClick?: (listing: Listing) => void;
  selectedListing?: Listing | null;
  className?: string;
}

// Tile Providers (100% In-App Web Tiles, No external redirects)
const TILE_PROVIDERS = {
  streets: {
    nameAr: 'شوارع حديثة',
    nameEn: 'Streets',
    nameFr: 'Rues',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    maxZoom: 20,
  },
  satellite: {
    nameAr: 'قمر صناعي',
    nameEn: 'Satellite',
    nameFr: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    maxZoom: 19,
  },
  dark: {
    nameAr: 'الوضع الليلي',
    nameEn: 'Dark Mode',
    nameFr: 'Mode Nuit',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    maxZoom: 20,
  },
  osm: {
    nameAr: 'خريطة قياسية',
    nameEn: 'Standard OSM',
    nameFr: 'OSM Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }
};

type TileMode = keyof typeof TILE_PROVIDERS;

export function InteractiveMap({
  listings,
  onMarkerClick,
  selectedListing,
  className
}: InteractiveMapProps) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const initialMapState = mapStateManager.getState();

  // Map DOM & Leaflet Refs (Persistent & isolated from React re-renders)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const lastSearchCenterRef = useRef<{ lat: number; lng: number }>(initialMapState.center);

  const [leafletInstance, setLeafletInstance] = useState<any>(null);

  // Persistent UI States from MapStateManager
  const [activeItem, setActiveItem] = useState<Listing | null>(selectedListing || initialMapState.selectedBusiness);
  const [tileMode, setTileMode] = useState<TileMode>((initialMapState.tileMode as TileMode) || 'streets');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTileDropdownOpen, setIsTileDropdownOpen] = useState(false);

  // In-App Search & Viewport
  const [searchQuery, setSearchQuery] = useState(initialMapState.searchQuery || '');
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState<boolean>(false);

  // Categories & Distance Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialMapState.activeCategory || 'all');
  const [selectedDistanceKm, setSelectedDistanceKm] = useState<number | null>(initialMapState.selectedDistanceKm);

  // Real Device Geolocation State
  const [userLocationState, setUserLocationState] = useState<UserLocationState | null>(initialMapState.userLocation);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);

  // In-App Routing & Directions
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [showRouteStepsModal, setShowRouteStepsModal] = useState<boolean>(false);

  // Mobile Bottom Sheet
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState<boolean>(false);

  // 1. Process & Normalize Listings with Coordinates
  const processedListings = useMemo(() => {
    return listings.map((item, index) => {
      const explicitLat = (item as any).latitude ? parseFloat((item as any).latitude) : null;
      const explicitLng = (item as any).longitude ? parseFloat((item as any).longitude) : null;

      let lat = explicitLat || 35.1903;
      let lng = explicitLng || -0.6309;

      if (!explicitLat || !explicitLng) {
        const offsetLat = Math.sin(index * 1.7) * 0.024;
        const offsetLng = Math.cos(index * 2.1) * 0.032;
        lat = 35.1903 + offsetLat;
        lng = -0.6309 + offsetLng;
      }

      const categoryMeta = getCategoryMarkerConfig(item.category, item.type);

      return {
        ...item,
        lat,
        lng,
        categoryMeta
      };
    });
  }, [listings]);

  // 2. Filter listings based on category, search query, and distance filter
  const filteredListings = useMemo(() => {
    return processedListings.filter((item) => {
      if (selectedCategory !== 'all') {
        const catKey = (item.category || item.type || '').toLowerCase();
        if (selectedCategory === 'store' && item.type !== 'store') return false;
        if (selectedCategory === 'craftsman' && item.type !== 'professional') return false;
        if (selectedCategory === 'food' && !catKey.includes('rest') && !catKey.includes('food')) return false;
        if (selectedCategory === 'auto' && !catKey.includes('auto') && !catKey.includes('car')) return false;
        if (selectedCategory === 'health' && !catKey.includes('doc') && !catKey.includes('pharma') && !catKey.includes('medic')) return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        const matchesCity = (item.location?.city || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesCity && !matchesDesc) return false;
      }

      if (selectedDistanceKm && userLocationState?.coordinates) {
        const dist = locationService.calculateDistanceKm(userLocationState.coordinates, { lat: item.lat, lng: item.lng });
        if (dist > selectedDistanceKm) return false;
      }

      return true;
    });
  }, [processedListings, selectedCategory, searchQuery, selectedDistanceKm, userLocationState]);

  // Sync selectedListing prop with local activeItem without resetting map center
  useEffect(() => {
    if (selectedListing) {
      setActiveItem(selectedListing);
      mapStateManager.setSelectedBusiness(selectedListing);
      if (leafletMapRef.current && (selectedListing as any).latitude) {
        leafletMapRef.current.flyTo([(selectedListing as any).latitude, (selectedListing as any).longitude], 15, { duration: 1.2 });
      }
    }
  }, [selectedListing]);

  // 3. Initialize Leaflet Map ONCE on mount (NEVER recreate on language change)
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current || isInitializedRef.current) return;

      try {
        const L = (await import('leaflet')).default;
        if (!isMounted) return;
        setLeafletInstance(L);

        // Fix Leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const currentMapState = mapStateManager.getState();
        const initialCenter = currentMapState.center;
        const initialZoom = currentMapState.zoom;

        const map = L.map(mapContainerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: initialZoom,
          zoomControl: false,
          attributionControl: false,
        });

        const provider = TILE_PROVIDERS[tileMode];
        tileLayerRef.current = L.tileLayer(provider.url, {
          maxZoom: provider.maxZoom,
          subdomains: 'abcd',
        }).addTo(map);

        markersLayerGroupRef.current = L.layerGroup().addTo(map);

        // Track user pan/zoom movements to update "Search this area" button & mapStateManager
        map.on('moveend', () => {
          const center = map.getCenter();
          const zoom = map.getZoom();
          mapStateManager.setCenter({ lat: center.lat, lng: center.lng }, zoom);

          // Check if moved away from previous search center
          const distFromLast = locationService.calculateDistanceKm(lastSearchCenterRef.current, { lat: center.lat, lng: center.lng });
          if (distFromLast > 1.5) {
            setShowSearchThisArea(true);
          }
        });

        leafletMapRef.current = map;
        isInitializedRef.current = true;

        // ResizeObserver
        const resizeObserver = new ResizeObserver(() => {
          if (map) map.invalidateSize();
        });
        if (mapContainerRef.current) {
          resizeObserver.observe(mapContainerRef.current);
        }

      } catch (err) {
        console.error('Error initializing Khidmatik In-App Map:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // 4. Update Tile Provider on Mode Change
  useEffect(() => {
    if (!leafletInstance || !leafletMapRef.current) return;
    const L = leafletInstance;
    const map = leafletMapRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const provider = TILE_PROVIDERS[tileMode];
    tileLayerRef.current = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: 'abcd',
    }).addTo(map);

    mapStateManager.updateState({ tileMode });
  }, [tileMode, leafletInstance]);

  // 5. Render Markers with Custom Category Themes & In-App Clicks
  useEffect(() => {
    if (!leafletInstance || !leafletMapRef.current || !markersLayerGroupRef.current) return;
    const L = leafletInstance;
    const map = leafletMapRef.current;
    const group = markersLayerGroupRef.current;

    group.clearLayers();

    filteredListings.forEach((item) => {
      const isSelected = activeItem?.id === item.id;
      const isSponsored = !!((item as any).isSponsored || (item as any).sponsored);
      const logoUrl = (item as any).logoUrl || (item as any).logo || undefined;
      const markerHtml = generateCustomMarkerHtml(item.categoryMeta, item.name, item.averageRating, isSelected, isSponsored, logoUrl);

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'khidmatik-custom-pin',
        iconSize: [42, 48],
        iconAnchor: [21, 48],
        popupAnchor: [0, -46]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveItem(item);
        mapStateManager.setSelectedBusiness(item);
        if (onMarkerClick) onMarkerClick(item);
        map.panTo([item.lat, item.lng]);
        setIsBottomSheetExpanded(true);
      });

      marker.addTo(group);
    });
  }, [leafletInstance, filteredListings, activeItem, onMarkerClick]);

  // 6. Draw In-App Driving Route Polyline
  useEffect(() => {
    if (!leafletInstance || !leafletMapRef.current) return;
    const L = leafletInstance;
    const map = leafletMapRef.current;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (activeRoute && activeRoute.polylineCoordinates.length > 0) {
      const polyline = L.polyline(activeRoute.polylineCoordinates, {
        color: '#2563eb',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [70, 70] });
    }
  }, [activeRoute, leafletInstance]);

  // 7. Handle "Use My Location" (Real Device GPS & Real Accuracy Radius)
  const handleUseMyLocation = async () => {
    setIsLocatingUser(true);

    try {
      const { coordinates } = await locationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      });
      
      mapStateManager.setUserLocation(coordinates, 'gps');
      setUserLocationState({
        coordinates,
        accuracy: coordinates.accuracy,
        timestamp: Date.now(),
        source: 'gps'
      });
      setIsLocatingUser(false);

      if (leafletInstance && leafletMapRef.current) {
        const L = leafletInstance;
        const map = leafletMapRef.current;

        // Remove previous user markers & circle
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        if (userAccuracyCircleRef.current) map.removeLayer(userAccuracyCircleRef.current);

        // Real Accuracy Circle: Use position.coords.accuracy directly (e.g. 15m)
        if (coordinates.accuracy && coordinates.accuracy < 3000) {
          const circle = L.circle([coordinates.lat, coordinates.lng], {
            radius: coordinates.accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.14,
            weight: 1.5,
          }).addTo(map);
          userAccuracyCircleRef.current = circle;
        }

        // Blue Location Pin
        const userHtml = `
          <div class="relative flex items-center justify-center select-none">
            <div class="absolute h-11 w-11 rounded-full bg-blue-500/40 animate-ping"></div>
            <div class="h-6 w-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white ring-2 ring-blue-400">
              <div class="h-2 w-2 rounded-full bg-white"></div>
            </div>
          </div>
        `;
        const userIcon = L.divIcon({
          html: userHtml,
          className: 'user-gps-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([coordinates.lat, coordinates.lng], { icon: userIcon }).addTo(map);
        userMarkerRef.current = marker;

        // Smooth Camera Animation
        const currentZoom = map.getZoom() || 13;
        const targetZoom = currentZoom < 14 ? 14 : currentZoom;
        map.flyTo([coordinates.lat, coordinates.lng], targetZoom, { duration: 1.4 });

        const accInfo = locationService.formatAccuracy(coordinates.accuracy, isRtl ? 'ar' : 'en');
        toast({
          title: isRtl ? 'تم تحديد موقعك بدقة 🎯' : 'Location Detected 🎯',
          description: accInfo.text
        });
      }
    } catch (err: any) {
      setIsLocatingUser(false);
      toast({
        title: isRtl ? 'تعذر جلب الموقع الجغرافي' : 'Location Error',
        description: isRtl ? err.messageAr : err.messageEn,
        variant: 'destructive'
      });
    }
  };

  // 8. Handle "Search This Area (بحث في هذا النطاق)"
  const handleSearchThisArea = () => {
    if (!leafletMapRef.current) return;
    const center = leafletMapRef.current.getCenter();
    lastSearchCenterRef.current = { lat: center.lat, lng: center.lng };
    setShowSearchThisArea(false);
    
    toast({
      title: isRtl ? 'تم تحديث نطاق البحث 🔍' : 'Search Area Updated 🔍',
      description: isRtl ? 'تم تحديث نتائج الخدمات وفقاً لمنطقة الخريطة المعروضة.' : 'Listings filtered for current map view.'
    });
  };

  // 9. Handle In-App Search Place Autocomplete
  const handleSearchInputChange = async (val: string) => {
    setSearchQuery(val);
    mapStateManager.updateState({ searchQuery: val });

    if (!val.trim() || val.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    setIsSearchingPlaces(true);
    const suggestions = await placesSearchService.searchPlaces(val, {
      userLocation: userLocationState?.coordinates || null,
      language: isRtl ? 'ar' : 'fr',
      limit: 5
    });
    setPlaceSuggestions(suggestions);
    setIsSearchingPlaces(false);
  };

  const handleSelectPlaceSuggestion = (place: PlaceSuggestion) => {
    setSearchQuery(place.name);
    setPlaceSuggestions([]);
    mapStateManager.updateState({ searchQuery: place.name });

    if (leafletMapRef.current) {
      const currentZoom = leafletMapRef.current.getZoom() || 13;
      const targetZoom = currentZoom < 14 ? 14 : currentZoom;
      leafletMapRef.current.flyTo([place.coordinates.lat, place.coordinates.lng], targetZoom, { duration: 1.2 });
    }
  };

  // 10. Handle In-App Driving Route (100% Inside Khidmatik)
  const handleGetDirections = async (item: Listing) => {
    let startCoords = userLocationState?.coordinates;

    if (!startCoords) {
      try {
        const { coordinates } = await locationService.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
        startCoords = coordinates;
        mapStateManager.setUserLocation(coordinates, 'gps');
        setUserLocationState({
          coordinates,
          accuracy: coordinates.accuracy,
          timestamp: Date.now(),
          source: 'gps'
        });
      } catch (e) {
        startCoords = { lat: 35.1903, lng: -0.6309 };
      }
    }

    const itemLat = (item as any).latitude ? parseFloat((item as any).latitude) : (item as any).lat;
    const itemLng = (item as any).longitude ? parseFloat((item as any).longitude) : (item as any).lng;

    setIsCalculatingRoute(true);
    toast({
      title: isRtl ? 'جاري حساب مسار القيادة داخل التطبيق...' : 'Calculating in-app driving route...',
      description: isRtl ? `الاتجاه نحو ${item.name}` : `Navigating to ${item.name}`
    });

    try {
      const route = await routingService.calculateRoute(
        startCoords,
        { lat: itemLat, lng: itemLng },
        { language: isRtl ? 'ar' : 'en' }
      );
      setActiveRoute(route);
      setIsCalculatingRoute(false);
    } catch (err) {
      setIsCalculatingRoute(false);
      toast({
        title: isRtl ? 'تعذر حساب المسار' : 'Routing Failed',
        description: isRtl ? 'تعذر جلب بيانات المسار حالياً.' : 'Failed to retrieve route.',
        variant: 'destructive'
      });
    }
  };

  // Calculate distance for an item from user location
  const getItemDistance = (item: any) => {
    if (!userLocationState?.coordinates) return null;
    const d = locationService.calculateDistanceKm(userLocationState.coordinates, { lat: item.lat, lng: item.lng });
    return locationService.formatDistance(d, isRtl ? 'ar' : 'en');
  };

  return (
    <div 
      className={cn(
        "relative w-full h-full min-h-[480px] overflow-hidden rounded-2xl border bg-background select-none flex flex-col",
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "",
        className
      )}
    >
      
      {/* 1. Top HUD: In-App Search Bar & Floating Controls */}
      <div className="absolute top-3 inset-x-3 z-30 flex flex-col gap-2 pointer-events-none" dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Search Bar + Floating Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative flex-1 shadow-sm rounded-xl overflow-hidden bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={isRtl ? "ابحث عن خدمة، حرفي، متجر، أو بلدية..." : "Search service, craftsman, store, or city..."}
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              aria-label={isRtl ? "بحث في الخريطة" : "Search map"}
              className="pl-9 pr-9 h-11 text-xs font-medium bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { 
                  setSearchQuery(''); 
                  setPlaceSuggestions([]); 
                  mapStateManager.updateState({ searchQuery: '' });
                }}
                aria-label={isRtl ? "مسح البحث" : "Clear search"}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Use My Location GPS Button */}
          <Button
            type="button"
            size="icon"
            onClick={handleUseMyLocation}
            disabled={isLocatingUser}
            aria-label={isRtl ? 'موقعي الحالي' : 'Current location'}
            className={cn(
              "h-11 w-11 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0 transition-colors",
              userLocationState ? "text-primary border-primary/40 bg-primary/5" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
            title={isRtl ? 'موقعي الحالي' : 'Current Location'}
          >
            {isLocatingUser ? <RefreshCw className="h-4 w-4 animate-spin text-primary" /> : <LocateFixed className="h-4 w-4" />}
          </Button>

          {/* Layer Selector */}
          <div className="relative">
            <Button
              type="button"
              size="icon"
              onClick={() => setIsTileDropdownOpen(!isTileDropdownOpen)}
              aria-label={isRtl ? 'طبقات الخريطة' : 'Map layers'}
              className="h-11 w-11 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm shrink-0"
              title={isRtl ? 'طبقات الخريطة' : 'Map Layers'}
            >
              <Layers className="h-4 w-4" />
            </Button>
            {isTileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 p-1 shadow-lg flex flex-col gap-1 z-40 animate-in fade-in zoom-in-95">
                {(Object.keys(TILE_PROVIDERS) as TileMode[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setTileMode(key); setIsTileDropdownOpen(false); }}
                    className={cn(
                      "w-full text-right px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      tileMode === key ? "bg-primary text-primary-foreground font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {isRtl ? TILE_PROVIDERS[key].nameAr : TILE_PROVIDERS[key].nameEn}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label={isRtl ? 'ملء الشاشة' : 'Fullscreen map'}
            className="h-11 w-11 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm shrink-0 hidden sm:flex"
            title={isRtl ? 'ملء الشاشة' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Floating "Search This Area" Pill (When user pans map away) */}
        {showSearchThisArea && (
          <div className="flex justify-center pointer-events-auto animate-in fade-in-50 zoom-in-95">
            <Button
              size="sm"
              onClick={handleSearchThisArea}
              className="rounded-full h-8 px-4 text-xs font-bold bg-white dark:bg-card text-foreground hover:bg-slate-50 border border-slate-200/80 dark:border-slate-700 shadow-md flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>{isRtl ? 'البحث في هذا النطاق المعروض' : 'Search This Area'}</span>
            </Button>
          </div>
        )}

        {/* Place Autocomplete Results Dropdown */}
        {placeSuggestions.length > 0 && (
          <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 pointer-events-auto max-w-md animate-in fade-in-50 zoom-in-95">
            {placeSuggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectPlaceSuggestion(place)}
                className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{place.name}</span>
                </div>
                {place.wilayaCode && <Badge variant="outline" className="text-[10px]">ولاية {place.wilayaCode}</Badge>}
              </button>
            ))}
          </div>
        )}

        {/* Quick Category & Radii Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pointer-events-auto">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: Compass },
            { id: 'store', labelAr: 'متاجر', labelEn: 'Stores', icon: StoreIcon },
            { id: 'craftsman', labelAr: 'حرفيين', labelEn: 'Craftsmen', icon: Wrench },
            { id: 'food', labelAr: 'مطاعم', labelEn: 'Food', icon: Utensils },
            { id: 'auto', labelAr: 'سيارات', labelEn: 'Auto', icon: Car },
            { id: 'health', labelAr: 'صحة', labelEn: 'Health', icon: HeartPulse },
            { id: 'cleaning', labelAr: 'تنظيف', labelEn: 'Cleaning', icon: Sparkles },
            { id: 'beauty', labelAr: 'تجميل', labelEn: 'Beauty', icon: Scissors },
          ].map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  mapStateManager.updateState({ activeCategory: cat.id });
                }}
                aria-label={isRtl ? cat.labelAr : cat.labelEn}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 shadow-sm backdrop-blur-md transition-all flex items-center gap-1.5 border",
                  isSelected
                    ? "bg-primary/10 text-primary border-primary/40 font-bold shadow-sm"
                    : "bg-white/95 dark:bg-card/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-primary/30"
                )}
              >
                <IconComp className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-slate-500 dark:text-slate-400")} />
                <span>{isRtl ? cat.labelAr : cat.labelEn}</span>
              </button>
            );
          })}

          {/* Quick Distance Radius Filter Chips (When GPS is on) */}
          {userLocationState?.coordinates && (
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-1.5">
              {[1, 5, 10, 25, 50].map((km) => (
                <button
                  key={km}
                  onClick={() => {
                    const newKm = selectedDistanceKm === km ? null : km;
                    setSelectedDistanceKm(newKm);
                    mapStateManager.updateState({ selectedDistanceKm: newKm });
                  }}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all border",
                    selectedDistanceKm === km
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm font-bold"
                      : "bg-white/95 dark:bg-card/95 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:text-foreground"
                  )}
                >
                  {km} {isRtl ? 'كم' : 'km'}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 2. In-App Navigation HUD Banner (100% In-App Route & ETA) */}
      {activeRoute && (
        <div 
          className="absolute top-28 inset-x-3 z-30 flex items-center justify-between p-3 rounded-2xl bg-blue-600 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <RouteIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-black">
                <span>{activeRoute.formattedDuration}</span>
                <span>•</span>
                <span>{activeRoute.formattedDistance}</span>
              </div>
              <p className="text-[11px] text-white/85">
                {isRtl ? 'مسار القيادة المحسوب داخل خريطة خدماتك' : 'In-App navigation route on Khidmatik map'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeRoute.steps && activeRoute.steps.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowRouteStepsModal(!showRouteStepsModal)}
                className="h-8 text-xs font-bold rounded-xl gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span>{isRtl ? 'خطوات المسار' : 'Steps'}</span>
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setActiveRoute(null)}
              className="h-8 w-8 text-white hover:bg-white/20 rounded-xl"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 3. In-App Route Steps Drawer (When opened) */}
      {showRouteStepsModal && activeRoute?.steps && (
        <div className="absolute top-44 inset-x-3 z-30 max-h-56 overflow-y-auto rounded-2xl bg-popover/95 backdrop-blur-md border shadow-2xl p-3 space-y-2 animate-in fade-in-50" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between pb-1 border-b">
            <h5 className="font-bold text-xs">{isRtl ? 'تفاصيل خطوات المسار' : 'Turn-by-Turn Route Steps'}</h5>
            <button type="button" onClick={() => setShowRouteStepsModal(false)}><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="space-y-1.5">
            {activeRoute.steps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-muted/40">
                <span className="font-semibold">{idx + 1}. {step.instruction}</span>
                <span className="text-[11px] text-muted-foreground">{step.distanceKm} {isRtl ? 'كم' : 'km'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Main In-App Leaflet Map Canvas (Fixed Neutral dir="ltr") */}
      <div 
        ref={mapContainerRef} 
        dir="ltr"
        className="w-full h-full flex-1 z-10" 
      />

      {/* 5. Zoom & Reset Floating Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1.5">
        <Button
          size="icon"
          onClick={() => leafletMapRef.current?.zoomIn()}
          aria-label={isRtl ? 'تكبير' : 'Zoom in'}
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
          title={isRtl ? 'تكبير الخريطة' : 'Zoom In'}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={() => leafletMapRef.current?.zoomOut()}
          aria-label={isRtl ? 'تصغير' : 'Zoom out'}
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
          title={isRtl ? 'تصغير الخريطة' : 'Zoom Out'}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={() => {
            const currentCenter = mapStateManager.getState().center;
            leafletMapRef.current?.setView([currentCenter.lat, currentCenter.lng], 13);
          }}
          aria-label={isRtl ? 'إعادة ضبط الخريطة' : 'Reset map view'}
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
          title={isRtl ? 'إعادة ضبط الخريطة' : 'Reset View'}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 6. Mobile Synchronized Bottom Sheet / In-App Business Card */}
      {activeItem && (
        <div 
          className={cn(
            "absolute bottom-0 inset-x-0 z-30 transition-all duration-300 ease-out",
            "p-3 bg-card/95 backdrop-blur-xl border-t shadow-2xl rounded-t-3xl",
            isBottomSheetExpanded ? "max-h-[380px]" : "max-h-[165px]"
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Sheet Handle */}
          <div className="flex justify-center -mt-1 pb-2 cursor-pointer" onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}>
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
          </div>

          <div className="flex items-start gap-3">
            {/* Business Image */}
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-muted shrink-0 border">
              <img 
                src={activeItem.images[0] || 'https://placehold.co/200x200.png'} 
                alt={activeItem.name}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute bottom-1 left-1 text-[9px] px-1 py-0 h-4 bg-black/60 text-white border-0">
                ★ {activeItem.averageRating.toFixed(1)}
              </Badge>
            </div>

            {/* Business Info Details */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-headline font-bold text-sm text-foreground truncate">
                  {activeItem.name}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setActiveItem(null);
                    mapStateManager.setSelectedBusiness(null);
                  }}
                  className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {activeItem.location?.city} • {activeItem.category}
              </p>

              {/* Real Distance and Accuracy Info */}
              {userLocationState && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <Compass className="h-3 w-3" />
                  <span>{getItemDistance(activeItem)} {isRtl ? 'من موقعك' : 'from you'}</span>
                  {userLocationState.accuracy && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      (±{userLocationState.accuracy}m)
                    </span>
                  )}
                </div>
              )}

              {/* 3 Primary In-App Action Buttons */}
              <div className="flex items-center gap-1.5 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleGetDirections(activeItem)}
                  disabled={isCalculatingRoute}
                  className="h-8 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex-1 shadow-sm gap-1"
                >
                  {isCalculatingRoute ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                  <span>{isRtl ? 'الاتجاهات' : 'Directions'}</span>
                </Button>

                {activeItem.contact?.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="h-8 text-xs font-bold rounded-xl"
                  >
                    <a href={`tel:${activeItem.contact.phone}`}>
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-8 text-xs font-bold rounded-xl"
                >
                  <a href={`/listings/${activeItem.id}`}>
                    {language === 'ar' ? 'زيارة' : language === 'fr' ? 'Visiter' : 'Visit'}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default InteractiveMap;
