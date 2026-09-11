import type { CategoryMarkerConfig } from './types';

// ============================================================================
// CLEAN MINIMAL GEOMETRIC OUTLINE ICONS (Pure SVG, No Emojis, No 3D Artifacts)
// ============================================================================

export const CATEGORY_SVG_ICONS: Record<string, string> = {
  store: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`,
  craftsman: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  plumbers: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  electricians: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  restaurants: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v18"/><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/></svg>`,
  cafes: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
  pharmacies: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  doctors: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
  automotive: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
  electronics: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`,
  education: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
  cleaning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  beauty: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/><path d="m8.12 15.88 6.68-6.68"/><path d="m17.68 6.32 2.32 2.32"/></svg>`,
  company: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
  delivery: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
};

export const CATEGORY_MARKER_MAP: Record<string, CategoryMarkerConfig> = {
  craftsman: {
    categoryKey: 'craftsman',
    labelAr: 'حرفي / مهني',
    labelEn: 'Craftsman / Pro',
    labelFr: 'Artisan / Pro',
    iconSymbol: 'craftsman',
    primaryColor: '#0f172a', // Slate 900
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  plumbers: {
    categoryKey: 'plumbers',
    labelAr: 'سباك',
    labelEn: 'Plumber',
    labelFr: 'Plombier',
    iconSymbol: 'plumbers',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  electricians: {
    categoryKey: 'electricians',
    labelAr: 'كهربائي',
    labelEn: 'Electrician',
    labelFr: 'Électricien',
    iconSymbol: 'electricians',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  store: {
    categoryKey: 'store',
    labelAr: 'متجر / محل',
    labelEn: 'Store / Shop',
    labelFr: 'Magasin / Boutique',
    iconSymbol: 'store',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  restaurants: {
    categoryKey: 'restaurants',
    labelAr: 'مطعم / مأكولات',
    labelEn: 'Restaurant / Food',
    labelFr: 'Restaurant',
    iconSymbol: 'restaurants',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  cafes: {
    categoryKey: 'cafes',
    labelAr: 'مقهى',
    labelEn: 'Cafe',
    labelFr: 'Café',
    iconSymbol: 'cafes',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  pharmacies: {
    categoryKey: 'pharmacies',
    labelAr: 'صيدلية',
    labelEn: 'Pharmacy',
    labelFr: 'Pharmacie',
    iconSymbol: 'pharmacies',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  doctors: {
    categoryKey: 'doctors',
    labelAr: 'طبيب / عيادة',
    labelEn: 'Clinic / Doctor',
    labelFr: 'Médecin / Clinique',
    iconSymbol: 'doctors',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  automotive: {
    categoryKey: 'automotive',
    labelAr: 'خدمات سيارات',
    labelEn: 'Car Service',
    labelFr: 'Service Auto',
    iconSymbol: 'automotive',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  electronics: {
    categoryKey: 'electronics',
    labelAr: 'إلكترونيات وهواتف',
    labelEn: 'Electronics',
    labelFr: 'Électronique',
    iconSymbol: 'electronics',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  education: {
    categoryKey: 'education',
    labelAr: 'تعليم وتدريب',
    labelEn: 'Education & Tutoring',
    labelFr: 'Éducation',
    iconSymbol: 'education',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  cleaning: {
    categoryKey: 'cleaning',
    labelAr: 'تنظيف وصيانة',
    labelEn: 'Cleaning Services',
    labelFr: 'Nettoyage',
    iconSymbol: 'cleaning',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  beauty: {
    categoryKey: 'beauty',
    labelAr: 'حلاقة و تجميل',
    labelEn: 'Beauty & Salon',
    labelFr: 'Beauté & Coiffure',
    iconSymbol: 'beauty',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  company: {
    categoryKey: 'company',
    labelAr: 'شركة ومؤسسة',
    labelEn: 'Company / Firm',
    labelFr: 'Entreprise',
    iconSymbol: 'company',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  },
  default: {
    categoryKey: 'default',
    labelAr: 'خدمة معتمدة',
    labelEn: 'Verified Service',
    labelFr: 'Service Vérifié',
    iconSymbol: 'default',
    primaryColor: '#0f172a',
    badgeBg: '#f8fafc',
    textColor: '#0f172a',
  }
};

export function getCategoryMarkerConfig(categorySlug?: string, type?: string): CategoryMarkerConfig {
  if (!categorySlug && !type) return CATEGORY_MARKER_MAP.default;

  const key = (categorySlug || type || '').toLowerCase();
  
  if (key.includes('plumb') || key.includes('سباك')) return CATEGORY_MARKER_MAP.plumbers;
  if (key.includes('electr') || key.includes('كهرب')) return CATEGORY_MARKER_MAP.electricians;
  if (key.includes('craft') || key.includes('artisan') || key.includes('حرف') || key.includes('handyman') || key.includes('paint') || key.includes('hvac')) return CATEGORY_MARKER_MAP.craftsman;
  if (key.includes('pharma') || key.includes('صيدل')) return CATEGORY_MARKER_MAP.pharmacies;
  if (key.includes('doc') || key.includes('medic') || key.includes('طبيب') || key.includes('عيادة') || key.includes('clinic')) return CATEGORY_MARKER_MAP.doctors;
  if (key.includes('cafe') || key.includes('مقهى') || key.includes('قهوة') || key.includes('coffee')) return CATEGORY_MARKER_MAP.cafes;
  if (key.includes('rest') || key.includes('food') || key.includes('مطعم') || key.includes('مأكول') || key.includes('pizza') || key.includes('burger')) return CATEGORY_MARKER_MAP.restaurants;
  if (key.includes('auto') || key.includes('car') || key.includes('سيار') || key.includes('mecanic') || key.includes('ميكانيك')) return CATEGORY_MARKER_MAP.automotive;
  if (key.includes('elec') || key.includes('tech') || key.includes('laptop') || key.includes('إلكترون') || key.includes('phone') || key.includes('هاتف')) return CATEGORY_MARKER_MAP.electronics;
  if (key.includes('edu') || key.includes('tutor') || key.includes('تعليم') || key.includes('book') || key.includes('تدريب')) return CATEGORY_MARKER_MAP.education;
  if (key.includes('clean') || key.includes('نظاف') || key.includes('غسيل')) return CATEGORY_MARKER_MAP.cleaning;
  if (key.includes('beauty') || key.includes('hair') || key.includes('صالون') || key.includes('حلاق') || key.includes('تجميل')) return CATEGORY_MARKER_MAP.beauty;
  if (key.includes('comp') || key.includes('firm') || key.includes('شرك') || key.includes('مؤسس')) return CATEGORY_MARKER_MAP.company;
  if (key.includes('store') || key.includes('shop') || key.includes('متجر') || key.includes('محل') || type === 'store') return CATEGORY_MARKER_MAP.store;

  return CATEGORY_MARKER_MAP.default;
}

/**
 * Generates clean, minimal, white rounded map markers with outline SVG icons
 * Matches modern professional navigation application designs
 */
export function generateCustomMarkerHtml(
  config: CategoryMarkerConfig,
  label: string,
  rating: number,
  isSelected: boolean = false,
  isSponsored: boolean = false,
  logoUrl?: string
): string {
  const iconKey = config.iconSymbol || 'default';
  const rawSvg = CATEGORY_SVG_ICONS[iconKey] || CATEGORY_SVG_ICONS.default;

  return `
    <div class="relative flex flex-col items-center select-none cursor-pointer group transition-all duration-200 ${isSelected ? 'z-50 scale-110' : 'hover:scale-105'}">
      <!-- Sponsored Badge -->
      ${isSponsored ? `
        <div class="absolute -top-3.5 px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[9px] font-bold shadow-sm leading-tight tracking-wider">
          AD
        </div>
      ` : ''}

      <!-- Rating Tag on Selected -->
      ${isSelected && rating > 0 ? `
        <div class="mb-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow-md flex items-center gap-1 animate-in fade-in zoom-in-95">
          <span class="text-amber-400 text-[10px]">★</span>
          <span>${rating.toFixed(1)}</span>
        </div>
      ` : ''}

      <!-- Main Marker Container -->
      <div class="relative h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border ${isSelected ? 'border-primary ring-2 ring-primary/25 shadow-lg' : 'border-slate-200/90 dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.10)]'} flex items-center justify-center transition-all ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}">
        ${logoUrl ? `
          <img src="${logoUrl}" alt="${label}" class="h-6 w-6 rounded-lg object-contain" />
        ` : rawSvg}
        
        <!-- Bottom Pointer Triangle -->
        <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${isSelected ? 'border-t-primary' : 'border-t-slate-200/90 dark:border-t-slate-700'}"></div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-white dark:border-t-slate-900"></div>
      </div>
    </div>
  `;
}

/**
 * Generates clean, minimal cluster marker
 */
export function generateClusterMarkerHtml(count: number): string {
  return `
    <div class="relative flex items-center justify-center select-none cursor-pointer">
      <div class="h-9 min-w-[36px] px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs">
        <span>${count}</span>
      </div>
    </div>
  `;
}
