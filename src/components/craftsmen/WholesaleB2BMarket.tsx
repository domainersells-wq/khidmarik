'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Flame, 
  Layers, 
  FileText,
  Search,
  Filter,
  Check,
  CreditCard,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { algerianWilayas } from '@/data/algerian-wilayas';

export interface WholesaleItem {
  id: string;
  name: string;
  sku: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'hardware';
  categoryLabelAr: string;
  retailPrice: number;
  wholesalePrice: number;
  discountPercent: number;
  minimumPack: number;
  unit: string;
  stockAvailable: number;
  imageUrl: string;
  supplierName: string;
  supplierWilaya: string;
}

const WHOLESALE_CATALOG: WholesaleItem[] = [
  {
    id: 'b2b-01',
    name: 'لفة أنابيب نحاس معزول 1/2 و 3/8 للمكيفات (15 متر)',
    sku: 'COP-15M-INSUL',
    category: 'hvac',
    categoryLabelAr: 'تكييف وتبريد',
    retailPrice: 12500,
    wholesalePrice: 8900,
    discountPercent: 29,
    minimumPack: 1,
    unit: 'لفة 15 متر',
    stockAvailable: 45,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
    supplierName: 'مؤسسة التبريد الشامل (Ets Froid Algérie)',
    supplierWilaya: 'الجزائر العاصمة',
  },
  {
    id: 'b2b-02',
    name: 'أسطوانة غاز فريون R410A أصلية نقية (11.3 كغ)',
    sku: 'GAS-R410A-11KG',
    category: 'hvac',
    categoryLabelAr: 'تكييف وتبريد',
    retailPrice: 19500,
    wholesalePrice: 14200,
    discountPercent: 27,
    minimumPack: 1,
    unit: 'أسطوانة 11.3 كغ',
    stockAvailable: 28,
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=300&auto=format&fit=crop&q=60',
    supplierName: 'خردوات بلحسن الصناعية',
    supplierWilaya: 'سيدي بلعباس',
  },
  {
    id: 'b2b-03',
    name: 'لفة سلك كهربائي نحاسي 2.5 ملم معتمد (100 متر)',
    sku: 'ELEC-WIRE-25MM',
    category: 'electrical',
    categoryLabelAr: 'كهرباء وإنارة',
    retailPrice: 8200,
    wholesalePrice: 5600,
    discountPercent: 32,
    minimumPack: 2,
    unit: 'لفة 100 م',
    stockAvailable: 110,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=60',
    supplierName: 'مجمع الكوابل الجزائري (ENICAB Partner)',
    supplierWilaya: 'سطيف',
  },
  {
    id: 'b2b-04',
    name: 'صندوق قواطع شنايدر 16A و 20A (حزمة ورشة 12 قطعة)',
    sku: 'SCH-BRK-PACK12',
    category: 'electrical',
    categoryLabelAr: 'كهرباء وإنارة',
    retailPrice: 9600,
    wholesalePrice: 6800,
    discountPercent: 29,
    minimumPack: 1,
    unit: 'علبة 12 قاطع',
    stockAvailable: 65,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=60',
    supplierName: 'الشركة المغاربية للتجهيزات',
    supplierWilaya: 'وهران',
  },
  {
    id: 'b2b-05',
    name: 'محابس نحاسية كروية إيطالية 1/2 بوصة (صندوق 20 حبة)',
    sku: 'VLV-BRASS-ITL20',
    category: 'plumbing',
    categoryLabelAr: 'سباكة وتدفئة',
    retailPrice: 11000,
    wholesalePrice: 7500,
    discountPercent: 32,
    minimumPack: 1,
    unit: 'صندوق 20 قطعة',
    stockAvailable: 80,
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300&auto=format&fit=crop&q=60',
    supplierName: 'مؤسسة السباكة الحديثة',
    supplierWilaya: 'سيدي بلعباس',
  },
  {
    id: 'b2b-06',
    name: 'لفة أنابيب Multicouche متعددة الطبقات 16 ملم (100 متر)',
    sku: 'PEX-MULTI-16MM',
    category: 'plumbing',
    categoryLabelAr: 'سباكة وتدفئة',
    retailPrice: 14500,
    wholesalePrice: 9900,
    discountPercent: 31,
    minimumPack: 1,
    unit: 'لفة 100 م',
    stockAvailable: 50,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=60',
    supplierName: 'خردوات العاصمة المركزية',
    supplierWilaya: 'الجزائر العاصمة',
  }
];

