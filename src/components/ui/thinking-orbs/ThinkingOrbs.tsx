'use client';

import React from 'react';
import { ThinkingOrbsProps, ActivityState } from './types';
import { ThinkingOrb } from './ThinkingOrb';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

const defaultLabels: Record<ActivityState, { ar: string; en: string; subAr?: string; subEn?: string }> = {
  idle: {
    ar: 'في وضع الاستعداد',
    en: 'Idle',
  },
  loading: {
    ar: 'جارٍ التحميل...',
    en: 'Loading...',
  },
  thinking: {
    ar: 'جارٍ التفكير والتحليل...',
    en: 'Thinking...',
    subAr: 'تحليل المعطيات وفهم الطلب',
    subEn: 'Analyzing input & understanding intent',
  },
  searching: {
    ar: 'جارٍ البحث واسترجاع البيانات...',
    en: 'Searching...',
    subAr: 'فحص القوائم والنتائج المتاحة',
    subEn: 'Scanning available records & matches',
  },
  solving: {
    ar: 'جارٍ معالجة المشكلة...',
    en: 'Solving...',
    subAr: 'تركيب عناصر الحل الأمثل',
    subEn: 'Synthesizing the best solution',
  },
  composing: {
    ar: 'جارٍ إعداد النتيجة...',
    en: 'Composing...',
    subAr: 'صياغة وتنسيق المخرجات النهائية',
    subEn: 'Formatting and generating result',
  },
  listening: {
    ar: 'جارٍ الاستماع...',
    en: 'Listening...',
    subAr: 'التقاط ومعالجة الصوت المباشر',
    subEn: 'Capturing live audio input',
  },
  success: {
    ar: 'تمت العملية بنجاح',
    en: 'Completed successfully',
  },
  error: {
    ar: 'حدث خطأ أثناء المعالجة',
    en: 'An error occurred',
    subAr: 'يرجى المحاولة مرة أخرى لاحقاً',
    subEn: 'Please try again later',
  },
};

export const ThinkingOrbs: React.FC<ThinkingOrbsProps> = ({
  state,
  size = 'md',
  label,
  subLabel,
  showLabel = true,
  showIcon = false,
  audioLevel = 0,
  action,
  inline = false,
  className,
}) => {
  if (state === 'idle') return null;

  // Language context hook (with safe fallback if outside provider)
  let isArabic = true;
  try {
    const langContext = useLanguage();
    if (langContext?.language) {
      isArabic = langContext.language === 'ar';
    }
  } catch {
    isArabic = true;
  }

  const defaultText = isArabic
    ? defaultLabels[state]?.ar || defaultLabels[state]?.en
    : defaultLabels[state]?.en;

  const defaultSubText = isArabic
    ? defaultLabels[state]?.subAr || defaultLabels[state]?.subEn
    : defaultLabels[state]?.subEn;

  const displayLabel = label !== undefined ? label : defaultText;
  const displaySubLabel = subLabel !== undefined ? subLabel : defaultSubText;

  // ══════════════ Inline Mode (for Buttons & Input Fields) ══════════════
  if (inline) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 align-middle text-current font-medium transition-all',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
          className
        )}
      >
        <ThinkingOrb state={state} size={size} audioLevel={audioLevel} />
        {showLabel && displayLabel && (
          <span className="truncate leading-none">{displayLabel}</span>
        )}
      </span>
    );
  }

  // ══════════════ Block / Standalone Mode ══════════════
  const sizeWrapperStyles = {
    sm: 'p-2 gap-2 text-xs',
    md: 'p-4 gap-3 text-sm',
    lg: 'p-6 gap-4 text-base',
  }[size];

  const labelSizeStyles = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-bold',
    lg: 'text-base md:text-lg font-black',
  }[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center transition-all duration-300 animate-in fade-in-50',
        sizeWrapperStyles,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Orb Visual */}
      <div className="relative">
        <ThinkingOrb state={state} size={size} audioLevel={audioLevel} />
      </div>

      {/* Text Label & Sublabel */}
      {showLabel && (
        <div className="space-y-0.5 max-w-sm">
          {displayLabel && (
            <p
              className={cn(
                'text-foreground transition-colors duration-200',
                labelSizeStyles,
                state === 'error' && 'text-destructive',
                state === 'success' && 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {displayLabel}
            </p>
          )}
          {displaySubLabel && (
            <p className="text-[11px] md:text-xs text-muted-foreground transition-colors duration-200">
              {displaySubLabel}
            </p>
          )}
        </div>
      )}

      {/* Action Button (e.g. Retry or Cancel) */}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
