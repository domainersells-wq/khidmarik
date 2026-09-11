'use client';

import React from 'react';
import { Check, X, Clock, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationCardVariant = 'balance' | 'success' | 'info' | 'warning' | 'destructive';

export interface FintechNotificationCardProps {
  id?: string;
  variant?: NotificationCardVariant | string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  amount?: string | number;
  timestampText?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * 3-Ray Green Celebratory Sunburst icon matching the reference design
 */
function CelebratoryBurstRays({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 inline-block', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4l3 3" />
      <path d="M2 12h4" />
      <path d="M4 20l3-3" />
    </svg>
  );
}

/**
 * Vector Emerald Bank Card with Golden Chip and Success Checkmark
 * Built with 100% SVG/CSS for instant zero-latency rendering and 0 chance of broken image/white box
 */
function FintechCardGraphic({ variant = 'balance' }: { variant?: NotificationCardVariant | string }) {
  if (variant === 'info') {
    return (
      <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/50 flex items-center justify-center shrink-0 shadow-inner">
        <div className="w-9 h-6 sm:w-10 sm:h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm p-1 flex flex-col justify-between relative transform -rotate-1">
          <div className="flex items-center justify-between">
            <div className="w-2.5 h-1.5 rounded-[2px] bg-blue-200/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
          <div className="space-y-0.5">
            <div className="w-4 h-0.5 bg-blue-200/60 rounded-full" />
            <div className="w-2.5 h-0.5 bg-blue-200/40 rounded-full" />
          </div>
        </div>
        <div className="absolute -bottom-1 -left-1 sm:bottom-0 sm:left-0 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs">
          <Info className="w-3 h-3 stroke-[2.5]" />
        </div>
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-center shrink-0 shadow-inner">
        <div className="w-9 h-6 sm:w-10 sm:h-7 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm p-1 flex flex-col justify-between relative transform -rotate-1">
          <div className="flex items-center justify-between">
            <div className="w-2.5 h-1.5 rounded-[2px] bg-amber-200/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
          <div className="space-y-0.5">
            <div className="w-4 h-0.5 bg-amber-200/60 rounded-full" />
            <div className="w-2.5 h-0.5 bg-amber-200/40 rounded-full" />
          </div>
        </div>
        <div className="absolute -bottom-1 -left-1 sm:bottom-0 sm:left-0 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs">
          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
        </div>
      </div>
    );
  }

  if (variant === 'destructive') {
    return (
      <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-800/50 flex items-center justify-center shrink-0 shadow-inner">
        <div className="w-9 h-6 sm:w-10 sm:h-7 rounded-md bg-gradient-to-br from-rose-500 to-red-600 shadow-sm p-1 flex flex-col justify-between relative transform -rotate-1">
          <div className="flex items-center justify-between">
            <div className="w-2.5 h-1.5 rounded-[2px] bg-rose-200/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
          <div className="space-y-0.5">
            <div className="w-4 h-0.5 bg-rose-200/60 rounded-full" />
            <div className="w-2.5 h-0.5 bg-rose-200/40 rounded-full" />
          </div>
        </div>
        <div className="absolute -bottom-1 -left-1 sm:bottom-0 sm:left-0 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs">
          <AlertCircle className="w-3 h-3 stroke-[2.5]" />
        </div>
      </div>
    );
  }

  // Default: Emerald Bank Card matching the user's reference image
  return (
    <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0 shadow-inner">
      {/* 3D-styled Green Bank Card */}
      <div className="w-9 h-6 sm:w-10 sm:h-7 rounded-md bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-sm p-1 flex flex-col justify-between relative transform -rotate-1 transition-transform hover:rotate-0">
        {/* Chip & Logo Row */}
        <div className="flex items-center justify-between">
          {/* Embossed Golden Chip */}
          <div className="w-2.5 h-1.5 sm:w-3 sm:h-2 rounded-[2px] bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-600/30 shadow-2xs" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-200/60" />
        </div>
        {/* Card Stripes */}
        <div className="space-y-0.5">
          <div className="w-4 sm:w-5 h-0.5 bg-emerald-200/60 rounded-full" />
          <div className="w-2.5 sm:w-3.5 h-0.5 bg-emerald-200/40 rounded-full" />
        </div>
      </div>

      {/* Success Badge with Checkmark */}
      <div className="absolute -bottom-1 -left-1 sm:bottom-0 sm:left-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs">
        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
      </div>
    </div>
  );
}

/**
 * FintechNotificationCard - Main Card Component
 */
export function FintechNotificationCard({
  variant = 'balance',
  title,
  description,
  amount,
  timestampText = 'الآن',
  onClose,
  className,
}: FintechNotificationCardProps) {
  const isBalanceOrSuccess = variant === 'balance' || variant === 'success' || variant === 'default';
  const isInfo = variant === 'info';
  const isWarning = variant === 'warning';
  const isDestructive = variant === 'destructive';

  // Accent bar color matching the reference image's left green rounded strip
  const accentBarColor = isDestructive
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-500'
    : isInfo
    ? 'bg-blue-500'
    : 'bg-emerald-500';

  // Card border tone
  const cardBorderClass = isDestructive
    ? 'border-rose-500/20 dark:border-rose-500/30'
    : isWarning
    ? 'border-amber-500/20 dark:border-amber-500/30'
    : isInfo
    ? 'border-blue-500/20 dark:border-blue-500/30'
    : 'border-emerald-500/25 dark:border-emerald-500/20';

  // Parse title: if it contains an emoji like 💳 or ✅, clean it up for the modern heading
  let cleanTitle = title;
  if (typeof title === 'string') {
    cleanTitle = title
      .replace(/[💳✅\s!]+$/g, '')
      .replace(/^[💳✅\s]+/g, '')
      .trim();
  }

  // Parse description and amount if not explicitly passed
  let parsedDescription = description;
  let parsedAmount = amount;

  if (!parsedAmount && typeof description === 'string') {
    // Check if description contains amount pattern like "20,000 DA" or "0 DA"
    const amountMatch = description.match(/([\d,.]+\s*(?:DA|دج|DZD))/i);
    if (amountMatch) {
      parsedAmount = amountMatch[1];
      // Keep descriptive prefix
      const prefix = description.replace(amountMatch[0], '').replace(/[:：]\s*$/, '').trim();
      if (prefix) {
        parsedDescription = `${prefix}:`;
      }
    }
  }

  return (
    <div
      dir="rtl"
      className={cn(
        'relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900',
        'border shadow-lg shadow-black/5 dark:shadow-black/40',
        'p-3 sm:p-4 pr-3.5 sm:pr-4',
        'flex items-center justify-between gap-2.5 sm:gap-3.5 w-full select-none',
        'transition-all duration-200 hover:shadow-xl',
        cardBorderClass,
        className
      )}
    >
      {/* 1. Left Vertical Rounded Indicator Bar (Matching reference image) */}
      <div
        className={cn(
          'absolute left-1.5 top-2.5 bottom-2.5 w-1.5 rounded-full',
          accentBarColor
        )}
      />

      {/* 2. Left Icon Graphic with Badge (or start side in RTL) */}
      <div className="shrink-0 pl-1">
        <FintechCardGraphic variant={variant} />
      </div>

      {/* 3. Middle Content Section (Title, Subtext, and Big Balance) */}
      <div className="flex-1 min-w-0 pr-1 space-y-0.5 sm:space-y-1">
        {/* Header row with celebratory burst rays if success/balance */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="font-black text-xs sm:text-sm md:text-base text-foreground font-headline tracking-tight leading-snug">
            {cleanTitle}
          </h4>
          {isBalanceOrSuccess && <CelebratoryBurstRays />}
        </div>

        {/* Subtext description */}
        {parsedDescription && (
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate leading-tight">
            {parsedDescription}
          </p>
        )}

        {/* Large prominent amount in bold emerald mono font */}
        {parsedAmount && (
          <div className="pt-0.5">
            <span
              className={cn(
                'font-mono text-base sm:text-xl font-black tracking-tight',
                isDestructive
                  ? 'text-rose-600 dark:text-rose-400'
                  : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : isInfo
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
              dir="ltr"
            >
              {typeof parsedAmount === 'number'
                ? `${parsedAmount.toLocaleString()} DA`
                : parsedAmount}
            </span>
          </div>
        )}
      </div>

      {/* 4. Far End Controls & Timestamp */}
      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-1.5">
        {/* Close button with circular hover */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors focus:outline-hidden"
            aria-label="إغلاق الإشعار"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Timestamp */}
        <div className="mt-auto pt-1 text-[10px] sm:text-[11px] text-muted-foreground/80 flex items-center gap-1 font-sans">
          <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          <span>{timestampText}</span>
        </div>
      </div>
    </div>
  );
}