export function WholesaleB2BMarket() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [deliveryMode, setDeliveryMode] = useState<'on_site' | 'workshop'>('on_site');
  const [jobSiteAddress, setJobSiteAddress] = useState('شارع أول نوفمبر، عمارة 8، سيدي بلعباس');
  const [selectedWilaya, setSelectedWilaya] = useState('22');
  const [paymentOption, setPaymentOption] = useState<'wallet' | 'add_to_quote'>('add_to_quote');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = WHOLESALE_CATALOG.filter((item) => {
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    const matchesQuery = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const addToCart = (id: string) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    toast({
      title: 'تمت إضافة المادة لسلة الجملة',
      description: 'تم تحديث الكمية بأسعار B2B المخفضة.',
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] > 1) {
        updated[id] -= 1;
      } else {
        delete updated[id];
      }
      return updated;
    });
  };

  const cartEntries = Object.entries(cart);
  const cartSubtotal = cartEntries.reduce((sum, [id, qty]) => {
    const item = WHOLESALE_CATALOG.find((x) => x.id === id);
    return sum + (item ? item.wholesalePrice * qty : 0);
  }, 0);

  const totalSavings = cartEntries.reduce((sum, [id, qty]) => {
    const item = WHOLESALE_CATALOG.find((x) => x.id === id);
    return sum + (item ? (item.retailPrice - item.wholesalePrice) * qty : 0);
  }, 0);

  const expressDeliveryFee = deliveryMode === 'on_site' ? 400 : 0;
  const totalAmount = cartSubtotal + expressDeliveryFee;

  const handleCheckout = () => {
    if (cartEntries.length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCart({});
      toast({
        title: '🚀 تم إرسال طلب التوريد السريع إلى الخردوات الشريكة',
        description: `المبلغ: ${totalAmount.toLocaleString()} DA. جارِ تحضير الطلب وسينطلق المندوب بدراجة الشحن لموقع عملك خلال 35 دقيقة.`,
      });
    }, 1200);
  };

  return (
    <div className="space-y-8 text-right">
      {/* Top Craftsman Badge & Notice */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-l from-blue-900 via-slate-900 to-slate-950 text-white border-2 border-blue-500/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-end">
              <Badge className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1">
                ✓ حساب حرفي معتمد (B2B Verified)
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                عمولة 0% على قطع الغيار والمواد
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-headline">
              سوق الجملة المباشر للخردوات ومواد الصيانة (B2B Quincaillerie)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              لا توقف ورشتك أو تضيع وقتك في التنقل! اطلب أنابيب النحاس، الأسلاك، ومستلزمات الصيانة بأفضل أسعار الجملة من كبرى محلات الخردوات مع توصيل فوري لعنوان الورشة في 35 دقيقة.
            </p>
          </div>

          <div className="bg-blue-950/80 border border-blue-500/40 p-3.5 rounded-2xl text-center shrink-0 min-w-[200px]">
            <span className="text-xs text-blue-300 block">متوسط وفر الحرفي لكل طلب:</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">30% - 35%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">مقارنة بأسعار التجزئة التقليدية</span>
          </div>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all')}
            className="rounded-xl text-xs font-bold"
          >
            الكل
          </Button>
          <Button
            variant={activeTab === 'hvac' ? 'default' : 'outline'}
            onClick={() => setActiveTab('hvac')}
            className="rounded-xl text-xs font-bold"
          >
            ❄️ تكييف وتبريد
          </Button>
          <Button
            variant={activeTab === 'plumbing' ? 'default' : 'outline'}
            onClick={() => setActiveTab('plumbing')}
            className="rounded-xl text-xs font-bold"
          >
            💧 سباكة وتدفئة
          </Button>
          <Button
            variant={activeTab === 'electrical' ? 'default' : 'outline'}
            onClick={() => setActiveTab('electrical')}
            className="rounded-xl text-xs font-bold"
          >
            ⚡ كهرباء وإنارة
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 rounded-xl text-xs text-right"
          />
        </div>
      </div>

      {/* Catalog Grid & Quick Order Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Products Grid (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const countInCart = cart[item.id] || 0;
            return (
              <Card key={item.id} className="overflow-hidden border border-border/80 shadow-sm hover:shadow-md transition-all rounded-2xl flex flex-col justify-between group">
                <div className="relative h-44 w-full bg-muted overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <Badge className="bg-red-600 text-white font-bold text-[10px]">
                      خصم {item.discountPercent}% B2B
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    SKU: {item.sku}
                  </div>
                </div>

                <CardContent className="p-4 space-y-2 text-right">
                  <span className="text-[11px] font-semibold text-primary block">
                    {item.categoryLabelAr} • {item.unit}
                  </span>
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    المورد: <strong className="text-foreground">{item.supplierName}</strong> ({item.supplierWilaya})
                  </p>

                  <div className="pt-2 border-t border-border flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground line-through block">
                        {item.retailPrice.toLocaleString()} DA
                      </span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {item.wholesalePrice.toLocaleString()} DA
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      المتوفر: {item.stockAvailable}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  {countInCart > 0 ? (
                    <div className="flex items-center justify-between w-full bg-primary/10 border border-primary/20 rounded-xl p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => addToCart(item.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-sm text-primary font-mono">{countInCart}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addToCart(item.id)}
                      className="w-full bg-primary text-primary-foreground font-bold rounded-xl text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة لسلة الجملة
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Wholesale Cart & Job Site Delivery Checkout (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="rounded-3xl border-2 border-primary/30 shadow-xl bg-card sticky top-24">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <Badge className="bg-primary/15 text-primary text-xs font-bold">
                  {cartEntries.length} أصناف
                </Badge>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span>سلة التوريد السريع للورشة</span>
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs text-right">
              {cartEntries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground space-y-2">
                  <Truck className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p>السلة فارغة. أضف المواد التي تحتاجها لورشتك.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cartEntries.map(([id, qty]) => {
                    const itm = WHOLESALE_CATALOG.find((x) => x.id === id);
                    if (!itm) return null;
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => {
                            const updated = { ...cart };
                            delete updated[id];
                            setCart(updated);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex-1 text-right">
                          <p className="font-bold text-foreground truncate">{itm.name}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {qty} × {itm.wholesalePrice.toLocaleString()} DA
                          </span>
                        </div>
                        <span className="font-bold text-primary font-mono">
                          {(qty * itm.wholesalePrice).toLocaleString()} DA
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery Destination Options */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="font-bold text-foreground block">مكان وسرعة التسليم:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('on_site')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      deliveryMode === 'on_site'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <span>توصيل عاجل للورشة (35 د)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('workshop')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      deliveryMode === 'workshop'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Building2 className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <span>استلام من الخردوات الشريكة</span>
                  </button>
                </div>

                {deliveryMode === 'on_site' && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-muted-foreground">عنوان ورشة العمل الحالية للعميل:</label>
                    <Input
                      value={jobSiteAddress}
                      onChange={(e) => setJobSiteAddress(e.target.value)}
                      className="text-xs h-8 rounded-lg text-right"
                      placeholder="عنوان الورشة أو رابط خرائط قوقل"
                    />
                  </div>
                )}
              </div>

              {/* Payment Allocation Method */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="font-bold text-foreground block">طريقة قيد التكلفة المحاسبية:</span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-end gap-2 p-2 rounded-lg border bg-background cursor-pointer">
                    <span className="text-[11px] text-muted-foreground">
                      <strong>إضافة لفاتورة العميل (0% عمولة):</strong> تُقيد كقطع غيار 100% للمزود
                    </span>
                    <input
                      type="radio"
                      name="payment_option"
                      checked={paymentOption === 'add_to_quote'}
                      onChange={() => setPaymentOption('add_to_quote')}
                      className="text-primary"
                    />
                  </label>

                  <label className="flex items-center justify-end gap-2 p-2 rounded-lg border bg-background cursor-pointer">
                    <span className="text-[11px] text-muted-foreground">
                      <strong>خصم من محفظة الحرفي (Wallet):</strong> للاحتفاظ بالمخزون
                    </span>
                    <input
                      type="radio"
                      name="payment_option"
                      checked={paymentOption === 'wallet'}
                      onChange={() => setPaymentOption('wallet')}
                      className="text-primary"
                    />
                  </label>
                </div>
              </div>

              {/* Total Financial Summary */}
              <div className="space-y-1.5 pt-2 border-t border-border font-semibold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مجموع المواد بالجملة:</span>
                  <span>{cartSubtotal.toLocaleString()} DA</span>
                </div>
                {deliveryMode === 'on_site' && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>توصيل سريع بالدراجة النارية:</span>
                    <span>+{expressDeliveryFee} DA</span>
                  </div>
                )}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>مبلغ الوفر مقارنة بالتجزئة:</span>
                    <span>-{totalSavings.toLocaleString()} DA</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-black">
                  <span>الإجمالي:</span>
                  <span className="text-primary font-mono">{totalAmount.toLocaleString()} DA</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Button
                onClick={handleCheckout}
                disabled={cartEntries.length === 0 || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-5 gap-2 shadow-lg"
              >
                <Truck className="h-4 w-4" />
                {isSubmitting ? 'جارِ إرسال الطلب...' : 'تأكيد طلب التوريد السريع للورشة'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
