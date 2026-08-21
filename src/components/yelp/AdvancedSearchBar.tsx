'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Search, MapPin, Mic, Compass, History, TrendingUp, Sparkles,
  Utensils, Wrench, Car, MoreHorizontal, ChevronDown, Check, X,
  Pizza, Flame, Soup, Coffee, Cookie, Truck, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { categories } from '@/data/mock';

const POPULAR_SEARCHES = ['Pizza', 'Plumber', 'Dentist', 'Car Wash', 'Algerian Food', 'AC Repair'];
const STORAGE_KEY_RECENT_SEARCHES = 'khidmatik_recent_searches';

interface CategoryItem {
  name: string;
  nameAr: string;
  slug: string;
  subCategories: { name: string; nameAr: string; slug: string }[];
}

const YELP_CATEGORIES: Record<string, CategoryItem> = {
  restaurants: {
    name: 'Restaurants',
    nameAr: 'مطاعم',
    slug: 'restaurants',
    subCategories: [
      { name: 'Pizza', nameAr: 'بيتزا', slug: 'pizza' },
      { name: 'Burgers', nameAr: 'برغر', slug: 'burger' },
      { name: 'Algerian Cuisine', nameAr: 'مأكولات جزائرية', slug: 'algerian-food' },
      { name: 'Cafes', nameAr: 'مقاهي', slug: 'cafes' },
      { name: 'Desserts', nameAr: 'حلويات', slug: 'desserts' },
      { name: 'Delivery', nameAr: 'توصيل', slug: 'delivery' },
      { name: 'Table Reservation', nameAr: 'حجز طاولات', slug: 'table-reservation' }
    ]
  },
  home_services: {
    name: 'Home Services',
    nameAr: 'خدمات منزلية',
    slug: 'home-services',
    subCategories: [
      { name: 'Plumber', nameAr: 'سباك', slug: 'plumbers' },
      { name: 'Electrician', nameAr: 'كهربائي', slug: 'electricians' },
      { name: 'Carpenter', nameAr: 'نجار', slug: 'painters' },
      { name: 'Painter', nameAr: 'دهان', slug: 'handyman' },
      { name: 'Home Cleaning', nameAr: 'تنظيف المنازل', slug: 'cleaning-services' },
      { name: 'Garden Maintenance', nameAr: 'حدائق', slug: 'gardening' },
      { name: 'AC Services', nameAr: 'تكييف', slug: 'hvac-services' },
      { name: 'Security Cameras', nameAr: 'كاميرات مراقبة', slug: 'security-cameras' },
      { name: 'Internet Setup', nameAr: 'تركيب الإنترنت', slug: 'internet-installation' },
      { name: 'Furniture Moving', nameAr: 'عمال نقل الأثاث', slug: 'movers' }
    ]
  },
  auto_services: {
    name: 'Auto Services',
    nameAr: 'خدمات السيارات',
    slug: 'auto-services',
    subCategories: [
      { name: 'Mechanic', nameAr: 'ميكانيكي', slug: 'automotive-services' },
      { name: 'Car Wash', nameAr: 'غسيل سيارات', slug: 'car-wash' },
      { name: 'Oil Change', nameAr: 'تغيير الزيت', slug: 'oil-change' },
      { name: 'Car Dealership', nameAr: 'بيع السيارات', slug: 'car-sale' },
      { name: 'Body Repair', nameAr: 'إصلاح الهيكل', slug: 'body-repair' },
      { name: 'Towing Service', nameAr: 'قطر السيارات', slug: 'towing' },
      { name: 'Parking Lot', nameAr: 'مواقف السيارات', slug: 'parking' },
      { name: 'Detailing', nameAr: 'تلميع السيارات', slug: 'detailing' }
    ]
  },
  more: {
    name: 'More',
    nameAr: 'المزيد',
    slug: 'more',
    subCategories: [
      { name: 'Barbershops', nameAr: 'صالونات الحلاقة', slug: 'barbershops' },
      { name: 'Beauty Salons', nameAr: 'صالونات التجميل', slug: 'beauty-salons' },
      { name: 'Hospitals', nameAr: 'المستشفيات', slug: 'hospitals' },
      { name: 'Clinics', nameAr: 'العيادات', slug: 'clinics' },
      { name: 'Pharmacies', nameAr: 'الصيدليات', slug: 'pharmacies' },
      { name: 'Gyms', nameAr: 'النوادي الرياضية', slug: 'gyms' },
      { name: 'Clothing Stores', nameAr: 'محلات الملابس', slug: 'clothing' },
      { name: 'Electronics Repair', nameAr: 'إصلاح الإلكترونيات', slug: 'electronics' },
      { name: 'Phone Repair', nameAr: 'إصلاح الهواتف', slug: 'phone-repair' },
      { name: 'PC Repair', nameAr: 'إصلاح الحواسيب', slug: 'pc-repair' },
      { name: 'Laundry', nameAr: 'مغاسل الملابس', slug: 'laundry' },
      { name: 'Hotels', nameAr: 'الفنادق', slug: 'hotels' },
      { name: 'Travel Agencies', nameAr: 'وكالات السفر', slug: 'travel-agencies' }
    ]
  }
};

