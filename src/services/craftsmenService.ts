import { CraftsmanOrder, ServiceEmergencyCategory, SparePartItem, JobVerificationPhotos, OtpSecurityState, MutualReviewState } from '@/types/craftsmen';

const STORAGE_KEY_ORDERS = 'khidmatik_craftsman_orders';
const STORAGE_KEY_DUTY_STATUS = 'khidmatik_craftsman_duty_status';

export const INITIAL_MOCK_ORDER: CraftsmanOrder = {
  id: 'SOS-2026-8941',
  serviceTitleAr: 'إصلاح تسرب مياه وانفجار أنبوب طارئ',
  serviceTitleEn: 'Emergency Pipe Burst & Leak Repair',
  category: 'plumbing_leak',
  isEmergency: true,
  emergencyRadiusKm: 8,
  customer: {
    id: 'cust_0192',
    name: 'كريم بلقاسم (Karim B.)',
    phone: '0550 12 34 56',
    maskedPhone: '0550 •• •• 56',
    wilaya: 'الجزائر العاصمة (Alger)',
    address: 'حي 150 مسكن، دالي إبراهيم، عمارة B3',
    maskedAddress: 'دالي إبراهيم (Dely Ibrahim)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 4.9
  },
  craftsman: {
    id: 'craft_8820',
    name: 'معلم عمار بلحاج (Ammar B.)',
    phone: '0661 98 76 54',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Top Rated Pro',
    rating: 4.95,
    completedJobsCount: 142,
    currentDistanceKm: 3.4,
    estimatedArrivalMinutes: 12,
    specialtyAr: 'حرفي ترصيص صحي وكهرباء معتمد',
    specialtyEn: 'Certified Master Plumber'
  },
  status: 'REQUESTED',
  quotation: {
    laborType: 'fixed_quote',
    laborCostDA: 3500,
    spareParts: [
      {
        id: 'PART-001',
        name: 'صمام أمان نحاسي أصلي (3/4 Brass Valve)',
        nameAr: 'صمام أمان نحاسي أصلي (3/4 Brass Valve)',
        priceDA: 1800,
        quantity: 1,
        receiptPhotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60',
        addedAt: '14:25',
        status: 'approved'
      }
    ],
    emergencySurgeFeeDA: 1500,
    platformCommissionRate: 0.05,
    vatRate: 0
  },
  verificationPhotos: {
    beforePhotoUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    beforeTimestamp: '14:30',
    beforeNotes: 'توثيق كسر الأنبوب وتسرب المياه',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    afterTimestamp: '15:15',
    afterNotes: 'تم الاستبدال والتثبيت واختبار الضغط',
    showcaseInPortfolio: true,
    customerAnonymityConfirmed: true
  },
  otpSecurity: {
    startOtp: '4892',
    startOtpEntered: '',
    startOtpAttempts: 0,
    isStartOtpVerified: false,
    completionOtp: '7315',
    completionOtpEntered: '',
    completionOtpAttempts: 0,
    isCompletionOtpVerified: false,
    isLockedOut: false
  },
  reviews: {
    isRevealed: false
  },
  createdAt: '2026-08-20 14:10',
  updatedAt: '2026-08-20 14:15'
};

export const craftsmenService = {
  // Get active order or initialize default
  getActiveOrder: (): CraftsmanOrder => {
    if (typeof window === 'undefined') return INITIAL_MOCK_ORDER;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.error('Error loading craftsman order:', e);
    }
    return INITIAL_MOCK_ORDER;
  },

  // Save/Update order
  saveOrder: (order: CraftsmanOrder): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(order));
      window.dispatchEvent(new CustomEvent('khidmatik_order_updated', { detail: order }));
    } catch (e) {
      console.error('Error saving craftsman order:', e);
    }
  },

  // Create new SOS Request
  createEmergencyOrder: (
    category: ServiceEmergencyCategory,
    radiusKm: number,
    surgeFeeDA: number,
    customerInfo?: { name: string; phone: string; wilaya: string; address: string }
  ): CraftsmanOrder => {
    const categoriesTitle: Record<ServiceEmergencyCategory, { ar: string; en: string }> = {
      plumbing_leak: { ar: 'إصلاح تسرب مياه وانفجار أنبوب طارئ', en: 'Emergency Pipe Burst & Leak Repair' },
      electrical_outage: { ar: 'انقطاع كهرباء وخلل في القواطع الرئيسية', en: 'Electrical Short & Breaker Outage' },
      locksmith_locked_out: { ar: 'فتح قفل باب طارئ / مفتاح مكسور', en: 'Lockout & Broken Key Emergency' },
      gas_leak_safety: { ar: 'تأمين وفحص تسرب غاز وخلل تدفئة', en: 'Gas Leak & Heating Safety Repair' },
      ac_heating_failure: { ar: 'صيانة طارئة لعطل مكيف وتدفئة', en: 'HVAC Critical Breakdown Repair' },
      roof_drainage_emergency: { ar: 'تصريف مياه وانسداد مجاري طارئ', en: 'Urgent Drainage & Flood Cleanout' }
    };

    const title = categoriesTitle[category] || categoriesTitle.plumbing_leak;
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder: CraftsmanOrder = {
      id: `SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceTitleAr: title.ar,
      serviceTitleEn: title.en,
      category,
      isEmergency: true,
      emergencyRadiusKm: radiusKm,
      customer: {
        id: `cust_${Date.now().toString().slice(-4)}`,
        name: customerInfo?.name || 'كريم بلقاسم (Karim B.)',
        phone: customerInfo?.phone || '0550 12 34 56',
        maskedPhone: '0550 •• •• 56',
        wilaya: customerInfo?.wilaya || 'الجزائر العاصمة (Alger)',
        address: customerInfo?.address || 'حي 150 مسكن، دالي إبراهيم، عمارة B3',
        maskedAddress: 'دالي إبراهيم (Dely Ibrahim)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 4.9
      },
      craftsman: {
        id: 'craft_8820',
        name: 'معلم عمار بلحاج (Ammar B.)',
        phone: '0661 98 76 54',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        badge: 'Top Rated Pro',
        rating: 4.95,
        completedJobsCount: 142,
        currentDistanceKm: Math.round((Math.random() * 4 + 1.5) * 10) / 10,
        estimatedArrivalMinutes: Math.round(Math.random() * 10 + 10),
        specialtyAr: 'حرفي ترصيص صحي وكهرباء معتمد',
        specialtyEn: 'Certified Master Plumber'
      },
      status: 'REQUESTED',
      quotation: {
        laborType: 'fixed_quote',
        laborCostDA: 3500,
        spareParts: [],
        emergencySurgeFeeDA: surgeFeeDA,
        platformCommissionRate: 0.05,
        vatRate: 0
      },
      verificationPhotos: {
        showcaseInPortfolio: true,
        customerAnonymityConfirmed: true
      },
      otpSecurity: {
        startOtp,
        startOtpEntered: '',
        startOtpAttempts: 0,
        isStartOtpVerified: false,
        completionOtp,
        completionOtpEntered: '',
        completionOtpAttempts: 0,
        isCompletionOtpVerified: false,
        isLockedOut: false
      },
      reviews: {
        isRevealed: false
      },
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    craftsmenService.saveOrder(newOrder);
    return newOrder;
  },

  // Craftsman On-Duty Status
  getDutyStatus: (): boolean => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DUTY_STATUS);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return true;
  },

  setDutyStatus: (onDuty: boolean): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_DUTY_STATUS, JSON.stringify(onDuty));
    } catch (e) {
      console.error(e);
    }
  }
};
