'use client';

import { supabase } from '@/lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  tier: number;
  features: string[];
  limits: {
    maxProducts?: number;
    commissionRate?: number;
    featuredDays?: number;
    smsAlerts?: boolean;
    [key: string]: any;
  };
  isActive: boolean;
}

export interface StoreSubscription {
  id: string;
  storeId: string;
  storeName?: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'pending_payment';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  paymentMethod?: string;
  transactionReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId?: string;
  storeId: string;
  planId: string;
  amountDa: number;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: string;
  transactionId?: string;
  receiptUrl?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  notes?: string;
  verifiedBy?: string;
  paidAt?: string;
  createdAt: string;
}

const DEFAULT_FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Starter Store',
    nameAr: 'المتجر المبتدئ (مجاني)',
    slug: 'starter-store',
    description: 'خطة البدء المجانية لجميع التجار المبتدئين لعرض المنتجات الأساسية.',
    priceMonthly: 0,
    priceYearly: 0,
    tier: 1,
    features: ['عرض حتى 20 منتج', 'عمولة منصة 10%', 'دعم فني عبر التذاكر', 'تقارير مبيعات شهرية'],
    limits: { maxProducts: 20, commissionRate: 0.1, featuredDays: 0, smsAlerts: false },
    isActive: true,
  },
  {
    id: 'basic',
    name: 'Growth Merchant',
    nameAr: 'التاجر الصاعد (أساسي)',
    slug: 'growth-merchant',
    description: 'خطة مثالية للمتاجر النشطة الراغبة في توسيع مبيعاتها والاستفادة من عمولة مخفضة.',
    priceMonthly: 2500,
    priceYearly: 25000,
    tier: 2,
    features: ['عرض حتى 150 منتج', 'عمولة مخفضة 7%', 'حماية الشحنات المرتجعة 30%', 'شارة متجر موثق', 'إشعارات SMS فورية'],
    limits: { maxProducts: 150, commissionRate: 0.07, featuredDays: 3, smsAlerts: true },
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Professional Brand',
    nameAr: 'العلامة الاحترافية (برو)',
    slug: 'pro-brand',
    description: 'خطة متقدمة للمتاجر الكبرى والشركات مع حماية شحن متقدمة وعمولة منخفضة.',
    priceMonthly: 5900,
    priceYearly: 59000,
    tier: 3,
    features: ['عرض منتجات غير محدود', 'عمولة مخفضة 5%', 'حماية شحنات مرتجعة 60%', 'أولوية ظهور في نتائج البحث', 'مدير حساب مخصص', 'أدوات تحليلات متقدمة'],
    limits: { maxProducts: 10000, commissionRate: 0.05, featuredDays: 10, smsAlerts: true },
    isActive: true,
  },
  {
    id: 'premium_annual',
    name: 'Enterprise VIP',
    nameAr: 'المؤسسات والموزعون (VIP)',
    slug: 'enterprise-vip',
    description: 'شراكة استراتيجية سنوية مع أدوات ربط API وحملات تسويقية حصرية.',
    priceMonthly: 9900,
    priceYearly: 95000,
    tier: 4,
    features: ['كافة ميزات Pro', 'عمولة 4% فقط', 'حماية شحنات 100%', 'لافتة رئيسية في الصفحة الرئيسية', 'تكامل API للمخزون', 'دعم فني فوري 24/7'],
    limits: { maxProducts: 50000, commissionRate: 0.04, featuredDays: 30, smsAlerts: true },
    isActive: true,
  },
];

class SubscriptionService {
  private STORAGE_KEY_SUBSCRIPTIONS = 'khidmatik_store_subscriptions_cache';
  private STORAGE_KEY_PAYMENTS = 'khidmatik_subscription_payments_cache';

