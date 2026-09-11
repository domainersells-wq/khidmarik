'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Mic, 
  X, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { algerianWilayas } from '@/data/mock';
import { unifiedSearchService } from '@/services/unifiedSearchService';
import type { AutocompleteSuggestion, SearchEntityType } from '@/types/search';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface UnifiedSearchHeaderProps {
  initialQuery?: string;
  initialWilaya?: string;
  initialEntityType?: SearchEntityType;
  onSearch?: (query: string, wilaya?: string, entityType?: SearchEntityType) => void;
  onToggleMobileFilters?: () => void;
  activeFilterCount?: number;
  compact?: boolean;
}

const RECENT_SEARCHES_KEY = 'khidmatik_recent_searches_v2';

export function UnifiedSearchHeader({
  initialQuery = '',
  initialWilaya,
  initialEntityType = 'all',
  onSearch,
  onToggleMobileFilters,
  activeFilterCount = 0,
  compact = false,
}: UnifiedSearchHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [wilaya, setWilaya] = useState(initialWilaya || 'all');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setWilaya(initialWilaya || 'all');
  }, [initialWilaya]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch (e) {
      console.warn('Could not load recent searches:', e);
    }
  }, []);

  // Fetch suggestions debounced
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await unifiedSearchService.getAutocompleteSuggestions(query);
      setSuggestions(results);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term || term.trim().length < 2) return;
    try {
      const clean = term.trim();
      const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving search history:', e);
    }
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed deleting search history item:', e);
    }
  };

  const executeSearch = (targetQuery: string, targetWilaya?: string) => {
    setIsOpen(false);
    const finalQ = targetQuery.trim();
    const finalW = targetWilaya || wilaya;
    if (finalQ) saveRecentSearch(finalQ);

    if (onSearch) {
      onSearch(finalQ, finalW === 'all' ? undefined : finalW, initialEntityType);
    } else {
      const params = new URLSearchParams();
      if (finalQ) params.set('q', finalQ);
      if (finalW && finalW !== 'all') params.set('wilaya', finalW);
      if (initialEntityType && initialEntityType !== 'all') params.set('type', initialEntityType);
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  // Speech Recognition (Arabic / French / English)
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: 'البحث الصوتي غير مدعوم',
        description: 'متصفحك لا يدعم خاصية تحويل الصوت إلى نص.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-DZ';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      toast({
        title: 'تحدث الآن...',
        description: 'قل اسم الخدمة، المنتج، أو الحرفي الذي تبحث عنه.',
      });

      recognition.onresult = (event: any) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        executeSearch(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: 'تعذر التقاط الصوت',
          description: 'يرجى المحاولة مرة أخرى أو الكتابة يدوياً.',
          variant: 'destructive',
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      console.warn('Speech error:', e);
    }
  };

  const trendingKeywords = unifiedSearchService.getPopularSearchKeywords();

  return (
    <div ref={dropdownRef} className="relative w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center bg-card rounded-2xl border-2 transition-all duration-300 shadow-sm",
          isOpen ? "border-primary ring-4 ring-primary/10 shadow-lg" : "border-border/80 hover:border-primary/50",
          compact ? "h-12 p-1" : "h-14 p-1.5"
        )}
      >
        {/* Search Icon */}
        <div className="flex items-center justify-center pl-3 pr-2 text-primary">
          <Search className={cn("transition-transform", compact ? "h-5 w-5" : "h-6 w-6")} />
        </div>

        {/* Text Input */}
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="ابحث عن منتجات، خدمات، سباكين، متاجر، قاعات، وحجوزات..."
          className="flex-1 h-full border-0 bg-transparent text-sm sm:text-base font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
        />

        {/* Clear Query Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors mr-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Voice Search Button */}
        <button
          type="button"
          onClick={handleVoiceSearch}
          className={cn(
            "p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors mr-1 hidden sm:flex items-center justify-center",
            isListening && "text-destructive animate-pulse bg-destructive/10"
          )}
          title="بحث صوتي (Voice Search)"
        >
          <Mic className="h-4 w-4" />
        </button>

        {/* Wilaya Picker Quick Dropdown */}
        <div className="hidden md:flex items-center pl-2 border-r border-border/60 mr-2">
          <MapPin className="h-4 w-4 text-muted-foreground ml-1" />
          <select
            value={wilaya}
            onChange={(e) => {
              setWilaya(e.target.value);
              executeSearch(query, e.target.value);
            }}
            className="h-8 bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[130px]"
          >
            <option value="all">كل الولايات</option>
            {algerianWilayas.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} - {w.name} ({w.name_fr})
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Filter Trigger Button */}
        {onToggleMobileFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleMobileFilters}
            className="md:hidden h-10 px-2.5 rounded-xl text-muted-foreground hover:text-foreground relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Submit Search Button */}
        <Button
          type="submit"
          className={cn(
            "rounded-xl font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 flex items-center gap-1.5 transition-transform active:scale-95",
            compact ? "h-10 px-4 text-xs" : "h-11 px-5 text-sm"
          )}
        >
          <span>بحث</span>
          <ArrowRight className="h-4 w-4 rtl:rotate-180 ltr:rotate-0" />
        </Button>
      </form>

      {/* Instant Autocomplete & History Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border/80 shadow-2xl overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-2">
          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-2 pb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>مقترحات البحث المباشرة:</span>
              </div>
              {suggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => {
                    if (sug.url.startsWith('/search')) {
                      executeSearch(sug.title);
                    } else {
                      router.push(sug.url);
                      setIsOpen(false);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-right hover:bg-muted/80 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    {sug.image ? (
                      <img src={sug.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {sug.type.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {sug.title}
                      </div>
                      {sug.category && (
                        <div className="text-[11px] text-muted-foreground">{sug.category}</div>
                      )}
                    </div>
                  </div>
                  {sug.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {sug.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && suggestions.length === 0 && (
            <div className="p-3 border-b border-border/40">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-2 pb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>عمليات البحث الأخيرة:</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem(RECENT_SEARCHES_KEY);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors font-normal"
                >
                  مسح السجل
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term) => (
                  <span
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      executeSearch(term);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/70 hover:bg-primary/10 hover:text-primary text-xs font-medium cursor-pointer transition-colors"
                  >
                    <span>{term}</span>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(term, e)}
                      className="hover:text-destructive p-0.5 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {suggestions.length === 0 && (
            <div className="p-3 bg-muted/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground px-2 pb-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span>الأكثر بحثاً في الجزائر:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trendingKeywords.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => {
                      setQuery(kw);
                      executeSearch(kw);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background hover:bg-primary/10 hover:text-primary border border-border/50 transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
