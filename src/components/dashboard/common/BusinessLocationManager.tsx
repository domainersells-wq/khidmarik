'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { BusinessLocationData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  MapPin, Compass, Search, Navigation, Save, Undo, RefreshCw, 
  Layers, Eye, EyeOff, Truck, Check, AlertCircle, Sparkles, 
  Building2, Globe, Sliders, X, Plus, Info, Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { algerianWilayas } from '@/data/algerian-wilayas';

interface BusinessLocationManagerProps {
  initialData?: Partial<BusinessLocationData>;
  businessName?: string;
  businessType?: 'store' | 'craftsman' | 'professional' | 'other';
  onSave?: (data: BusinessLocationData) => Promise<void> | void;
  className?: string;
}

// Default center: Sidi Bel Abbès
const DEFAULT_LAT = 35.1903;
const DEFAULT_LNG = -0.6309;

export function BusinessLocationManager({
  initialData,
  businessName = 'نشاطي التجاري',
  businessType = 'store',
  onSave,
  className
}: BusinessLocationManagerProps) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  // Location fields state
  const [latitude, setLatitude] = useState<number>(initialData?.latitude || DEFAULT_LAT);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude || DEFAULT_LNG);
  const [address, setAddress] = useState<string>(initialData?.address || '');
  const [city, setCity] = useState<string>(initialData?.city || 'سيدي بلعباس');
  const [wilaya, setWilaya] = useState<string>(initialData?.wilaya || 'سيدي بلعباس');
  const [wilayaCode, setWilayaCode] = useState<string>(initialData?.wilayaCode || '22');
  const [country, setCountry] = useState<string>(initialData?.country || 'الجزائر / Algeria');
  const [accuracy, setAccuracy] = useState<number | undefined>(initialData?.accuracy);
  
  // Public map visibility
  const [isLocationPublic, setIsLocationPublic] = useState<boolean>(
    initialData?.isLocationPublic !== undefined ? initialData.isLocationPublic : true
  );

  // Mobile Craftsman Service Area
  const [isMobileService, setIsMobileService] = useState<boolean>(
    initialData?.isMobileService !== undefined ? initialData.isMobileService : (businessType === 'craftsman')
  );
  const [serviceAreaRadius, setServiceAreaRadius] = useState<number>(initialData?.serviceAreaRadius || 25);
  const [serviceWilayas, setServiceWilayas] = useState<string[]>(
    initialData?.serviceWilayas || ['سيدي بلعباس']
  );

  // Search & Map states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; wilaya: string; code: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const serviceRadiusCircleRef = useRef<any>(null);
  const [leafletInstance, setLeafletInstance] = useState<any>(null);

  // Flattened searchable Algerian municipalities and wilayas
  const algerianPlaces = useMemo(() => {
    const places: Array<{ name: string; wilaya: string; code: string; lat: number; lng: number }> = [];
    
    algerianWilayas.forEach((w) => {
      // Estimate wilaya center or fallback
      const wilayaNum = parseInt(w.code) || 1;
      const wLat = 35.0 + (wilayaNum % 7) * 0.4 - 1.0;
      const wLng = 0.0 + (wilayaNum % 9) * 0.8 - 2.0;

      places.push({
        name: `ولاية ${w.name} (${w.name_en})`,
        wilaya: w.name,
        code: w.code,
        lat: w.code === '22' ? DEFAULT_LAT : (w.code === '16' ? 36.7538 : (w.code === '31' ? 35.6987 : wLat)),
        lng: w.code === '22' ? DEFAULT_LNG : (w.code === '16' ? 3.0588 : (w.code === '31' ? -0.6349 : wLng))
      });

      w.municipalities?.forEach((m, idx) => {
        places.push({
          name: `${m.name} - ${w.name}`,
          wilaya: w.name,
          code: w.code,
          lat: (w.code === '22' ? DEFAULT_LAT : wLat) + (idx * 0.008 - 0.04),
          lng: (w.code === '22' ? DEFAULT_LNG : wLng) + (idx * 0.008 - 0.04)
        });
      });
    });

    return places;
  }, []);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

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

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 14,
          zoomControl: false,
          attributionControl: false
        });

        // Add Tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          subdomains: 'abcd',
        }).addTo(map);

        // Custom draggable business marker
        const markerHtml = `
          <div class="relative flex flex-col items-center group cursor-grab active:cursor-grabbing select-none">
            <div class="absolute -top-2 -left-2 h-12 w-12 rounded-full animate-ping opacity-60 bg-red-500/40"></div>
            
            <div class="mb-0.5 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md bg-[#fe324d] text-white ring-2 ring-white whitespace-nowrap flex items-center gap-1">
              <span>📍</span>
              <span>موقع النشاط</span>
            </div>

            <div class="h-9 w-9 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white ring-2 ring-[#fe324d] bg-[#fe324d]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            
            <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#fe324d] -mt-[1px]"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'business-draggable-marker',
          iconSize: [48, 64],
          iconAnchor: [24, 60]
        });

        const marker = L.marker([latitude, longitude], {
          icon: customIcon,
          draggable: true
        }).addTo(map);

        // Marker drag events
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setLatitude(parseFloat(pos.lat.toFixed(6)));
          setLongitude(parseFloat(pos.lng.toFixed(6)));
          toast({
            title: isRtl ? 'تم تحديث الإحداثيات' : 'Coordinates Updated',
            description: `Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)}`
          });
        });

        // Click anywhere on map to reposition marker
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setLatitude(parseFloat(lat.toFixed(6)));
          setLongitude(parseFloat(lng.toFixed(6)));
          map.panTo([lat, lng]);
        });

        leafletMapRef.current = map;
        markerRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);

      } catch (err) {
        console.error('Error initializing business location map:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 2. Synchronize Service Radius Circle
  useEffect(() => {
    if (!leafletInstance || !leafletMapRef.current) return;
    const L = leafletInstance;
    const map = leafletMapRef.current;

    if (serviceRadiusCircleRef.current) {
      map.removeLayer(serviceRadiusCircleRef.current);
      serviceRadiusCircleRef.current = null;
    }

    if (isMobileService && serviceAreaRadius > 0) {
      const circle = L.circle([latitude, longitude], {
        color: '#0284c7',
        fillColor: '#0284c7',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6',
        radius: serviceAreaRadius * 1000
      }).addTo(map);

      serviceRadiusCircleRef.current = circle;
    }
  }, [leafletInstance, isMobileService, serviceAreaRadius, latitude, longitude]);

  // 3. Option 1: Use Current GPS Location
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast({
        title: isRtl ? 'الموقع غير مدعوم' : 'Geolocation Not Supported',
        description: isRtl ? 'متصفحك لا يدعم جلب الموقع الجغرافي' : 'Browser does not support GPS.',
        variant: 'destructive'
      });
      return;
    }

    setIsLocatingGPS(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(acc);
        setIsLocatingGPS(false);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }

        toast({
          title: isRtl ? 'تم تعيين موقع النشاط من GPS 📍' : 'Location Set from GPS 📍',
          description: isRtl ? `تم جلب الإحداثيات بدقة (${acc} متر)` : `Coordinates captured with ${acc}m accuracy.`
        });
      },
      (err) => {
        setIsLocatingGPS(false);
        toast({
          title: isRtl ? 'تعذر جلب موقع GPS' : 'GPS Access Failed',
          description: isRtl ? 'يرجى التحقق من إذن الوصول للموقع في المتصفح.' : 'Please allow location permission.',
          variant: 'destructive'
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 4. Option 3: Search Address / Place in Algeria
  const handleSearchQueryChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    const query = val.toLowerCase().trim();
    const matches = algerianPlaces.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.wilaya.toLowerCase().includes(query)
    ).slice(0, 6);

    setSearchResults(matches);
  };

  const handleSelectSearchResult = (item: { name: string; wilaya: string; code: string; lat: number; lng: number }) => {
    setLatitude(item.lat);
    setLongitude(item.lng);
    setCity(item.name.split('-')[0].trim());
    setWilaya(item.wilaya);
    setWilayaCode(item.code);
    setSearchQuery(item.name);
    setSearchResults([]);

    if (markerRef.current) {
      markerRef.current.setLatLng([item.lat, item.lng]);
    }
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([item.lat, item.lng], 14, { duration: 1.2 });
    }

    toast({
      title: isRtl ? 'تم تحديد المكان 🎯' : 'Place Selected 🎯',
      description: item.name
    });
  };

  // 5. Add / Remove Service Wilayas for Mobile Craftsmen
  const handleAddServiceWilaya = (wilayaName: string) => {
    if (!serviceWilayas.includes(wilayaName)) {
      setServiceWilayas([...serviceWilayas, wilayaName]);
    }
  };

  const handleRemoveServiceWilaya = (wilayaName: string) => {
    setServiceWilayas(serviceWilayas.filter(w => w !== wilayaName));
  };

  // 6. Save Location Action
  const handleSaveLocation = async () => {
    setIsSaving(true);
    const locationData: BusinessLocationData = {
      latitude,
      longitude,
      address: address.trim() || `${city} - ولاية ${wilaya}`,
      city: city.trim() || 'سيدي بلعباس',
      wilaya: wilaya.trim() || 'سيدي بلعباس',
      wilayaCode,
      country: 'الجزائر / Algeria',
      accuracy,
      isLocationPublic,
      isMobileService,
      serviceAreaRadius: isMobileService ? serviceAreaRadius : undefined,
      serviceWilayas: isMobileService ? serviceWilayas : undefined,
      updated_at: new Date().toISOString()
    };

    try {
      if (onSave) {
        await onSave(locationData);
      }
      toast({
        title: isRtl ? 'تم حفظ موقع النشاط بنجاح ✅' : 'Business Location Saved ✅',
        description: isRtl ? 'تم تحديث الموقع الجغرافي ونطاق التغطية.' : 'Location & service area updated successfully.'
      });
    } catch (err: any) {
      toast({
        title: isRtl ? 'حدث خطأ أثناء الحفظ' : 'Save Failed',
        description: err?.message || 'Error saving location.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("space-y-6 select-none", className)} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-foreground">
              {isRtl ? 'إدارة الموقع الجغرافي ونطاق الخدمة' : 'Business Location & Service Area'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isRtl 
                ? `حدد موقع ${businessName} بدقة عبر الخريطة والـ GPS أو اضبط نطاق تغطية الخدمة المتنقلة.` 
                : `Define exact business location, GPS coordinates, or mobile service coverage radius.`}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSaveLocation}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 px-5 rounded-xl shadow-md shrink-0 gap-2"
        >
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isRtl ? 'حفظ التغييرات' : 'Save Location'}</span>
        </Button>
      </div>

      {/* Main Grid: Interactive Map + Location Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Top: Interactive Selection Map (8 Cols) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
          
          <Card className="rounded-2xl border overflow-hidden shadow-md">
            <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Move className="h-4 w-4 text-primary" />
                  <span>{isRtl ? 'الخريطة التفاعلية لتحديد الموقع' : 'Interactive Location Pin Map'}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? 'اسحب الدبوس أو انقر في أي مكان على الخريطة لتعديل الموقع الدقيق' : 'Drag the marker or click anywhere on the map to adjust.'}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocatingGPS}
                  className="rounded-xl h-8 text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  {isLocatingGPS ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Compass className="h-3.5 w-3.5" />}
                  <span>{isRtl ? 'موقعي الحالي (GPS)' : 'Use GPS'}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative">
              {/* Search Bar Overlay on Top of Map */}
              <div className="absolute top-3 inset-x-3 z-30 flex flex-col gap-1 max-w-md">
                <div className="relative shadow-lg rounded-full overflow-hidden bg-background/95 backdrop-blur-md border border-border">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={isRtl ? "ابحث عن بلدية أو ولاية في الجزائر..." : "Search Algerian city, wilaya, or place..."}
                    value={searchQuery}
                    onChange={(e) => handleSearchQueryChange(e.target.value)}
                    className="pl-9 pr-9 h-10 text-xs font-semibold bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Auto-suggest search dropdown */}
                {searchResults.length > 0 && (
                  <div className="bg-popover/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in fade-in-50 zoom-in-95">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold hover:bg-muted flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{item.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">ولاية {item.code}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Leaflet Map Canvas */}
              <div className="h-[380px] w-full relative bg-slate-100 dark:bg-slate-900">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>

              {/* Coordinates & Accuracy Status HUD */}
              <div className="p-3 bg-card border-t flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono">
                    Lat: <strong className="text-foreground">{latitude}</strong>
                  </span>
                  <span className="text-muted-foreground font-mono">
                    Lng: <strong className="text-foreground">{longitude}</strong>
                  </span>
                </div>

                {accuracy && (
                  <Badge variant="secondary" className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 gap-1">
                    <Compass className="h-3 w-3" />
                    <span>{isRtl ? `دقة GPS: ±${accuracy} متر` : `GPS Accuracy: ±${accuracy}m`}</span>
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visibility & Mobile Service Area Card */}
          <Card className="rounded-2xl border shadow-md">
            <CardHeader className="p-4 pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span>{isRtl ? 'إعدادات الخصوصية ونطاق الخدمة' : 'Privacy & Service Coverage Area'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              
              {/* 1. Public Map Visibility Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="font-bold text-xs flex items-center gap-1.5">
                    {isLocationPublic ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span>{isRtl ? 'إظهار الموقع على الخريطة العامة للزبائن' : 'Show Location on Public Map'}</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isRtl 
                      ? 'عند التفعيل، يظهر دبوس المحل وعنوانه الدقيق لكافة الزبائن على خريطة خدماتك.' 
                      : 'When enabled, your exact business pin and address are visible to public users.'}
                  </p>
                </div>
                <Switch 
                  checked={isLocationPublic}
                  onCheckedChange={setIsLocationPublic}
                />
              </div>

              {/* 2. Mobile Craftsman / Service Area Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="font-bold text-xs flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-blue-600" />
                    <span>{isRtl ? 'خدمة متنقلة / التنقل لمقر الزبون (Mobile Service)' : 'Mobile Craftsman (On-Site Service)'}</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isRtl 
                      ? 'مخصص للحرفيين والفنيين الذين يقدمون خدماتهم في منازل ومواقع الزبائن.' 
                      : 'For craftsmen & technicians traveling to customer locations.'}
                  </p>
                </div>
                <Switch 
                  checked={isMobileService}
                  onCheckedChange={setIsMobileService}
                />
              </div>

              {/* Service Area Controls (Shown if Mobile Service is ON) */}
              {isMobileService && (
                <div className="space-y-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-blue-600" />
                      <span>{isRtl ? 'نصف قطر التغطية المباشرة:' : 'Direct Coverage Radius:'}</span>
                      <strong className="text-primary">{serviceAreaRadius} {isRtl ? 'كم' : 'km'}</strong>
                    </Label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                      {serviceAreaRadius * 2} km {isRtl ? 'قطر النطاق' : 'Diameter'}
                    </span>
                  </div>

                  <input 
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={serviceAreaRadius}
                    onChange={(e) => setServiceAreaRadius(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-blue-200 dark:bg-blue-900 rounded-lg"
                  />

                  {/* Covered Wilayas List */}
                  <div className="space-y-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                    <Label className="font-bold text-xs text-blue-950 dark:text-blue-200">
                      {isRtl ? 'الولايات والمناطق المشمولة بالخدمة:' : 'Covered Wilayas & Areas:'}
                    </Label>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {serviceWilayas.map((w) => (
                        <Badge 
                          key={w} 
                          variant="secondary"
                          className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs"
                        >
                          <span>{w}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceWilaya(w)}
                            className="hover:bg-blue-700 rounded-full h-3.5 w-3.5 flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {/* Quick Wilaya Selector Chips */}
                    <div className="pt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-muted-foreground font-semibold">{isRtl ? 'إضافة ولايات قريبة:' : 'Add nearby wilayas:'}</span>
                      {['سيدي بلعباس', 'وهران', 'معسكر', 'تلمسان', 'عين تموشنت', 'مستغانم', 'الجزائر العاصمة'].map((wName) => {
                        if (serviceWilayas.includes(wName)) return null;
                        return (
                          <button
                            key={wName}
                            type="button"
                            onClick={() => handleAddServiceWilaya(wName)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold border hover:border-blue-500 hover:text-blue-600 bg-background transition-colors flex items-center gap-0.5"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            <span>{wName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Right / Bottom: Address Details Form & Live Public Card Preview (4 Cols) */}
        <div className="col-span-1 lg:col-span-4 space-y-5">
          
          {/* Address Details Form */}
          <Card className="rounded-2xl border shadow-md">
            <CardHeader className="p-4 pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{isRtl ? 'بيانات العنوان التفصيلي' : 'Address Details'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              
              <div>
                <Label htmlFor="wilaya-select" className="text-xs font-bold">{isRtl ? 'الولاية' : 'Wilaya'}</Label>
                <select
                  id="wilaya-select"
                  value={wilayaCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setWilayaCode(code);
                    const selectedW = algerianWilayas.find(w => w.code === code);
                    if (selectedW) {
                      setWilaya(selectedW.name);
                      if (selectedW.municipalities && selectedW.municipalities[0]) {
                        setCity(selectedW.municipalities[0].name);
                      }
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold shadow-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  {algerianWilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.name} ({w.name_en})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="city-input" className="text-xs font-bold">{isRtl ? 'البلدية / المدينة' : 'City / Municipality'}</Label>
                <Input
                  id="city-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: سيدي بلعباس وسط"
                  className="mt-1 h-9 text-xs font-semibold rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="address-input" className="text-xs font-bold">{isRtl ? 'العنوان / الشارع والرقم' : 'Street Address'}</Label>
                <Input
                  id="address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: شارع هواري بومدين، عمارة 14"
                  className="mt-1 h-9 text-xs font-semibold rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="country-input" className="text-xs font-bold">{isRtl ? 'الدولة' : 'Country'}</Label>
                <Input
                  id="country-input"
                  value={country}
                  disabled
                  className="mt-1 h-9 text-xs font-semibold rounded-xl bg-muted"
                />
              </div>

              <div className="pt-2 border-t space-y-2">
                <Button
                  type="button"
                  onClick={handleSaveLocation}
                  disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl shadow-md gap-2"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>{isRtl ? 'حفظ وتأكيد موقع النشاط' : 'Confirm & Save Location'}</span>
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Live Public Map Preview Card */}
          <Card className="rounded-2xl border shadow-md overflow-hidden bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="p-4 pb-2 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{isRtl ? 'معاينة الظهور العام للزبائن' : 'Public Map Live Preview'}</span>
                </CardTitle>
                <Badge variant={isLocationPublic ? "default" : "secondary"} className="text-[10px]">
                  {isLocationPublic ? (isRtl ? 'مرئي للعامة' : 'Public') : (isRtl ? 'مخفي' : 'Hidden')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground truncate">{businessName}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {address || `${city} - ولاية ${wilaya}`}
                  </p>
                </div>
              </div>

              {isMobileService && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>{isRtl ? `تغطية متنقلة: ${serviceAreaRadius} كم • ${serviceWilayas.length} ولايات` : `Mobile coverage: ${serviceAreaRadius}km • ${serviceWilayas.length} wilayas`}</span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}

export default BusinessLocationManager;
