'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Building2, 
  Check, 
  AlertCircle,
  Phone,
  Layers,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { shippingProviderFactory } from '@/services/shipping/ShippingProviderFactory';
import type { SellerShippingSettings as SellerSettingsType } from '@/types/shipping';
import { algerianWilayas } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SellerShippingSettingsProps {
  storeId?: string;
}

const DEFAULT_SETTINGS: SellerSettingsType = {
  id: 'cfg-default',
  seller_id: 'str_1',
  is_shipping_enabled: true,
  is_cod_enabled: true,
  is_pickup_enabled: true,
  default_provider_id: 'yalidine',
  enabled_providers: ['manual', 'yalidine', 'zr_express', 'maystro', 'in_house'],
  pricing_model: 'dynamic_rules',
  flat_home_rate: 600,
  flat_desk_rate: 400,
  free_shipping_threshold: 15000,
  is_free_shipping_active: true,
  pickup_address: 'المنطقة الصناعية، مستودع رقم 12',
  pickup_wilaya: '16 - Alger',
  pickup_commune: 'Bab Ezzouar',
  pickup_phone: '0550 12 34 56',
  pickup_contact_name: 'سعيد لوجستيك',
  custom_wilaya_rates: {},
};

export function SellerShippingSettings({ storeId = 'str_1' }: SellerShippingSettingsProps) {
  const [config, setConfig] = useState<SellerSettingsType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`khidmatik_seller_settings_${storeId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return { ...DEFAULT_SETTINGS, seller_id: storeId };
  });

  const [providers, setProviders] = useState(() => shippingProviderFactory.getAllProviders());
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleProvider = (providerId: string) => {
    setConfig(prev => {
      const enabled = prev.enabled_providers.includes(providerId)
        ? prev.enabled_providers.filter(id => id !== providerId)
        : [...prev.enabled_providers, providerId];
      return { ...prev, enabled_providers: enabled };
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`khidmatik_seller_settings_${storeId}`, JSON.stringify(config));
      }
      toast({
        title: 'تم حفظ إعدادات الشحن بنجاح ✓',
        description: 'تم تحديث شركات الشحن وأسعار التوصيل لمتجرك.',
      });
    } catch (e: any) {
      toast({
        title: 'خطأ في الحفظ',
        description: e.message || 'حدث خطأ أثناء حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="p-6 bg-gradient-to-r from-primary/15 via-card to-card border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              إدارة اللوجستيك
            </Badge>
            <span className="text-xs text-muted-foreground">• إعدادات الشحن والتوصيل للمتجر</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            تكامل شركات الشحن وأسعار التوصيل (58 ولاية)
          </h2>
          <p className="text-xs text-muted-foreground">
            حدد شركات التوصيل المعتمدة، عنوان الاستلام من مستودعك، وضبط تسعيرة الشحن للباب والمكتب.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl font-bold px-6 h-11 bg-primary text-primary-foreground shadow-md gap-2"
        >
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>حفظ التغييرات</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Enabled Providers & Pickup Warehouse */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Providers */}
          <Card className="rounded-3xl border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span>شركات الشحن المدعومة</span>
              </CardTitle>
              <CardDescription className="text-xs">
                اختر الشركات التي ترغب في إتاحتها لزبائنك أثناء الطلب
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {providers.map((p) => {
                const isEnabled = config.enabled_providers.includes(p.id) || config.enabled_providers.includes(p.code);
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "p-3 rounded-2xl border transition-all flex items-center justify-between",
                      isEnabled ? "bg-primary/5 border-primary/40 shadow-sm" : "bg-card border-border/60 opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{p.nameAr}</div>
                        <div className="text-[10px] text-muted-foreground">{p.name}</div>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleProvider(p.id)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Pickup Warehouse Address */}
          <Card className="rounded-3xl border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>مستودع ونقطة استلام الطرود</span>
              </CardTitle>
              <CardDescription className="text-xs">
                المكان الذي يتوجه إليه مندوبو الشحن لجمع الطرود
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">ولاية المستودع</Label>
                <select
                  value={config.pickup_wilaya}
                  onChange={(e) => setConfig({ ...config, pickup_wilaya: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs"
                >
                  {algerianWilayas.map((w) => (
                    <option key={w.code} value={`${w.code} - ${w.name_fr}`}>
                      {w.code} - {w.name} ({w.name_fr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">البلدية / الحي</Label>
                <Input
                  value={config.pickup_commune}
                  onChange={(e) => setConfig({ ...config, pickup_commune: e.target.value })}
                  placeholder="مثال: باب الزوار / حي النخيل"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">العنوان التفصيلي للمستودع</Label>
                <Input
                  value={config.pickup_address}
                  onChange={(e) => setConfig({ ...config, pickup_address: e.target.value })}
                  placeholder="المنطقة الصناعية، مستودع رقم 12"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">مسؤول الشحن</Label>
                  <Input
                    value={config.pickup_contact_name}
                    onChange={(e) => setConfig({ ...config, pickup_contact_name: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">هاتف المستودع</Label>
                  <Input
                    value={config.pickup_phone}
                    onChange={(e) => setConfig({ ...config, pickup_phone: e.target.value })}
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pricing Rules & Delivery Rates (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Free Shipping & Pricing Engine */}
          <Card className="rounded-3xl border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>قواعد تسعير الشحن والتوصيل المجاني</span>
              </CardTitle>
              <CardDescription className="text-xs">
                حدد تسعيرة التوصيل الافتراضية وشروط الشحن المجاني لزبائنك
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Free Shipping Threshold */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <Label className="text-xs font-bold text-foreground">تفعيل الشحن المجاني التلقائي</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    يحصل الزبون على شحن مجاني إذا تجاوز إجمالي سلته هذا المبلغ.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={config.free_shipping_threshold}
                      onChange={(e) => setConfig({ ...config, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                      disabled={!config.is_free_shipping_active}
                      className="h-9 w-28 text-xs font-bold text-center rounded-xl"
                    />
                    <span className="text-xs font-bold text-muted-foreground">دج</span>
                  </div>
                  <Switch
                    checked={config.is_free_shipping_active}
                    onCheckedChange={(c) => setConfig({ ...config, is_free_shipping_active: c })}
                  />
                </div>
              </div>

              {/* Default Flat Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl border bg-card space-y-2">
                  <div className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    <span>سعر التوصيل للباب (À Domicile)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={config.flat_home_rate}
                      onChange={(e) => setConfig({ ...config, flat_home_rate: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs font-bold rounded-xl"
                    />
                    <span className="text-xs font-bold text-muted-foreground">دج</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">السعر القياسي لتسليم الطرد لباب منزل الزبون</p>
                </div>

                <div className="p-4 rounded-2xl border bg-card space-y-2">
                  <div className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>سعر الاستلام من المكتب (Stop Desk)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={config.flat_desk_rate}
                      onChange={(e) => setConfig({ ...config, flat_desk_rate: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs font-bold rounded-xl"
                    />
                    <span className="text-xs font-bold text-muted-foreground">دج</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">سعر اقتصادي عند استلام الزبون لطرد من وكالة الشحن</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Algerian Wilaya Breakdown Table Preview */}
          <Card className="rounded-3xl border border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>جدول التغطية والأسعار حسب المناطق (58 ولاية)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                تطبيق التسعيرة التلقائية المحسوبة بناءً على المناطق الجغرافية
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">المنطقة الجغرافية</th>
                      <th className="p-3">الولايات المشمولة</th>
                      <th className="p-3">توصيل منزلي</th>
                      <th className="p-3">استلام من المكتب</th>
                      <th className="p-3">مدة التوصيل التقديرية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr className="hover:bg-muted/20">
                      <td className="p-3 font-bold text-foreground">المنطقة الشمالية والساحل</td>
                      <td className="p-3 text-muted-foreground">الجزائر، وهران، قسنطينة، عنابة، البليدة، تيبازة، بومرداس...</td>
                      <td className="p-3 font-bold text-primary">{config.flat_home_rate} دج</td>
                      <td className="p-3 font-bold text-foreground">{config.flat_desk_rate} دج</td>
                      <td className="p-3 text-emerald-600 font-semibold">24 - 48 ساعة</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-3 font-bold text-foreground">الهضاب العليا والوسط</td>
                      <td className="p-3 text-muted-foreground">سطيف، باتنة، الجلفة، تيارت، المسيلة، برج بوعريريج...</td>
                      <td className="p-3 font-bold text-primary">{config.flat_home_rate + 150} دج</td>
                      <td className="p-3 font-bold text-foreground">{config.flat_desk_rate + 100} دج</td>
                      <td className="p-3 text-emerald-600 font-semibold">2 - 3 أيام</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-3 font-bold text-foreground">ولايات الجنوب والصحراء</td>
                      <td className="p-3 text-muted-foreground">أدرار، تمنراست، ورقلة، الوادي، غرداية، بشار، تندوف...</td>
                      <td className="p-3 font-bold text-primary">{config.flat_home_rate + 450} دج</td>
                      <td className="p-3 font-bold text-foreground">{config.flat_desk_rate + 350} دج</td>
                      <td className="p-3 text-amber-600 font-semibold">3 - 5 أيام</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
