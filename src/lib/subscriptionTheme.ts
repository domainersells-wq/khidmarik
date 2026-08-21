import * as LucideIcons from 'lucide-react';
import React from 'react';

export type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TierThemeConfig {
  id: SubscriptionTier;
  nameEn: string;
  nameAr: string;
  iconName: keyof typeof LucideIcons;
  accentColor: string; // Hex color
  accentHsl: string;   // HSL triple like "270 91% 65%"
  coverGradient: string;
  avatarFrameBorder: string;
  badgeClass: string;
  textClass: string;
  cardBorderClass: string;
  progressClass: string;
  buttonClass: string;
  chartColor: string;
  qrFrameColor: string;
  hasGlow: boolean;
  hasShine: boolean;
  hasBorderSweep: boolean;
}

export const TIER_THEMES: Record<SubscriptionTier, TierThemeConfig> = {
  free: {
    id: 'free',
    nameEn: 'Free Plan',
    nameAr: 'الحساب المجاني',
    iconName: 'Shield',
    accentColor: '#64748b',
    accentHsl: '215 16% 47%',
    coverGradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)',
    avatarFrameBorder: 'border-slate-300 dark:border-slate-700 border-2',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700',
    textClass: 'text-slate-600 dark:text-slate-400',
    cardBorderClass: 'border-slate-200 dark:border-slate-800',
    progressClass: 'bg-slate-100 dark:bg-slate-800/20 [&>div]:bg-slate-500',
    buttonClass: 'bg-slate-600 hover:bg-slate-700 text-white',
    chartColor: '#64748b',
    qrFrameColor: '#94a3b8',
    hasGlow: false,
    hasShine: false,
    hasBorderSweep: false
  },
  bronze: {
    id: 'bronze',
    nameEn: 'Bronze Plan',
    nameAr: 'الباقة البرونزية',
    iconName: 'Medal',
    accentColor: '#b45309',
    accentHsl: '35 91% 37%',
    coverGradient: 'linear-gradient(135deg, #7c2d12 0%, #451a03 50%, #1c1917 100%)',
    avatarFrameBorder: 'border-amber-700/80 shadow-[0_0_10px_rgba(180,83,9,0.3)] border-4',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40',
    textClass: 'text-amber-700 dark:text-amber-500',
    cardBorderClass: 'border-amber-500/30',
    progressClass: 'bg-amber-100 dark:bg-amber-900/10 [&>div]:bg-amber-700',
    buttonClass: 'bg-amber-700 hover:bg-amber-850 text-white',
    chartColor: '#b45309',
    qrFrameColor: '#d97706',
    hasGlow: false,
    hasShine: false,
    hasBorderSweep: false
  },
  silver: {
    id: 'silver',
    nameEn: 'Silver Plan',
    nameAr: 'الباقة الفضية',
    iconName: 'Award',
    accentColor: '#64748b',
    accentHsl: '215 16% 47%',
    coverGradient: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 50%, #475569 100%)',
    avatarFrameBorder: 'border-slate-300 shadow-[0_0_12px_rgba(148,163,184,0.4)] border-4 ring-2 ring-white/10',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700/50',
    textClass: 'text-slate-500 dark:text-slate-400',
    cardBorderClass: 'border-slate-300/40',
    progressClass: 'bg-slate-100 dark:bg-slate-800/20 [&>div]:bg-slate-500',
    buttonClass: 'bg-slate-500 hover:bg-slate-600 text-white',
    chartColor: '#94a3b8',
    qrFrameColor: '#cbd5e1',
    hasGlow: false,
    hasShine: false,
    hasBorderSweep: false
  },
  gold: {
    id: 'gold',
    nameEn: 'Gold Plan',
    nameAr: 'الباقة الذهبية',
    iconName: 'Crown',
    accentColor: '#eab308',
    accentHsl: '45 93% 47%',
    coverGradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #78350f 100%)',
    avatarFrameBorder: 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] border-4 ring-2 ring-yellow-300/35',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200/50 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/40',
    textClass: 'text-yellow-600 dark:text-yellow-500',
    cardBorderClass: 'border-yellow-500/45',
    progressClass: 'bg-yellow-100 dark:bg-yellow-900/10 [&>div]:bg-yellow-500',
    buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-black font-semibold',
    chartColor: '#eab308',
    qrFrameColor: '#f59e0b',
    hasGlow: false,
    hasShine: true,
    hasBorderSweep: false
  },
  platinum: {
    id: 'platinum',
    nameEn: 'Platinum Plan',
    nameAr: 'الباقة البلاتينية',
    iconName: 'Gem',
    accentColor: '#a855f7',
    accentHsl: '270 91% 65%',
    coverGradient: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
    avatarFrameBorder: 'border-transparent shadow-[0_0_20px_rgba(168,85,247,0.5)] border-4',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200/50 dark:bg-purple-900/25 dark:text-purple-300 dark:border-purple-800/40',
    textClass: 'text-purple-600 dark:text-purple-400 font-extrabold',
    cardBorderClass: 'border-purple-500/50',
    progressClass: 'bg-purple-100 dark:bg-purple-900/15 [&>div]:bg-purple-600',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20',
    chartColor: '#a855f7',
    qrFrameColor: '#c084fc',
    hasGlow: true,
    hasShine: true,
    hasBorderSweep: true
  },
  diamond: {
    id: 'diamond',
    nameEn: 'Diamond Plan',
    nameAr: 'الباقة الماسّية',
    iconName: 'Sparkles',
    accentColor: '#06b6d4',
    accentHsl: '188 86% 43%',
    coverGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #4f46e5 100%)',
    avatarFrameBorder: 'border-transparent shadow-[0_0_25px_rgba(6,182,212,0.6)] border-4',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200/50 dark:bg-cyan-900/25 dark:text-cyan-300 dark:border-cyan-800/40',
    textClass: 'text-cyan-600 dark:text-cyan-400 font-black tracking-wide',
    cardBorderClass: 'border-cyan-400/60',
    progressClass: 'bg-cyan-100 dark:bg-cyan-900/15 [&>div]:bg-cyan-500',
    buttonClass: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/25',
    chartColor: '#06b6d4',
    qrFrameColor: '#22d3ee',
    hasGlow: true,
    hasShine: true,
    hasBorderSweep: true
  }
};