  /**
   * Fetch all active subscription plans from Supabase
   */
  public async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true });

      if (error || !data || data.length === 0) {
        return DEFAULT_FALLBACK_PLANS;
      }

      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        nameAr: d.name_ar,
        slug: d.slug,
        description: d.description || '',
        priceMonthly: parseFloat(d.price_monthly) || 0,
        priceYearly: parseFloat(d.price_yearly) || 0,
        tier: d.tier,
        features: Array.isArray(d.features) ? d.features : [],
        limits: d.limits || {},
        isActive: d.is_active,
      }));
    } catch (e) {
      console.warn('Fallback to local plans due to connection error:', e);
      return DEFAULT_FALLBACK_PLANS;
    }
  }

  /**
   * Get active subscription for a specific store
   */
  public async getStoreSubscription(storeId: string): Promise<StoreSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('store_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return this.mapDbSubscription(data);
      }
    } catch (e) {
      console.warn('Error fetching subscription from Supabase:', e);
    }

    // LocalStorage fallback
    const cached = this.getLocalSubscriptions();
    const found = cached.find((s) => s.storeId === storeId);
    return found || null;
  }

  /**
   * Request a new subscription or upgrade
   */
  public async requestSubscription(params: {
    storeId: string;
    storeName?: string;
    planId: string;
    billingCycle: 'monthly' | 'yearly';
    paymentMethod: string;
    transactionReference?: string;
    receiptUrl?: string;
  }): Promise<{ success: boolean; subscriptionId: string; error?: string }> {
    const plans = await this.getSubscriptionPlans();
    const selectedPlan = plans.find((p) => p.id === params.planId) || plans[0];
    const amount = params.billingCycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;

    const startDate = new Date();
    const endDate = new Date();
    if (params.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const initialStatus = amount === 0 ? 'active' : 'pending_payment';

    try {
      // 1. Insert into store_subscriptions
      const { data: subData, error: subError } = await supabase
        .from('store_subscriptions')
        .insert({
          store_id: params.storeId,
          plan_id: params.planId,
          status: initialStatus,
          billing_cycle: params.billingCycle,
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          payment_method: params.paymentMethod,
          transaction_reference: params.transactionReference,
        })
        .select()
        .single();

      if (!subError && subData) {
        // 2. Insert payment record if amount > 0
        if (amount > 0) {
          await supabase.from('subscription_payments').insert({
            subscription_id: subData.id,
            store_id: params.storeId,
            plan_id: params.planId,
            amount_da: amount,
            billing_cycle: params.billingCycle,
            payment_method: params.paymentMethod,
            transaction_id: params.transactionReference,
            receipt_url: params.receiptUrl,
            status: 'pending',
          });
        }

        // If free plan, also sync store.subscription_plan in stores table
        if (amount === 0) {
          await supabase
            .from('stores')
            .update({ subscription_plan: params.planId })
            .eq('id', params.storeId);
        }

        return { success: true, subscriptionId: subData.id };
      }
    } catch (e: any) {
      console.warn('Supabase subscription insert failed, saving to cache:', e);
    }

    // Local fallback
    const localId = `sub_${Date.now()}`;
    const newSub: StoreSubscription = {
      id: localId,
      storeId: params.storeId,
      storeName: params.storeName,
      planId: params.planId,
      plan: selectedPlan,
      status: initialStatus,
      billingCycle: params.billingCycle,
      currentPeriodStart: startDate.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      cancelAtPeriodEnd: false,
      paymentMethod: params.paymentMethod,
      transactionReference: params.transactionReference,
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString(),
    };

    const subs = this.getLocalSubscriptions();
    subs.unshift(newSub);
    this.saveLocalSubscriptions(subs);

    return { success: true, subscriptionId: localId };
  }

  /**
   * Confirm subscription payment (Admin / System)
   * Activates the subscription and updates dates
   */
  public async confirmSubscriptionPayment(paymentId: string, adminUserId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Update payment status in Supabase
      const { data: payment, error: payErr } = await supabase
        .from('subscription_payments')
        .update({
          status: 'confirmed',
          verified_by: adminUserId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (!payErr && payment) {
        // 2. Activate store subscription
        if (payment.subscription_id) {
          await supabase
            .from('store_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.subscription_id);
        }

        // 3. Update store table subscription_plan
        await supabase
          .from('stores')
          .update({
            subscription_plan: payment.plan_id,
          })
          .eq('id', payment.store_id);

        return { success: true };
      }
    } catch (e: any) {
      console.warn('Error confirming subscription payment in DB:', e);
    }

    return { success: true };
  }

  /**
   * Get all subscriptions for Admin Dashboard
   */
  public async getAllSubscriptions(): Promise<StoreSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('store_subscriptions')
        .select(`
          *,
          store:stores(name, owner_id),
          plan:subscription_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          ...this.mapDbSubscription(d),
          storeName: d.store?.name || 'Store',
        }));
      }
    } catch (e) {
      console.warn('Error fetching all subscriptions from Supabase:', e);
    }

    return this.getLocalSubscriptions();
  }

  private mapDbSubscription(d: any): StoreSubscription {
    return {
      id: d.id,
      storeId: d.store_id,
      planId: d.plan_id,
      plan: d.plan
        ? {
            id: d.plan.id,
            name: d.plan.name,
            nameAr: d.plan.name_ar,
            slug: d.plan.slug,
            description: d.plan.description || '',
            priceMonthly: parseFloat(d.plan.price_monthly) || 0,
            priceYearly: parseFloat(d.plan.price_yearly) || 0,
            tier: d.plan.tier,
            features: d.plan.features || [],
            limits: d.plan.limits || {},
            isActive: d.plan.is_active,
          }
        : undefined,
      status: d.status,
      billingCycle: d.billing_cycle,
      currentPeriodStart: d.current_period_start,
      currentPeriodEnd: d.current_period_end,
      cancelAtPeriodEnd: d.cancel_at_period_end,
      canceledAt: d.canceled_at,
      paymentMethod: d.payment_method,
      transactionReference: d.transaction_reference,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    };
  }

  private getLocalSubscriptions(): StoreSubscription[] {
    if (typeof window === 'undefined') return [];
    try {
      const s = localStorage.getItem(this.STORAGE_KEY_SUBSCRIPTIONS);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return [];
  }

  private saveLocalSubscriptions(subs: StoreSubscription[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
    } catch (e) {}
  }
}

export const subscriptionService = new SubscriptionService();
