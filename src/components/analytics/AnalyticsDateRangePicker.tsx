'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AnalyticsTimeRange, DateRangeFilter } from '@/types/analytics';

interface AnalyticsDateRangePickerProps {
  value: DateRangeFilter;
  onChange: (filter: DateRangeFilter) => void;
  className?: string;
}

const PRESET_RANGES: Array<{ id: AnalyticsTimeRange; labelAr: string; labelEn: string }> = [
  { id: 'today', labelAr: 'اليوم', labelEn: 'Today' },
  { id: '7d', labelAr: 'آخر 7 أيام', labelEn: 'Last 7 Days' },
  { id: '30d', labelAr: 'آخر 30 يوماً', labelEn: 'Last 30 Days' },
  { id: '3m', labelAr: 'آخر 3 أشهر', labelEn: 'Last 3 Months' },
  { id: '1y', labelAr: 'سنة كاملة', labelEn: 'Last 1 Year' },
  { id: 'custom', labelAr: 'نطاق مخصص', labelEn: 'Custom Range' },
];

export function AnalyticsDateRangePicker({
  value,
  onChange,
  className,
}: AnalyticsDateRangePickerProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(value.endDate || new Date().toISOString().split('T')[0]);

  const handleSelectPreset = (range: AnalyticsTimeRange) => {
    if (range === 'custom') {
      setShowCustomModal(true);
      return;
    }
    onChange({ range });
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({
        range: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      setShowCustomModal(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 text-xs", className)}>
      {PRESET_RANGES.map(preset => {
        const isSelected = value.range === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
          >
            <span>{preset.labelAr}</span>
            {isSelected && preset.id === 'custom' && value.startDate && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary-foreground/40 text-primary-foreground">
                {value.startDate} ➔ {value.endDate}
              </Badge>
            )}
          </button>
        );
      })}

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border shadow-2xl p-5 space-y-4 text-right animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-black text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>تحديد نطاق تاريخ مخصص</span>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">من تاريخ (Start Date):</label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">إلى تاريخ (End Date):</label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              {customStart > customEnd && (
                <div className="text-destructive text-[11px]">
                  ⚠️ تاريخ البداية يجب أن يكون قبل أو يطابق تاريخ النهاية.
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleApplyCustom}
                disabled={!customStart || !customEnd || customStart > customEnd}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold h-10 gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>تطبيق النطاق</span>
              </Button>
              <Button
                onClick={() => setShowCustomModal(false)}
                variant="ghost"
                className="rounded-xl h-10"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
