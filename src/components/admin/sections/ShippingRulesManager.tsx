'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  MapPin, 
  DollarSign, 
  Truck, 
  Save, 
  Check, 
  Sliders, 
  Sparkles,
  Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export function ShippingRulesManager() {
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(15000);
  const [isFreeShippingEnabled, setIsFreeShippingEnabled] = useState(true);

  // Regional zone rates
  const [northHomeRate, setNorthHomeRate] = useState(600);
  const [northDeskRate, setNorthDeskRate] = useState(400);

  const [highlandsHomeRate, setHighlandsHomeRate] = useState(750);
  const [highlandsDeskRate, setHighlandsDeskRate] = useState(500);

  const [southHomeRate, setSouthHomeRate] = useState(1100);
  const [southDeskRate, setSouthDeskRate] = useState(800);

  const [extraKgFee, setExtraKgFee] = useState(50);

  const handleSave = () => {
    toast({
      title: 'تم حفظ قواعد وتسعيرات الشحن بنجاح ✓',
      description: 'تم تحديث مصفوفة الأسعار للمناطق والولايات الـ 58.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">قواعد التسعير والمناطق الجغرافية (58 ولاية)</h3>
          <p className="text-xs text-muted-foreground">
            تحديد أسعار التوصيل الافتراضية، تسعيرة الكيلوغرام الإضافي، وشروط الشحن المجاني التلقائي.
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="rounded-xl font-bold h-10 px-5 text-xs bg-primary text-primary-foreground gap-1.5 shadow-sm"
        >
          <Save className="h-4 w-4" />
          <span>حفظ القواعد</span>
        </Button>
      </div>

      {/* Free Shipping Rule Banner */}
      <Card className="rounded-3xl border border-border shadow-sm p-5 bg-gradient-to-r from-amber-500/10 via-card to-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <Label className="text-sm font-bold text-foreground">الشحن المجاني التلقائي للطلبات الكبيرة</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              عندما تتجاوز سلة تسوق العميل هذا المبلغ، يتم احتساب رسوم الشحن كـ 0 دج تلقائياً.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                disabled={!isFreeShippingEnabled}
                className="h-10 w-32 text-xs font-bold text-center rounded-xl"
              />
              <span className="text-xs font-bold text-muted-foreground">دج</span>
            </div>
            <Switch
              checked={isFreeShippingEnabled}
              onCheckedChange={setIsFreeShippingEnabled}
            />
          </div>
        </div>
      </Card>

      {/* Pricing Zones Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Zone 1: North */}
        <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <Badge className="w-fit bg-primary/10 text-primary font-bold text-[10px]">المنطقة 1</Badge>
            <CardTitle className="text-sm font-bold text-foreground">المنطقة الشمالية والساحلية</CardTitle>
            <CardDescription className="text-[11px]">
              الجزائر، وهران، قسنطينة، عنابة، البليدة، تيبازة، بومرداس...
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">توصيل منزلي (À Domicile):</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={northHomeRate}
                  onChange={(e) => setNorthHomeRate(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl font-bold"
                />
                <span className="text-xs font-bold text-muted-foreground">دج</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">استلام من المكتب (Stop Desk):</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={northDeskRate}
                  onChange={(e) => setNorthDeskRate(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl font-bold"
                />
                <span className="text-xs font-bold text-muted-foreground">دج</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>مدة التوصيل:</span>
              <strong>24 - 48 ساعة</strong>
            </div>
          </CardContent>
        </Card>

        {/* Zone 2: Highlands */}
        <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <Badge className="w-fit bg-primary/10 text-primary font-bold text-[10px]">المنطقة 2</Badge>
            <CardTitle className="text-sm font-bold text-foreground">الهضاب العليا والوسط</CardTitle>
            <CardDescription className="text-[11px]">
              سطيف، باتنة، الجلفة، تيارت، المسيلة، برج بوعريريج، المدية...
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">توصيل منزلي (À Domicile):</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={highlandsHomeRate}
                  onChange={(e) => setHighlandsHomeRate(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl font-bold"
                />
                <span className="text-xs font-bold text-muted-foreground">دج</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">استلام من المكتب (Stop Desk):</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={highlandsDeskRate}
                  onChange={(e) => setHighlandsDeskRate(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl font-bold"
                />
                <span className="text-xs font-bold text-muted-foreground">دج</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>مدة التوصيل:</span>
              <strong>2 - 3 أيام</strong>
            </div>
          </CardContent>
        </Card>

        {/* Zone 3: South */}
        <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <Badge className="w-fit bg-primary/10 text-primary font-bold text-[10px]">المنطقة 3</Badge>
            <CardTitle className="text-sm font-bold text-foreground">ولايات الجنوب والصحراء</CardTitle>
            <CardDescription className="text-[11px]">
              أدرار، تمنراست، ورقلة، الوادي، غرداية، بشار، تندوف، إليزي...
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">توصيل منزلي (À Domicile):</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={southHomeRate}
                  onChange={(e) => setSouthHomeRate(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl font-bold"
                />
                <span className="text-xs font-bold text-muted-foreground">دج</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">استلام من المكتب (Stop Desk):</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={southDeskRate}
                  onChange={(e) => setSouthDeskRate(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl font-bold"
                />
                <span className="text-xs font-bold text-muted-foreground">دج</span>
              </div>
            </div>

            <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <span>مدة التوصيل:</span>
              <strong>3 - 5 أيام</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight Tier Settings */}
      <Card className="rounded-3xl border border-border shadow-sm p-5 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">رسوم الكيلوغرام الإضافي (Extra Weight Fee)</Label>
            <p className="text-[11px] text-muted-foreground">
              تضاف هذه الرسوم لكل كيلوغرام يتجاوز الوزن الأساسي (5 كغ).
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={extraKgFee}
              onChange={(e) => setExtraKgFee(Number(e.target.value))}
              className="h-9 w-28 text-xs font-bold text-center rounded-xl"
            />
            <span className="text-xs font-bold text-muted-foreground">دج / كغ</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
