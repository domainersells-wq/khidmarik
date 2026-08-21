
'use client';

import { useState, useEffect, Suspense, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/data/mock';
import { Search, MapPin, ListFilter, Calendar as CalendarIcon, SlidersHorizontal, Users, Coins } from 'lucide-react';
import BookingCalendar from '@/components/ui/BookingCalendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/context/LanguageContext';

const ALL_CATEGORIES_SENTINEL_VALUE = "_all_";

function SearchBarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [capacity, setCapacity] = useState(searchParams.get('capacity') || '');
  const [price, setPrice] = useState(searchParams.get('price') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { translate } = useLanguage();


  useEffect(() => {
    setKeyword(searchParams.get('q') || '');
    setCategory(searchParams.get('category') || '');
    setLocation(searchParams.get('location') || '');
    setType(searchParams.get('type') || '');
    setCapacity(searchParams.get('capacity') || '');
    setPrice(searchParams.get('price') || '');
    setDate(searchParams.get('date') || '');
  }, [searchParams]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (category) params.set('category', category); // category state is already '' or a slug
    if (location) params.set('location', location);
    if (type) params.set('type', type);
    if (capacity) params.set('capacity', capacity);
    if (price) params.set('price', price);
    if (date) params.set('date', date);
    router.push(`/listings?${params.toString()}`);
  };

  const handleCategoryChange = (selectedValue: string) => {
    if (selectedValue === ALL_CATEGORIES_SENTINEL_VALUE) {
      setCategory(''); // Set application state to empty string for "All Categories"
    } else {
      setCategory(selectedValue);
    }
  };

  return (
    <div className="w-full bg-card rounded-xl shadow-lg border p-5 mb-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        role="search"
        aria-label="Search for stores and professionals"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Keyword */}
          <div className="relative md:col-span-3">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={translate('searchKeywordPlaceholder', 'Keyword (e.g., pizza, plumber)')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="ps-10 h-10 w-full"
              aria-label="Search keyword"
            />
          </div>

          {/* Category */}
          <div className="relative md:col-span-3">
             <ListFilter className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Select 
              value={category === '' ? ALL_CATEGORIES_SENTINEL_VALUE : category} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="ps-10 h-10 w-full" aria-label="Select category">
                <SelectValue placeholder={translate('allCategories', 'All Categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_SENTINEL_VALUE}>
                  {translate('allCategories', 'All Categories')}
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Location */}
          <div className="relative md:col-span-3">
            <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={translate('locationPlaceholder', 'Location (e.g., Alger Centre)')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="ps-10 h-10 w-full"
              aria-label="Search location"
            />
          </div>

          {/* Actions: Search & Advanced Toggle */}
          <div className="flex gap-2 md:col-span-3 w-full">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 flex items-center justify-center">
              <Search className="me-2 h-4 w-4" />
              {translate('searchBtn', 'Search')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "h-10 px-3 transition-all duration-200 flex items-center justify-center border-border hover:bg-muted",
                showAdvanced ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" : ""
              )}
              title={translate('advancedFilters', 'Advanced Filters')}
              aria-label="Toggle advanced filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed border-border/80 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Capacity */}
            <div className="relative flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground px-1">
                {translate('capacityLabel', 'Minimum Capacity')}
              </label>
              <div className="relative">
                <Users className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder={translate('capacityPlaceholder', 'Capacity (e.g., 100)')}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="ps-10 h-10 w-full"
                  aria-label="Search capacity"
                />
              </div>
            </div>

            {/* Price */}
            <div className="relative flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground px-1">
                {translate('priceLabel', 'Maximum Budget (DA)')}
              </label>
              <div className="relative">
                <Coins className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder={translate('pricePlaceholder', 'Price (e.g., 1000)')}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="ps-10 h-10 w-full"
                  aria-label="Search price"
                />
              </div>
            </div>

            {/* Date Picker Popover */}
            <div className="relative flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground px-1">
                {translate('dateLabel', 'Preferred Date')}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 ps-10 relative",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    {date ? format(new Date(date), "PPP") : translate('selectDate', 'Select Date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <BookingCalendar 
                    selected={date ? new Date(date) : undefined}
                    onDateSelect={(selectedDate: Date) => setDate(selectedDate.toISOString())} 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export function SearchBar() {
  return (
    <Suspense fallback={<div className="w-full h-14 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse border" />}>
      <SearchBarContent />
    </Suspense>
  );
}

export default SearchBar;
