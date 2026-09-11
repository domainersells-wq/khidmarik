'use client';

import React from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Wrench, 
  Users, 
  Store, 
  ListOrdered, 
  CalendarCheck, 
  LayoutGrid 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchEntityType, SearchFacetCounts } from '@/types/search';

interface EntityTabsProps {
  activeType: SearchEntityType;
  onChange: (type: SearchEntityType) => void;
  facets?: SearchFacetCounts;
}

interface TabDef {
  key: SearchEntityType;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { key: 'all', label: 'All Results', labelAr: 'جميع النتائج', icon: Sparkles },
  { key: 'products', label: 'Products', labelAr: 'المنتجات', icon: ShoppingBag },
  { key: 'services', label: 'Services', labelAr: 'الخدمات', icon: Wrench },
  { key: 'providers', label: 'Providers', labelAr: 'الحرفيون والمقدمون', icon: Users },
  { key: 'stores', label: 'Stores', labelAr: 'المتاجر', icon: Store },
  { key: 'listings', label: 'Listings', labelAr: 'الدليل والقاعات', icon: ListOrdered },
  { key: 'bookings', label: 'Bookings', labelAr: 'الحجوزات', icon: CalendarCheck },
  { key: 'categories', label: 'Categories', labelAr: 'التصنيفات', icon: LayoutGrid },
];

export function EntityTabs({ activeType, onChange, facets }: EntityTabsProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 border-b border-border/40 bg-card/40 backdrop-blur-sm sticky top-16 z-30">
      <div className="flex items-center gap-2 min-w-max px-1 sm:px-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.key;
          const count = facets ? facets[tab.key] : undefined;

          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                "group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 select-none border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                  : "bg-background/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/60 hover:border-border"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-primary")} />
              <span>{tab.labelAr}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