export function AdvancedSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Close overlays on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(updated));
  };

  const currentType = searchParams.get('type') || '';

  const handleSearch = (e?: React.FormEvent, customKeyword?: string, customLocation?: string) => {
    if (e) e.preventDefault();
    const finalKeyword = customKeyword !== undefined ? customKeyword : keyword;
    const finalLocation = customLocation !== undefined ? customLocation : location;

    saveSearchTerm(finalKeyword);

    const params = new URLSearchParams();
    if (finalKeyword) params.set('q', finalKeyword);
    if (finalLocation) params.set('location', finalLocation);
    if (neighborhood) params.set('neighborhood', neighborhood);
    if (currentType) params.set('type', currentType);
    
    router.push(`/listings?${params.toString()}`);
    setIsFocused(false);
  };

  // voice search
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported / غير مدعوم",
        description: "Voice search is not supported by your current browser. / البحث الصوتي غير مدعوم في متصفحك الحالي.",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: language === 'ar' ? 'البحث الصوتي مفعل' : 'Voice Search Active',
        description: language === 'ar' ? 'تحدث الآن...' : 'Please speak now...',
      });
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setKeyword(speechToText);
      setIsListening(false);
      handleSearch(undefined, speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      toast({
        title: "Speech Error",
        description: "Could not recognize your voice. Please try again.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // gps localization
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Near Me (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        toast({
          title: "Location detected / تم تحديد موقعك",
          description: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      },
      (error) => {
        console.error(error);
        toast({
          title: "GPS Failed",
          description: "Could not retrieve your location. Please type manually.",
          variant: "destructive"
        });
      }
    );
  };

  const getSubCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'pizza': return Pizza;
      case 'burger': return Flame;
      case 'algerian-food': return Soup;
      case 'cafes': return Coffee;
      case 'desserts': return Cookie;
      case 'delivery': return Truck;
      case 'table-reservation': return Calendar;
      default: return Sparkles;
    }
  };

  const isRtl = language === 'ar';

  return (
    <div ref={containerRef} className="w-full space-y-4">
      {/* Search inputs bar */}
      <form onSubmit={(e) => handleSearch(e)} className="bg-card rounded-2xl shadow-xl border p-2 flex flex-col md:flex-row items-center gap-2 relative z-50">
        {/* Keyword Search */}
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute start-4 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder={language === 'ar' ? 'ابحث عن مطعم، سباك، كهربائي...' : 'Find pizza, plumbers, cafes...'}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            className="ps-11 pe-10 h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-md shadow-none font-medium"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startSpeechRecognition}
            className={cn(
              "absolute end-2 rounded-full h-8 w-8 hover:bg-muted text-muted-foreground transition-all duration-200",
              isListening && "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
            )}
            title="Search by voice / بحث صوتي"
          >
            <Mic className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="h-px md:h-8 w-full md:w-px bg-border"></div>

        {/* Location Search */}
        <div className="relative flex-1 w-full flex items-center">
          <MapPin className="absolute start-4 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder={language === 'ar' ? 'المدينة، الولاية، أو الحي...' : 'Algiers, Oran, or Neighborhood...'}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="ps-11 pe-10 h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-md shadow-none font-medium"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={detectGPSLocation}
            className="absolute end-2 rounded-full h-8 w-8 hover:bg-muted text-primary"
            title="Use current location / بالقرب مني"
          >
            <Compass className="h-4.5 w-4.5 animate-spin-slow" />
          </Button>
        </div>

        {/* Action Button */}
        <Button 
          type="submit" 
          className="w-full md:w-auto h-12 px-8 bg-primary hover:bg-primary/95 text-primary-foreground font-headline font-bold text-base rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
        >
          <Search className="me-2 h-5 w-5 stroke-[2.5]" />
          {language === 'ar' ? 'ابحث' : 'Search'}
        </Button>

        {/* Autocomplete and recent searches overlay */}
        {isFocused && (
          <div className={cn(
            "absolute left-0 right-0 top-full mt-2 bg-popover text-popover-foreground rounded-xl shadow-2xl border p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-250",
            isRtl && "text-right"
          )}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Recents */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5 px-2">
                  <History className="h-4 w-4" />
                  {language === 'ar' ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                </h4>
                {recentSearches.length > 0 ? (
                  <div className="space-y-1">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setKeyword(term);
                          handleSearch(undefined, term);
                        }}
                        className="w-full text-start px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors flex items-center justify-between group"
                      >
                        <span>{term}</span>
                        <X 
                          className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const filtered = recentSearches.filter(t => t !== term);
                            setRecentSearches(filtered);
                            localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(filtered));
                          }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2 italic">
                    {language === 'ar' ? 'لا توجد عمليات بحث سابقة' : 'No history yet'}
                  </p>
                )}
              </div>

              {/* Right Column: Populars */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5 px-2">
                  <TrendingUp className="h-4 w-4" />
                  {language === 'ar' ? 'أكثر عمليات البحث شيوعاً' : 'Trending Now'}
                </h4>
                <div className="flex flex-wrap gap-2 px-2">
                  {POPULAR_SEARCHES.map((term, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setKeyword(term);
                        handleSearch(undefined, term);
                      }}
                      className="rounded-full bg-background border-border/80 hover:border-primary hover:text-primary transition-all duration-200"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Yelp Category Ribbon Menu */}
      <div className="w-full bg-card/65 backdrop-blur-sm border rounded-xl p-2 relative z-40">
        <div className="flex flex-wrap items-center justify-center gap-1">
          {Object.entries(YELP_CATEGORIES).filter(([key]) => {
            if (currentType === 'store') {
              return key === 'restaurants' || key === 'more';
            } else if (currentType === 'professional') {
              return key === 'home_services' || key === 'auto_services' || key === 'more';
            }
            return true;
          }).map(([key, category]) => {
            const isMore = key === 'more';
            const catName = language === 'ar' ? category.nameAr : category.name;
            const menuOpen = activeDropdown === key;

            // Filter subcategories of the "More" dropdown based on section type
            let subCategories = category.subCategories;
            if (isMore && currentType) {
              const storeSubs = ['clothing', 'electronics', 'phone-repair', 'pc-repair', 'laundry', 'hotels', 'travel-agencies'];
              const professionalSubs = ['barbershops', 'beauty-salons', 'hospitals', 'clinics', 'pharmacies', 'gyms'];
              subCategories = category.subCategories.filter(sub => {
                if (currentType === 'store') {
                  return storeSubs.includes(sub.slug);
                } else {
                  return professionalSubs.includes(sub.slug);
                }
              });
            }

            return (
              <div key={key} className="relative">
                <Button
                  type="button"
                  variant={menuOpen ? 'secondary' : 'ghost'}
                  onClick={() => setActiveDropdown(menuOpen ? null : key)}
                  className="rounded-lg px-4 py-2 font-medium flex items-center gap-2 hover:bg-muted text-foreground transition-all duration-200"
                >
                  {key === 'restaurants' && <Utensils className="h-4 w-4 text-orange-500" />}
                  {key === 'home_services' && <Wrench className="h-4 w-4 text-blue-500" />}
                  {key === 'auto_services' && <Car className="h-4 w-4 text-emerald-500" />}
                  {isMore && <MoreHorizontal className="h-4 w-4 text-purple-500" />}
                  <span>{catName}</span>
                  <ChevronDown className={cn("h-4 w-4 opacity-70 transition-transform duration-200", menuOpen && "rotate-185")} />
                </Button>

                {/* Subcategory dropdown menu */}
                {menuOpen && (
                  <div className={cn(
                    "absolute top-full mt-1 bg-popover text-popover-foreground rounded-xl shadow-xl border p-2 w-56 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
                    isRtl ? "right-0 text-right" : "left-0"
                  )}>
                    {subCategories.map((sub, idx) => {
                      const SubIcon = getSubCategoryIcon(sub.slug);
                      const displayName = language === 'ar' ? sub.nameAr : sub.name;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setKeyword(sub.name);
                            const params = new URLSearchParams();
                            params.set('category', sub.slug);
                            if (currentType) params.set('type', currentType);
                            router.push(`/listings?${params.toString()}`);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-start px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2.5"
                        >
                          <SubIcon className="h-4 w-4 opacity-75 text-primary shrink-0" />
                          <span className="truncate">{displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdvancedSearchBar;
