'use client';

import React from 'react';
import { SearchX, RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchEmptyStateProps {
  query?: string;
  onResetFilters: () => void;
  onSelectSuggestion: (keyword: string) => void;
}

const SUGGESTIONS = [
  'سباك طارئ (Plumber SOS)',
  'مكيفات الهواء والتبريد',
  'كهربائي معتمد',
  'قطع غيار أصلية',
  'قاعات أفراح',
  'برمجة وتطوير ويب'
];

export function SearchEmptyState({
  query,
  onResetFilters,
  onSelectSuggestion,
}: SearchEmptyStateProps) {
  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-card/60 rounded-3xl border border-dashed border-border/80 my-4 shadow-sm animate-fade-in">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 ring-8 ring-primary/5">
        <SearchX className="h-8 w-8" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
        {query ? `لم يتم العثور على نتائج تطابق "${query}"` : 'لا توجد نتائج تطابق خيارات الفلترة المحددة'}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        جرب تقليل فلاتر البحث، توسيع نطاق المسافة الجغرافية، أو البحث باستخدام كلمات مفتاحية أخرى.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <Button
          onClick={onResetFilters}
          className="rounded-xl font-semibold text-xs sm:text-sm gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>إعادة ضبط جميع الفلاتر</span>
        </Button>
      </div>

      {/* Suggested Keywords */}
      <div className="w-full max-w-lg pt-6 border-t border-border/40">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span>عمليات بحث شائعة مقترحة:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SUGGESTIONS.map((term) => (
            <button
              key={term}
              onClick={() => onSelectSuggestion(term)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl bg-muted/80 hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
