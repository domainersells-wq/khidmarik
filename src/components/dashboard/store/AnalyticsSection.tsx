'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { StoreAnalyticsDashboard } from './StoreAnalyticsDashboard';
import { AnalyticsDashboard as YelpAnalyticsDashboard } from '@/components/yelp/AnalyticsDashboard';

export function AnalyticsSection() {
  const [analyticsTab, setAnalyticsTab] = useState<'sales' | 'yelp'>('sales');

  return (
    <div className="space-y-6 animate-fade-in text-right font-sans">
      {/* Toggles for Analytics Source */}
      <div className="flex border-b pb-4 gap-3 items-center">
        <Button
          variant={analyticsTab === 'sales' ? 'default' : 'outline'}
          onClick={() => setAnalyticsTab('sales')}
          className="text-xs font-bold rounded-2xl gap-1.5"
        >
          <ShoppingCart className="h-4 w-4" />
          تحليلات مبيعات المتجر (Store Sales Analytics)
        </Button>
        <Button
          variant={analyticsTab === 'yelp' ? 'default' : 'outline'}
          onClick={() => setAnalyticsTab('yelp')}
          className="text-xs font-bold rounded-2xl gap-1.5"
        >
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          تحليلات الدليل والأنشطة المحلية (Local Listing Analytics)
        </Button>
      </div>

      {analyticsTab === 'yelp' ? (
        <YelpAnalyticsDashboard />
      ) : (
        <StoreAnalyticsDashboard />
      )}
    </div>
  );
}