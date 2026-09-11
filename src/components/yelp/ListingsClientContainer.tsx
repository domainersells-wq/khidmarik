'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Listing, Store, Professional } from '@/types';
import { ListingCard } from '@/components/listings/ListingCard';
import { AdvancedSearchBar } from './AdvancedSearchBar';
import { InteractiveMap } from './InteractiveMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  SlidersHorizontal, Map as MapIcon, List as ListIcon, 
  MapPin, Phone, ExternalLink, Heart, Star, AlertTriangle,
  MessageSquare, Compass, Check, AlertOctagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { yelpService } from '@/services/yelpService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ListingsClientContainerProps {
  initialListings: Listing[];
  initialParams: {
    q?: string;
    category?: string;
    location?: string;
    neighborhood?: string;
    type?: 'store' | 'professional' | '';
  };
}

export function ListingsClientContainer({ initialListings, initialParams }: ListingsClientContainerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [listings, setListings] = useState<Listing[]>(initialListings);
  
  // Sync state with server props when navigation triggers filters
  useEffect(() => {
    setListings(initialListings);
  }, [initialListings]);

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'split' | 'map' | 'list'>('split');

  // Geolocation & Nearest sort state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(false);

  // Yelp advanced filters
  const [openNow, setOpenNow] = useState(false);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(50); // in km
  
  // Specific features filters
  const [features, setFeatures] = useState({
    wifi: false,
    parking: false,
    card: false,
    kidFriendly: false,
    accessible: false,
    delivery: false
  });

  // Load saved listing IDs for active user
  useEffect(() => {
    if (user?.id) {
      yelpService.getSavedListings(user.id).then(res => {
        setSavedIds(res.map(r => r.id));
      });
    }
  }, [user]);

  // Adjust display view on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCurrentView('list');
      } else {
        setCurrentView('split');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePrice = (price: string) => {
    setSelectedPrices(prev => 
      prev.includes(price) ? prev.filter(p => p !== price) : [...prev, price]
    );
  };

  const toggleFavorite = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required',
        description: language === 'ar' ? 'يرجى تسجيل الدخول لحفظ الأنشطة المفضلة' : 'Please log in to save listings to your favorites.',
        variant: "destructive"
      });
      return;
    }

    const isSaved = savedIds.includes(listingId);
    if (isSaved) {
      const ok = await yelpService.unsaveListing(user.id, listingId);
      if (ok) {
        setSavedIds(prev => prev.filter(id => id !== listingId));
        toast({ title: language === 'ar' ? 'تم الحذف من المفضلة' : 'Removed from Favorites' });
      }
    } else {
      const ok = await yelpService.saveListing(user.id, listingId);
      if (ok) {
        setSavedIds(prev => [...prev, listingId]);
        toast({ title: language === 'ar' ? 'تمت الإضافة للمفضلة' : 'Added to Favorites' });
      }
    }
  };

  // Mock Open/Closed hours status check
  const getOpenStatus = (operatingHours?: string) => {
    if (!operatingHours) return { isOpen: true, timeMsg: "Open 24/7" };
    // Simulated check: if includes hours, verify current local time
    const now = new Date();
    const hour = now.getHours();
    
    if (operatingHours.toLowerCase().includes("closed")) {
      return { isOpen: false, timeMsg: "Closed Today" };
    }
    
    // Default open from 08:00 to 18:00
    const isOpen = hour >= 8 && hour < 19;
    return { 
      isOpen, 
      timeMsg: isOpen ? "Open until 7:00 PM" : "Closed now (Opens at 8:00 AM)" 
    };
  };

  // Additional Quick Filters
  const [onlyMadeInAlgeria, setOnlyMadeInAlgeria] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Active filters count
  const activeFiltersCount = 
    (openNow ? 1 : 0) + 
    (minRating > 0 ? 1 : 0) + 
    selectedPrices.length + 
    (onlyMadeInAlgeria ? 1 : 0) + 
    (onlyVerified ? 1 : 0) +
    Object.values(features).filter(Boolean).length;

  // Haversine Distance helper
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Explicit User Geolocation Handler
  const handleRequestUserLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast({
        title: isRtl ? 'الموقع غير مدعوم' : 'Geolocation Not Supported',
        description: isRtl ? 'متصفحك لا يدعم خاصية تحديد الموقع الجغرافي.' : 'Geolocation is not supported by your browser.',
        variant: 'destructive'
      });
      return;
    }

    setIsLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setIsLocatingUser(false);
        setSortByNearest(true);

        toast({
          title: isRtl ? 'تم تحديد موقعك وترتيب النتائج بالأقرب 🎯' : 'Location Detected & Sorted by Nearest 🎯',
          description: isRtl ? 'تم ترتيب كافة الخدمات والمتاجر حسب المسافة من موقعك.' : 'All listings are now sorted by distance.'
        });
      },
      (err) => {
        setIsLocatingUser(false);
        let errorTitle = isRtl ? 'فشل تحديد الموقع' : 'Location Detection Failed';
        let errorMessage = '';

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorTitle = isRtl ? 'تم رفض إذن الموقع' : 'Permission Denied';
            errorMessage = isRtl 
              ? 'تم رفض إذن الوصول إلى الموقع. يرجى تفعيل إذن الموقع في إعدادات المتصفح للاستفادة من حساب المسافات.' 
              : 'Location permission was denied in your browser settings.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorTitle = isRtl ? 'الموقع غير متوفر' : 'Location Unavailable';
            errorMessage = isRtl 
              ? 'معلومات الموقع الجغرافي غير متوفرة حالياً. يرجى التحقق من اتصال GPS أو الشبكة.' 
              : 'Location information is currently unavailable.';
            break;
          case err.TIMEOUT:
            errorTitle = isRtl ? 'انتهت مهلة الطلب' : 'Request Timeout';
            errorMessage = isRtl 
              ? 'انتهت مهلة طلب تحديد الموقع. يرجى المحاولة مجدداً.' 
              : 'The location request timed out. Please try again.';
            break;
          default:
            errorMessage = isRtl ? 'حدث خطأ أثناء جلب موقعك.' : 'An error occurred while detecting location.';
            break;
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const resetAllFilters = () => {
    setOpenNow(false);
    setMinRating(0);
    setSelectedPrices([]);
    setOnlyMadeInAlgeria(false);
    setOnlyVerified(false);
    setSortByNearest(false);
    setFeatures({
      wifi: false,
      parking: false,
      card: false,
      kidFriendly: false,
      accessible: false,
      delivery: false
    });
    toast({
      title: isRtl ? 'تمت إعادة ضبط الفلاتر' : 'Filters Reset',
      description: isRtl ? 'تم عرض جميع الأنشطة المتاحة.' : 'Showing all available listings.'
    });
  };

  // Filter & Sort listings client-side
  const filteredListings = listings.filter(item => {
    // 1. Open Now Filter
    if (openNow) {
      const status = getOpenStatus(item.operatingHours);
      if (!status.isOpen) return false;
    }

    // 2. Price filter
    if (selectedPrices.length > 0 && item.pricing) {
      if (!selectedPrices.includes(item.pricing)) return false;
    }

    // 3. Rating filter
    if (item.averageRating < minRating) return false;

    // 4. Made in Algeria filter
    if (onlyMadeInAlgeria) {
      if (!(item as Store).isMadeInAlgeria) return false;
    }

    // 5. Verified filter
    if (onlyVerified) {
      const isItemVerified = (item as any).isVerified || ((item as any).verifiedBadges && (item as any).verifiedBadges.length > 0);
      if (!isItemVerified) return false;
    }

    // 6. Features filter
    const storeFeatures = (item as any).features || {
      wifi: false,
      parking: false,
      accepts_card: false,
      kid_friendly: false,
      accessible: false,
      delivery: false
    };

    if (features.wifi && !storeFeatures.wifi) return false;
    if (features.parking && !storeFeatures.parking) return false;
    if (features.card && !storeFeatures.accepts_card) return false;
    if (features.kidFriendly && !storeFeatures.kid_friendly) return false;
    if (features.accessible && !storeFeatures.accessible) return false;
    if (features.delivery && !storeFeatures.delivery) return false;

    return true;
  }).sort((a, b) => {
    if (sortByNearest && userLocation) {
      const latA = (a as any).latitude ? parseFloat((a as any).latitude) : 35.1903;
      const lngA = (a as any).longitude ? parseFloat((a as any).longitude) : -0.6309;
      const latB = (b as any).latitude ? parseFloat((b as any).latitude) : 35.1903;
      const lngB = (b as any).longitude ? parseFloat((b as any).longitude) : -0.6309;
      const distA = calculateDistance(userLocation.lat, userLocation.lng, latA, lngA);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, latB, lngB);
      return distA - distB;
    }
    return 0;
  });

  const handleShareWhatsApp = (item: Listing) => {
    const text = encodeURIComponent(`Check out ${item.name} on Khidmatik! Contact: ${item.contact.phone || 'N/A'}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const isRtl = language === 'ar';

  return (
    <div className="space-y-6">
      
      {/* Dynamic Advanced Search Engine component */}
      <AdvancedSearchBar />

      {/* Emergency SOS Craftsman Banner (Shown on services view) */}
      {(!initialParams.type || initialParams.type === 'professional') && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertOctagon className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {isRtl ? '🚨 هل لديك حالة طوارئ منزلية؟ (تسرب مياه، ماس كهربائي، قفل باب...)' : '🚨 Need an Emergency Craftsman / Handyman 24/7?'}
              </h4>
              <p className="text-xs text-white/85">
                {isRtl ? 'بث فوري لأقرب الحرفيين المعتمدين في محيطك مع ضمان تسعير شفاف ووصول سريع' : 'Instant on-demand dispatch with transparent pricing & verified pros'}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            asChild 
            className="bg-white text-red-600 hover:bg-white/90 font-black text-xs h-9 px-4 rounded-xl shadow-md shrink-0 w-full sm:w-auto"
          >
            <Link href="/craftsmen-dispatch">
              {isRtl ? 'طلب نداء طوارئ فوري (SOS)' : 'Launch SOS Request'}
            </Link>
          </Button>
        </div>
      )}

      {/* Modern High-End Quick Filters Control Bar */}
      <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-3.5 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Quick Badges Filters Cluster */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. Open Now Filter Pill with Live Pulse Dot */}
            <Button
              variant={openNow ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOpenNow(!openNow)}
              className={cn(
                "rounded-full text-xs font-semibold px-3.5 py-1.5 h-9 transition-all duration-200 shadow-2xs gap-2",
                openNow 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30" 
                  : "hover:border-emerald-500/60 hover:text-emerald-700 dark:hover:text-emerald-400 bg-background"
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  openNow ? "bg-white" : "bg-emerald-500"
                )} />
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  openNow ? "bg-white" : "bg-emerald-500"
                )} />
              </span>
              <span>{isRtl ? 'مفتوح الآن' : 'Open Now'}</span>
            </Button>

            {/* 2. Rating Filters Pills */}
            <div className="inline-flex items-center p-0.5 rounded-full border bg-muted/40 gap-1">
              {[
                { stars: 4.5, labelAr: '4.5+ ممتاز', labelEn: '4.5+ Top' },
                { stars: 4.0, labelAr: '4.0+ جيد جداً', labelEn: '4.0+ Great' },
                { stars: 3.5, labelAr: '3.5+', labelEn: '3.5+' }
              ].map(ratingItem => {
                const isSelected = minRating === ratingItem.stars;
                return (
                  <button
                    key={ratingItem.stars}
                    type="button"
                    onClick={() => setMinRating(isSelected ? 0 : ratingItem.stars)}
                    className={cn(
                      "rounded-full text-xs font-bold px-3 py-1.5 h-8 flex items-center gap-1.5 transition-all duration-200",
                      isSelected 
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30" 
                        : "hover:bg-background text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <Star className={cn("h-3.5 w-3.5", isSelected ? "fill-white text-white" : "fill-amber-400 text-amber-400")} />
                    <span>{isRtl ? ratingItem.labelAr : ratingItem.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. Pricing Segmented Badges */}
            <div className="inline-flex items-center p-0.5 rounded-full border bg-muted/40 gap-0.5">
              {[
                { symbol: '$', titleAr: 'اقتصادي', titleEn: 'Budget' },
                { symbol: '$$', titleAr: 'متوسط', titleEn: 'Moderate' },
                { symbol: '$$$', titleAr: 'راقي', titleEn: 'Upscale' },
                { symbol: '$$$$', titleAr: 'فاخر', titleEn: 'Luxury' }
              ].map(tier => {
                const active = selectedPrices.includes(tier.symbol);
                return (
                  <button
                    key={tier.symbol}
                    type="button"
                    onClick={() => togglePrice(tier.symbol)}
                    title={`${tier.symbol} (${isRtl ? tier.titleAr : tier.titleEn})`}
                    className={cn(
                      "rounded-full text-xs font-black px-2.5 py-1.5 h-8 min-w-[32px] transition-all duration-200",
                      active 
                        ? "bg-primary text-primary-foreground shadow-xs" 
                        : "hover:bg-background text-slate-700 dark:text-slate-300 font-mono"
                    )}
                  >
                    {tier.symbol}
                  </button>
                );
              })}
            </div>

            {/* 4. Made in Algeria Pill */}
            <Button
              variant={onlyMadeInAlgeria ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyMadeInAlgeria(!onlyMadeInAlgeria)}
              className={cn(
                "rounded-full text-xs font-semibold px-3 py-1.5 h-9 transition-all duration-200 gap-1.5",
                onlyMadeInAlgeria 
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/25" 
                  : "bg-background hover:border-emerald-600/50"
              )}
            >
              <span>🇩🇿</span>
              <span>{isRtl ? 'صنع في الجزائر' : 'Made in Algeria'}</span>
            </Button>

            {/* 5. Verified Only Pill */}
            <Button
              variant={onlyVerified ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={cn(
                "rounded-full text-xs font-semibold px-3 py-1.5 h-9 transition-all duration-200 gap-1.5",
                onlyVerified 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25" 
                  : "bg-background hover:border-blue-500/50"
              )}
            >
              <Check className="h-3.5 w-3.5 text-blue-500 stroke-[3]" />
              <span>{isRtl ? 'موثّق فقط' : 'Verified Only'}</span>
            </Button>

            {/* 6. Nearest to My Location Pill */}
            <Button
              variant={sortByNearest ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (!userLocation && !sortByNearest) {
                  handleRequestUserLocation();
                } else {
                  setSortByNearest(!sortByNearest);
                }
              }}
              disabled={isLocatingUser}
              className={cn(
                "rounded-full text-xs font-semibold px-3 py-1.5 h-9 transition-all duration-200 gap-1.5",
                sortByNearest 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40" 
                  : "bg-background hover:border-emerald-600/50"
              )}
            >
              {isLocatingUser ? (
                <Compass className="h-3.5 w-3.5 text-primary animate-spin" />
              ) : (
                <Compass className="h-3.5 w-3.5 text-primary" />
              )}
              <span>{isRtl ? 'الأقرب إليّ (GPS)' : 'Nearest to Me'}</span>
            </Button>

            {/* 7. Reset Filters Button (Appears only if filters are active) */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="rounded-full text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 h-9 font-semibold gap-1.5 animate-in fade-in duration-200"
              >
                <span>✕</span>
                <span>{isRtl ? `مسح التصفية (${activeFiltersCount})` : `Reset (${activeFiltersCount})`}</span>
              </Button>
            )}
          </div>

          {/* Right Side: Results summary & Mobile Views Switcher */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {isRtl 
                ? `تم العثور على ${filteredListings.length} نتيجة` 
                : `${filteredListings.length} places found`}
            </span>

            {/* Mobile View Toggle Tabs */}
            <div className="flex md:hidden items-center gap-1 border rounded-xl p-1 bg-muted">
              <Button
                variant={currentView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('list')}
                className="h-7 text-xs font-bold px-2.5 rounded-lg"
              >
                <ListIcon className="h-3.5 w-3.5 mr-1" />
                {isRtl ? 'قائمة' : 'List'}
              </Button>
              <Button
                variant={currentView === 'map' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('map')}
                className="h-7 text-xs font-bold px-2.5 rounded-lg"
              >
                <MapIcon className="h-3.5 w-3.5 mr-1" />
                {isRtl ? 'خريطة' : 'Map'}
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Main split display view layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Side: Advanced Filters & Cards List */}
        <div className={cn(
          "col-span-1 md:col-span-8 flex flex-col gap-6",
          currentView === 'map' ? 'hidden md:flex' : 'flex'
        )}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar filter controls (for large screens) */}
            <div className="hidden lg:block space-y-5 border p-4 rounded-xl bg-card">
              <h3 className="font-headline font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {isRtl ? 'تصفية النتائج' : 'Filters'}
              </h3>
              
              {/* Features checklists */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">{isRtl ? 'الميزات والخدمات' : 'Amenities & Features'}</h4>
                {[
                  { key: 'wifi', label: isRtl ? 'واي فاي مجاني' : 'Free Wi-Fi' },
                  { key: 'parking', label: isRtl ? 'موقف سيارات' : 'Parking Lot' },
                  { key: 'card', label: isRtl ? 'يقبل بطاقات الدفع' : 'Card Payments' },
                  { key: 'kidFriendly', label: isRtl ? 'مناسب للعائلات' : 'Kids Friendly' },
                  { key: 'accessible', label: isRtl ? 'ذوي الاحتياجات الخاصة' : 'Accessible' },
                  { key: 'delivery', label: isRtl ? 'خدمة توصيل' : 'Delivery Service' }
                ].map(item => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`check-${item.key}`} 
                      checked={(features as any)[item.key]}
                      onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, [item.key]: !!checked }))}
                    />
                    <label 
                      htmlFor={`check-${item.key}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Listings Grid (scrolls) */}
            <div className="col-span-1 lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1 font-semibold select-none">
                <span>{isRtl ? `تم العثور على ${filteredListings.length} نتيجة` : `Found ${filteredListings.length} listings`}</span>
              </div>

              {filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map((item) => {
                    const status = getOpenStatus(item.operatingHours);
                    const isSaved = savedIds.includes(item.id);
                    const isSelected = selectedListing?.id === item.id;

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedListing(item)}
                        className={cn(
                          "bg-card rounded-2xl border hover:border-primary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group",
                          isSelected && "ring-2 ring-primary border-transparent shadow-md"
                        )}
                      >
                        {/* Header Image */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                          <img 
                            src={item.images[0] || 'https://placehold.co/600x400.png'} 
                            alt={item.name} 
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => toggleFavorite(e, item.id)}
                            className={cn(
                              "absolute top-2 right-2 rounded-full h-8 w-8 bg-black/40 hover:bg-black/60 text-white transition-colors",
                              isSaved && "bg-white hover:bg-white text-destructive"
                            )}
                          >
                            <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                          </Button>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "absolute bottom-2 left-2 text-xs font-semibold backdrop-blur-sm text-white",
                              status.isOpen ? "bg-emerald-500/90" : "bg-destructive/90"
                            )}
                          >
                            {status.isOpen ? (isRtl ? 'مفتوح' : 'Open') : (isRtl ? 'مغلق' : 'Closed')}
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="font-headline font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {item.name}
                              </h4>
                              {item.pricing && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">{item.pricing}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
                              <span className="font-bold text-foreground">{item.averageRating}</span>
                              <span className="text-muted-foreground">({item.reviews.length} {isRtl ? 'تقييم' : 'reviews'})</span>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{item.description}</p>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t text-xs text-muted-foreground">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="truncate">{item.location.city}</span>
                              </div>
                              {userLocation && (() => {
                                const lat = (item as any).latitude ? parseFloat((item as any).latitude) : 35.1903;
                                const lng = (item as any).longitude ? parseFloat((item as any).longitude) : -0.6309;
                                const d = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
                                const distText = d < 1 ? `${Math.round(d * 1000)} ${isRtl ? 'متر' : 'm'}` : `${d.toFixed(1)} ${isRtl ? 'كم' : 'km'}`;
                                return (
                                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                    <Compass className="h-3 w-3" />
                                    <span>{distText}</span>
                                  </span>
                                );
                              })()}
                            </div>
                            {item.contact.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{item.contact.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Footer Actions */}
                        <div className="p-2 bg-muted/30 border-t flex items-center justify-between gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(item); }}
                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 flex-1 font-bold"
                          >
                            WhatsApp
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-xs text-primary h-8 flex-1 font-bold"
                          >
                            <a href={`/listings/${item.id}`} onClick={e => e.stopPropagation()}>
                              {language === 'ar' ? 'زيارة' : language === 'fr' ? 'Visiter' : 'Visit'}
                              <ExternalLink className="h-3 w-3 ml-1 shrink-0" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 border rounded-2xl bg-card">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-bold mb-1">{isRtl ? 'لم نجد أي نتائج' : 'No Results Found'}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {isRtl ? 'حاول تغيير الفلاتر أو استخدام كلمات بحث مختلفة.' : 'Try adjusting your filters or keyword to find listings.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Maps Section */}
        <div className={cn(
          "col-span-1 md:col-span-4 h-[calc(100vh-140px)] md:sticky md:top-20 bg-muted/20 border rounded-2xl overflow-hidden",
          currentView === 'list' ? 'hidden md:block' : 'block'
        )}>
          <InteractiveMap 
            listings={filteredListings}
            selectedListing={selectedListing}
            onMarkerClick={(item) => setSelectedListing(item)}
          />
        </div>
      </div>
    </div>
  );
}

export default ListingsClientContainer;
