'use client';

import { useState, useEffect, useRef } from 'react';
import type { Listing } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Compass, Navigation, Eye, ZoomIn, ZoomOut, RotateCcw, 
  Map as MapIcon, Sliders, RefreshCw, Layers, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface InteractiveMapProps {
  listings: Listing[];
  onMarkerClick?: (listing: Listing) => void;
  selectedListing?: Listing | null;
}

// Sidi Bel Abbès coordinates as default center
const DEFAULT_LAT = 35.19;
const DEFAULT_LNG = -0.63;

export function InteractiveMap({ listings, onMarkerClick, selectedListing }: InteractiveMapProps) {
  const { language } = useLanguage();
  const [radius, setRadius] = useState<number>(15); // in km
  const [searchThisArea, setSearchThisArea] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [streetViewListing, setStreetViewListing] = useState<Listing | null>(null);
  const [streetViewRotation, setStreetViewRotation] = useState(0);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  // Leaflet CDN Integration states
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Generate coordinates for listings if they don't have any (mocking coords based on ID)
  const listingsWithCoords = listings.map((item, idx) => {
    const lat = (item as any).latitude 
      ? parseFloat((item as any).latitude) 
      : DEFAULT_LAT + (Math.sin(idx * 12.3) * 0.05);
    const lng = (item as any).longitude 
      ? parseFloat((item as any).longitude) 
      : DEFAULT_LNG + (Math.cos(idx * 8.7) * 0.06);

    return {
      ...item,
      lat,
      lng
    };
  });

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Filter listings by radius
  const filteredListings = listingsWithCoords.filter(item => {
    if (!userLocation) return true;
    const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
    return dist <= radius;
  });

  // Request user GPS location
  const handleGPSLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setMapCenter(coords);
        setZoomLevel(14);
      },
      (err) => {
        const mockCoords = { lat: DEFAULT_LAT + 0.015, lng: DEFAULT_LNG - 0.02 };
        setUserLocation(mockCoords);
        setMapCenter(mockCoords);
        setZoomLevel(13);
      }
    );
  };

  const handleOpenStreetView = (item: any) => {
    setStreetViewListing(item);
    setStreetViewRotation(0);
    setIsStreetViewOpen(true);
  };

  // Dynamically load Leaflet CDN Script and Stylesheets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    // Add stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Add Javascript script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    script.onerror = () => {
      console.warn("Leaflet script failed to load. Falling back to High-Fidelity SVG Map.");
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Leaflet map instance
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      leafletMapRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);

      // Update mapCenter state when user drags Leaflet map
      map.on('moveend', () => {
        const center = map.getCenter();
        setMapCenter({ lat: center.lat, lng: center.lng });
      });

      map.on('zoomend', () => {
        setZoomLevel(map.getZoom());
      });
    }
  }, [isLeafletLoaded]);

  // Sync center and zoom with Leaflet map
  useEffect(() => {
    if (leafletMapRef.current) {
      const map = leafletMapRef.current;
      const mapCenterCoords = map.getCenter();
      if (
        Math.abs(mapCenterCoords.lat - mapCenter.lat) > 0.0001 || 
        Math.abs(mapCenterCoords.lng - mapCenter.lng) > 0.0001
      ) {
        map.setView([mapCenter.lat, mapCenter.lng], zoomLevel);
      }
    }
  }, [mapCenter, zoomLevel]);

  // Synchronize Markers in Leaflet Layer Group
  useEffect(() => {
    if (!isLeafletLoaded || !leafletMapRef.current || !markersGroupRef.current) return;
    const L = (window as any).L;
    const group = markersGroupRef.current;

    // Clear old elements
    group.clearLayers();

    // Append listing markers
    filteredListings.forEach((item) => {
      const isSelected = selectedListing?.id === item.id;
      
      const pinColor = isSelected ? '#ef4444' : '#3b82f6';
      const markerHtml = `
        <div class="relative flex items-center justify-center transition-all duration-200 hover:scale-115">
          ${isSelected ? '<div class="absolute h-9 w-9 bg-red-500/30 rounded-full animate-ping"></div>' : ''}
          <div class="h-7 w-7 rounded-full bg-white shadow-lg flex items-center justify-center border-2" style="border-color: ${pinColor}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-4 w-4" style="color: ${pinColor}">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-map-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon })
        .on('click', () => {
          if (onMarkerClick) onMarkerClick(item);
        });

      // Bind clean preview popup
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 140px; padding: 2px;">
          <div style="font-weight: bold; color: #1e293b; margin-bottom: 2px;">${item.name}</div>
          <div style="color: #eab308; font-weight: bold; margin-bottom: 2px;">★ ${item.averageRating.toFixed(1)} (${item.pricing || '$$'})</div>
          <div style="color: #64748b; font-size: 10px; font-weight: 500;">${item.category}</div>
        </div>
      `);

      group.addLayer(marker);
    });

    // Append User Marker
    if (userLocation) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute h-8 w-8 bg-blue-500/20 rounded-full animate-pulse"></div>
          <div class="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-map-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(group);
    }
  }, [isLeafletLoaded, filteredListings, selectedListing, userLocation]);

  // Synchronize Leaflet radius circle
  useEffect(() => {
    if (!isLeafletLoaded || !leafletMapRef.current || !userLocation) return;
    const L = (window as any).L;
    const map = leafletMapRef.current;

    if ((window as any).leafletRadiusCircle) {
      map.removeLayer((window as any).leafletRadiusCircle);
    }

    const circle = L.circle([userLocation.lat, userLocation.lng], {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '5, 5',
      radius: radius * 1000
    }).addTo(map);

    (window as any).leafletRadiusCircle = circle;

    return () => {
      if ((window as any).leafletRadiusCircle) {
        map.removeLayer((window as any).leafletRadiusCircle);
      }
    };
  }, [isLeafletLoaded, userLocation, radius]);

  // Track selected listing center updates
  useEffect(() => {
    if (selectedListing) {
      const idx = listings.findIndex(l => l.id === selectedListing.id);
      if (idx !== -1) {
        const itemCoords = listingsWithCoords[idx];
        setMapCenter({ lat: itemCoords.lat, lng: itemCoords.lng });
        setZoomLevel(15);
      }
    }
  }, [selectedListing]);

  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const next = Math.min(18, prev + 1);
      if (leafletMapRef.current) leafletMapRef.current.setZoom(next);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(8, prev - 1);
      if (leafletMapRef.current) leafletMapRef.current.setZoom(next);
      return next;
    });
  };

  const handleResetMap = () => {
    setMapCenter({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    setZoomLevel(12);
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([DEFAULT_LAT, DEFAULT_LNG], 12);
    }
  };

  // Calculate coordinates mapping for the vector map SVG visualization (FALLBACK ONLY)
  const mapWidth = 500;
  const mapHeight = 400;
  
  const zoomFactor = Math.pow(1.5, zoomLevel - 12);
  const fallbackLatRange = 0.2 / zoomFactor;
  const fallbackLngRange = 0.2 / zoomFactor;

  const xScale = mapWidth / fallbackLngRange;
  const yScale = mapHeight / fallbackLatRange;

  const getXY = (lat: number, lng: number) => {
    const x = ((lng - (mapCenter.lng - fallbackLngRange / 2)) / fallbackLngRange) * mapWidth;
    const y = mapHeight - (((lat - (mapCenter.lat - fallbackLatRange / 2)) / fallbackLatRange) * mapHeight);
    return { x, y };
  };

  const userXY = userLocation ? getXY(userLocation.lat, userLocation.lng) : null;
  const isRtl = language === 'ar';

  // SVG Fallback elements coordinates
  const riverPoints = [
    { lat: DEFAULT_LAT - 0.15, lng: DEFAULT_LNG - 0.12 },
    { lat: DEFAULT_LAT - 0.08, lng: DEFAULT_LNG - 0.06 },
    { lat: DEFAULT_LAT, lng: DEFAULT_LNG - 0.015 },
    { lat: DEFAULT_LAT + 0.07, lng: DEFAULT_LNG + 0.04 },
    { lat: DEFAULT_LAT + 0.15, lng: DEFAULT_LNG + 0.12 },
  ].map(p => getXY(p.lat, p.lng));

  const park1Center = getXY(DEFAULT_LAT + 0.025, DEFAULT_LNG - 0.035);
  const park1W = 0.035 * xScale;
  const park1H = 0.025 * yScale;

  const park2Center = getXY(DEFAULT_LAT - 0.04, DEFAULT_LNG + 0.045);
  const park2W = 0.025 * xScale;
  const park2H = 0.02 * yScale;

  const lakeCenter = getXY(DEFAULT_LAT + 0.055, DEFAULT_LNG + 0.065);
  const lakeW = 0.04 * xScale;
  const lakeH = 0.03 * yScale;

  // Road lines
  const rdSouidaniStart = getXY(DEFAULT_LAT, DEFAULT_LNG - 0.15);
  const rdSouidaniEnd = getXY(DEFAULT_LAT, DEFAULT_LNG + 0.15);

  const rdRepubliqueStart = getXY(DEFAULT_LAT - 0.15, DEFAULT_LNG);
  const rdRepubliqueEnd = getXY(DEFAULT_LAT + 0.15, DEFAULT_LNG);

  const rdZabanaStart = getXY(DEFAULT_LAT - 0.1, DEFAULT_LNG - 0.1);
  const rdZabanaEnd = getXY(DEFAULT_LAT + 0.1, DEFAULT_LNG + 0.1);

  return (
    <div className="w-full h-full flex flex-col bg-card border rounded-2xl overflow-hidden shadow-lg relative min-h-[450px]">
      
      {/* Top Map Settings Overlay */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap gap-2 pointer-events-none">
        {/* Radius control */}
        <div className="bg-popover/90 backdrop-blur-md text-popover-foreground border px-3 py-2 rounded-xl shadow-md pointer-events-auto flex items-center gap-2 text-xs font-semibold select-none">
          <Sliders className="h-3.5 w-3.5 text-primary" />
          <span>{isRtl ? 'نصف القطر:' : 'Radius:'} {radius} km</span>
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={radius} 
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-24 accent-primary cursor-pointer h-1.5 rounded-full" 
          />
        </div>

        {/* GPS Finder */}
        <Button
          type="button"
          onClick={handleGPSLocation}
          className="bg-popover/90 hover:bg-popover backdrop-blur-md text-popover-foreground border rounded-xl shadow-md pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs font-semibold active:scale-95 transition-all"
        >
          <Compass className="h-3.5 w-3.5 text-primary" />
          {isRtl ? 'الموقع الحالي' : 'GPS Location'}
        </Button>
      </div>

      {/* Dynamic Search area check button overlay */}
      {searchThisArea && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              toast({ title: isRtl ? 'تم تحديث منطقة البحث' : 'Search boundaries updated', description: isRtl ? 'تم تحديث النتائج بناءً على إحداثيات الخريطة الحالية' : 'Results updated based on current map viewport.' });
            }}
            className="shadow-xl border rounded-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 font-semibold text-xs py-2 px-4 scale-100 hover:scale-105 active:scale-95 transition-all duration-150"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
            {isRtl ? 'البحث داخل هذه المنطقة' : 'Search This Area'}
          </Button>
        </div>
      )}

      {/* Map Controls Drawer */}
      <div className="absolute right-3 bottom-14 z-30 flex flex-col gap-1.5 pointer-events-auto">
        <button 
          onClick={handleZoomIn}
          className="p-2 rounded-xl border bg-popover/95 backdrop-blur-md text-popover-foreground hover:bg-muted shadow-md flex items-center justify-center transition-all"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 rounded-xl border bg-popover/95 backdrop-blur-md text-popover-foreground hover:bg-muted shadow-md flex items-center justify-center transition-all"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button 
          onClick={handleResetMap}
          className="p-2 rounded-xl border bg-popover/95 backdrop-blur-md text-popover-foreground hover:bg-muted shadow-md flex items-center justify-center transition-all"
          title="Reset Map Center"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Map Display area */}
      <div className="flex-1 w-full bg-[#f4f3f0] dark:bg-slate-900 relative overflow-hidden flex items-center justify-center border-b">
        {isLeafletLoaded ? (
          /* Real Leaflet OpenStreetMap Container */
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />
        ) : (
          /* Vector Interactive Map Fallback (Loaded instantly) */
          <svg className="absolute inset-0 w-full h-full select-none" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
            <defs>
              <radialGradient id="radiusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
              </radialGradient>
              
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Parks */}
            <rect 
              x={park1Center.x - park1W / 2} 
              y={park1Center.y - park1H / 2} 
              width={park1W} 
              height={park1H} 
              rx="8" 
              fill="rgba(34, 197, 94, 0.12)" 
              stroke="rgba(34, 197, 94, 0.25)" 
              strokeWidth="1.5" 
            />
            <text 
              x={park1Center.x} 
              y={park1Center.y} 
              fill="rgba(21, 128, 61, 0.45)" 
              fontSize="9" 
              fontWeight="bold" 
              textAnchor="middle"
            >
              {isRtl ? 'حديقة التسلية' : 'Central Park'}
            </text>

            <rect 
              x={park2Center.x - park2W / 2} 
              y={park2Center.y - park2H / 2} 
              width={park2W} 
              height={park2H} 
              rx="6" 
              fill="rgba(34, 197, 94, 0.12)" 
              stroke="rgba(34, 197, 94, 0.25)" 
              strokeWidth="1.5" 
            />

            {/* Lake */}
            <ellipse 
              cx={lakeCenter.x} 
              cy={lakeCenter.y} 
              rx={lakeW / 2} 
              ry={lakeH / 2} 
              fill="rgba(14, 165, 233, 0.16)" 
              stroke="rgba(14, 165, 233, 0.3)" 
              strokeWidth="1.5" 
            />
            <text 
              x={lakeCenter.x} 
              y={lakeCenter.y} 
              fill="rgba(3, 105, 161, 0.5)" 
              fontSize="9" 
              fontWeight="bold" 
              textAnchor="middle"
            >
              {isRtl ? 'بحيرة سيدي بلعباس' : 'Bel Abbès Lake'}
            </text>

            {/* Winding river path */}
            {riverPoints[0] && (
              <path 
                d={`M ${riverPoints[0].x} ${riverPoints[0].y} 
                    Q ${riverPoints[1].x} ${riverPoints[1].y}, ${riverPoints[2].x} ${riverPoints[2].y} 
                    T ${riverPoints[4].x} ${riverPoints[4].y}`} 
                fill="none" 
                stroke="rgba(14, 165, 233, 0.25)" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
            )}

            {/* Roads */}
            <line x1={rdSouidaniStart.x} y1={rdSouidaniStart.y} x2={rdSouidaniEnd.x} y2={rdSouidaniEnd.y} stroke="rgba(148,163,184,0.2)" strokeWidth="8" strokeLinecap="round" />
            <line x1={rdRepubliqueStart.x} y1={rdRepubliqueStart.y} x2={rdRepubliqueEnd.x} y2={rdRepubliqueEnd.y} stroke="rgba(148,163,184,0.2)" strokeWidth="8" strokeLinecap="round" />
            <line x1={rdZabanaStart.x} y1={rdZabanaStart.y} x2={rdZabanaEnd.x} y2={rdZabanaEnd.y} stroke="rgba(148,163,184,0.2)" strokeWidth="6" strokeLinecap="round" />

            <line x1={rdSouidaniStart.x} y1={rdSouidaniStart.y} x2={rdSouidaniEnd.x} y2={rdSouidaniEnd.y} stroke="white" strokeWidth="4" strokeLinecap="round" />
            <line x1={rdRepubliqueStart.x} y1={rdRepubliqueStart.y} x2={rdRepubliqueEnd.x} y2={rdRepubliqueEnd.y} stroke="white" strokeWidth="4" strokeLinecap="round" />
            <line x1={rdZabanaStart.x} y1={rdZabanaStart.y} x2={rdZabanaEnd.x} y2={rdZabanaEnd.y} stroke="white" strokeWidth="3" strokeLinecap="round" />

            <g transform={`translate(${(rdSouidaniStart.x + rdSouidaniEnd.x)/2 - 50}, ${rdSouidaniStart.y - 6})`}>
              <text fill="rgba(100, 116, 139, 0.45)" fontSize="7" fontWeight="bold" letterSpacing="1">
                BOULEVARD SOUIDANI
              </text>
            </g>

            {/* Search Radius */}
            {userXY && (
              <circle
                cx={userXY.x}
                cy={userXY.y}
                r={radius * (10 + (15 - zoomLevel) * 2)}
                fill="url(#radiusGlow)"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="transition-all duration-300"
              />
            )}

            {/* Directions Line */}
            {userXY && selectedListing && (
              (() => {
                const idx = listings.findIndex(l => l.id === selectedListing.id);
                if (idx !== -1) {
                  const targetCoords = listingsWithCoords[idx];
                  const targetXY = getXY(targetCoords.lat, targetCoords.lng);
                  return (
                    <>
                      <line 
                        x1={userXY.x} 
                        y1={userXY.y} 
                        x2={targetXY.x} 
                        y2={targetXY.y} 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="2" 
                        strokeDasharray="5 3" 
                        className="animate-pulse"
                      />
                      <path
                        d={`M ${userXY.x} ${userXY.y} L ${targetXY.x} ${targetXY.y}`}
                        fill="none"
                        stroke="rgba(16, 185, 129, 0.3)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    </>
                  );
                }
                return null;
              })()
            )}

            {/* Markers */}
            {filteredListings.map((item) => {
              const xy = getXY(item.lat, item.lng);
              const isSelected = selectedListing?.id === item.id;
              const isHovered = hoveredListingId === item.id;

              if (xy.x < 0 || xy.x > mapWidth || xy.y < 0 || xy.y > mapHeight) return null;

              return (
                <g 
                  key={item.id} 
                  transform={`translate(${xy.x}, ${xy.y})`} 
                  onClick={() => onMarkerClick && onMarkerClick(item)}
                  onMouseEnter={() => setHoveredListingId(item.id)}
                  onMouseLeave={() => setHoveredListingId(null)}
                  className="cursor-pointer group select-none"
                >
                  {isSelected && (
                    <circle r="20" fill="hsl(var(--primary))" className="animate-ping opacity-25" />
                  )}
                  <circle cy="3" r="8" fill="black" opacity="0.12" />
                  <path 
                    d="M0 -15 C-7 -15 -7 -7 0 0 C7 -7 7 -15 0 -15 Z" 
                    fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                    className="transition-all duration-200 group-hover:scale-110 origin-bottom"
                  />
                  <circle cy="-10" r="4" fill="white" />

                  {isHovered && (
                    <g transform="translate(0, -28)" className="pointer-events-none filter drop-shadow-md z-50">
                      <rect x="-70" y="-45" width="140" height="42" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                      <text x="-62" y="-32" fill="#0f172a" fontSize="8.5" fontWeight="bold" textAnchor="start">
                        {item.name.substring(0, 20)}
                      </text>
                      <text x="-62" y="-20" fill="#eab308" fontSize="8" fontWeight="bold" textAnchor="start">
                        ★ {item.averageRating.toFixed(1)} • {item.pricing || '$$'}
                      </text>
                      <text x="-62" y="-10" fill="#64748b" fontSize="7" fontWeight="medium" textAnchor="start">
                        {item.category}
                      </text>
                      <polygon points="-5,0 5,0 0,5" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                      <polygon points="-5,-0.5 5,-0.5 0,4.5" fill="white" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* User marker */}
            {userXY && (
              <g transform={`translate(${userXY.x}, ${userXY.y})`}>
                <circle r="12" fill="rgba(59, 130, 246, 0.25)" className="animate-pulse" />
                <circle r="6.5" fill="white" stroke="#3b82f6" strokeWidth="2" />
                <circle r="3" fill="#3b82f6" />
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Bottom Listing Snippet Panel */}
      {selectedListing && (
        <div className="bg-popover border-t p-3.5 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-250 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-foreground truncate">{selectedListing.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{selectedListing.location.fullAddress || selectedListing.location.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenStreetView(selectedListing)}
              className="text-xs font-semibold flex items-center gap-1"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
              {isRtl ? 'عرض الشارع' : 'Street View'}
            </Button>
            {selectedListing.contact.phone && (
              <Button
                type="button"
                variant="default"
                size="sm"
                asChild
                className="text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-1"
              >
                <a href={`tel:${selectedListing.contact.phone}`}>
                  <Navigation className="h-3.5 w-3.5" />
                  {isRtl ? 'اتصال' : 'Call'}
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Street View Simulation Modal */}
      {isStreetViewOpen && streetViewListing && (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col animate-in fade-in duration-300">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 text-white select-none">
            <div>
              <h3 className="font-headline font-bold text-base flex items-center gap-1.5">
                <Eye className="text-primary h-5 w-5" />
                {isRtl ? 'محاكاة عرض الشارع 360 درجة' : 'Simulated 360° Street View'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">{streetViewListing.name}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsStreetViewOpen(false)}
              className="text-slate-400 hover:text-white rounded-full hover:bg-slate-800 h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            <div 
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out select-none"
              style={{ 
                transform: `scale(1.2) rotateY(${streetViewRotation}deg)`, 
                perspective: '1000px'
              }}
            >
              <div className="w-[1200px] h-[600px] relative shrink-0 flex items-center justify-center gap-2">
                <img 
                  src={streetViewListing.images[0] || 'https://placehold.co/800x450.png'} 
                  alt="street view front" 
                  className="w-[400px] h-[300px] object-cover rounded-xl border border-slate-700 shadow-2xl" 
                />
                <img 
                  src={streetViewListing.images[1] || 'https://placehold.co/800x450.png'} 
                  alt="street view side" 
                  className="w-[400px] h-[300px] object-cover rounded-xl border border-slate-700 shadow-2xl" 
                />
                <img 
                  src={streetViewListing.images[2] || streetViewListing.images[0] || 'https://placehold.co/800x450.png'} 
                  alt="street view back" 
                  className="w-[400px] h-[300px] object-cover rounded-xl border border-slate-700 shadow-2xl" 
                />
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              <div className="self-center bg-slate-900/80 backdrop-blur-sm border border-slate-800 text-xs px-3 py-1.5 rounded-full text-slate-300 font-semibold select-none shadow-md">
                {isRtl ? 'اسحب الخريطة للتدوير 360°' : 'Use controls or drag image to rotate 360°'}
              </div>
              <div className="flex items-center justify-between text-slate-400 text-xs select-none">
                <span>W (270°)</span>
                <span className="text-white font-bold bg-primary/20 border border-primary/40 px-3 py-1 rounded-md">Compass: {Math.abs(streetViewRotation) % 360}°</span>
                <span>E (90°)</span>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10 pointer-events-auto bg-slate-900/90 border border-slate-800 py-2.5 px-6 rounded-full shadow-2xl">
              <button 
                onClick={() => setStreetViewRotation(prev => prev - 25)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
                title="Rotate Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-white font-headline text-sm font-semibold select-none">360° Pan Control</span>
              <button 
                onClick={() => setStreetViewRotation(prev => prev + 25)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
                title="Rotate Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-icons
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
}
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
}