export interface CustomizationSettings {
  frameColor?: string; // hex color
  frameShape?: 'circle' | 'rounded-square' | 'hexagon';
  coverStyle?: 'solid' | 'gradient' | 'mesh' | 'stripes' | 'image';
  coverUrl?: string; // Base64 or URL for custom cover photo
  identityColor?: string; // hex or Tailwind color
  badgeStyle?: 'classic' | 'floating' | 'glass' | 'minimal';
  cardStyle?: 'glass' | 'neon' | 'classic' | 'flat';
}

export const DEFAULT_CUSTOMIZATION: Record<'platinum' | 'diamond', CustomizationSettings> = {
  platinum: {
    frameColor: '#a855f7',
    frameShape: 'circle',
    coverStyle: 'gradient',
    identityColor: '#a855f7',
    badgeStyle: 'floating',
    cardStyle: 'glass'
  },
  diamond: {
    frameColor: '#06b6d4',
    frameShape: 'circle',
    coverStyle: 'gradient',
    identityColor: '#06b6d4',
    badgeStyle: 'glass',
    cardStyle: 'neon'
  }
};

export function mapPlanToTier(planName?: string): SubscriptionTier {
  if (!planName) return 'free';
  const nameLower = planName.toLowerCase();
  if (nameLower.includes('diamond')) return 'diamond';
  if (nameLower.includes('platinum') || nameLower.includes('enterprise')) return 'platinum';
  if (nameLower.includes('gold') || nameLower.includes('business')) return 'gold';
  if (nameLower.includes('silver') || nameLower.includes('pro')) return 'silver';
  if (nameLower.includes('bronze') || nameLower.includes('basic')) return 'bronze';
  return 'free';
}

export function hexToHslTriple(hex: string): string {
  // Strip '#'
  hex = hex.replace(/^#/, '');
  // Parse r, g, b
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}
