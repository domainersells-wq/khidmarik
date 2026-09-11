
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  RefreshCw, 
  Ticket, 
  Wrench, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  CheckCircle2,
  X
} from 'lucide-react';
import type { CartItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ProjectBundleOfferModal, CertifiedTechnician } from '@/components/cart/ProjectBundleOfferModal';
import { WhatsAppNotificationCard } from '@/components/delivery/WhatsAppNotificationCard';

const CART_STORAGE_KEY = 'khidmatikCart';
const BUNDLE_STORAGE_KEY = 'khidmatikProjectBundle';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponsList, setCouponsList] = useState<any[]>([]);

  // Project Bundle State (One-Click Project Pack)
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [bundleDetails, setBundleDetails] = useState<{
    technician: CertifiedTechnician;
    installationFee: number;
    scheduledDate: string;
    targetItemName: string;
  } | null>(null);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  useEffect(() => {
    document.title = 'Shopping Cart | Khidmatik';
    loadCartFromStorage();

    const loadCoupons = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('key', 'coupons');
        if (!error && data && data.length > 0) {
          const flatCoupons = data.flatMap((item: any) => {
            const list = Array.isArray(item.value) ? item.value : [];
            return list.map((c: any) => ({ ...c, storeId: item.store_id }));
          });
          setCouponsList(flatCoupons);
          return;
        }
      } catch (err) {
        console.warn("Failed to load coupons from Supabase, trying fallback:", err);
      }

      // LocalStorage fallback
      try {
        const stored = localStorage.getItem('khidmatik_marketing_coupons');
        if (stored) {
          setCouponsList(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load coupons from LocalStorage:", err);
      }
    };
    loadCoupons();

    try {
      const storedBundle = localStorage.getItem(BUNDLE_STORAGE_KEY);
      if (storedBundle) {
        setBundleDetails(JSON.parse(storedBundle));
      }
    } catch (e) {
      console.warn("Failed to load project bundle from localStorage", e);
    }
  }, []);

  const handleSetBundle = (bundle: {
    technician: CertifiedTechnician;
    installationFee: number;
    scheduledDate: string;
  }) => {
    const details = {
      ...bundle,
      targetItemName: cartItems[0]?.productName || 'الجهاز المحدد',
    };
    setBundleDetails(details);
    try {
      localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(details));
    } catch (e) {
      console.error(e);
    }
    toast({
      title: "تمت إضافة باقة التركيب والضمان بنجاح!",
      description: `تم تعيين الفني ${bundle.technician.name} بالولاية مع ضمان معتمد لمدة ${bundle.technician.warrantyMonths} أشهر.`,
    });
  };

  const handleRemoveBundle = () => {
    setBundleDetails(null);
    try {
      localStorage.removeItem(BUNDLE_STORAGE_KEY);
    } catch (e) {}
    toast({
      title: "تمت إزالة باقة التركيب",
      description: "تم تحديث السلة لشراء الجهاز بدون خدمة التركيب.",
    });
  };

  const handleApplyCoupon = () => {
    const codeToFind = couponCode.trim().toUpperCase();
    if (!codeToFind) return;

    const coupon = couponsList.find(c => c.code.toUpperCase() === codeToFind);
    if (!coupon) {
      setCouponError("Invalid coupon code.");
      return;
    }

    if (coupon.status !== 'Active') {
      setCouponError("This coupon has expired or is inactive.");
      return;
    }

    // Verify if any items in cart belong to this coupon's store
    const matchingItems = cartItems.filter(item => {
      if (!coupon.storeId) return true; // Global coupon
      return item.storeId === coupon.storeId;
    });

    if (matchingItems.length === 0) {
      setCouponError("This coupon is not valid for any items in your cart.");
      return;
    }

    // Verify minimum order value
    const matchingSubtotal = matchingItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    if (coupon.minOrderValue && matchingSubtotal < coupon.minOrderValue) {
      setCouponError(`Min order value for this coupon is ${coupon.minOrderValue} DA.`);
      return;
    }

    setAppliedCoupon(coupon);
    try {
      localStorage.setItem('khidmatik_applied_coupon', JSON.stringify(coupon));
    } catch (e) {}
    setCouponError(null);
    toast({
      title: "Coupon Applied!",
      description: `Promo code ${coupon.code} applied successfully.`
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('khidmatik_applied_coupon');
    } catch (e) {}
    setCouponCode('');
    setCouponError(null);
    toast({
      title: "Coupon Removed",
      description: "Discount has been removed."
    });
  };

  const loadCartFromStorage = () => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error loading cart from storage:", error);
      setCartItems([]); // Fallback to empty cart on error
    }
  };

  const saveCartToStorage = (items: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving cart to storage:", error);
      toast({ title: "Storage Error", description: "Could not save cart changes.", variant: "destructive"});
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1; // Minimum quantity is 1
    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
    toast({
      title: "Item Removed",
      description: "The item has been removed from your cart.",
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    saveCartToStorage([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    const matchingItems = cartItems.filter(item => {
      if (!appliedCoupon.storeId) return true;
      return item.storeId === appliedCoupon.storeId;
    });
    const matchingSubtotal = matchingItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    
    if (appliedCoupon.type === 'percentage') {
      discountAmount = matchingSubtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discountAmount = Math.min(appliedCoupon.value, matchingSubtotal);
    }
  }

  const estimatedShipping = cartItems.length > 0 && appliedCoupon?.type !== 'free_shipping' ? 500 : 0; // Mock shipping
  const installationFee = bundleDetails ? bundleDetails.installationFee : 0;
  const total = Math.max(0, subtotal - discountAmount + estimatedShipping + installationFee);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 text-right">
      <header className="flex items-center justify-between flex-row-reverse">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" /> سلة المشتريات والطلبات
        </h1>
        {cartItems.length > 0 && (
          <Button variant="outline" asChild>
            <Link href="/listings">مواصلة التسوق</Link>
          </Button>
        )}
      </header>

      {cartItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-2xl">سلة المشتريات فارغة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">لم تقم بإضافة أي منتجات إلى سلتك حتى الآن.</p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/listings">تصفح السوق والمتاجر</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {/* One-Click Project Pack Invitation Banner (If bundle not chosen yet) */}
            {!bundleDetails ? (
              <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-background to-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1 text-right">
                  <div className="inline-flex items-center gap-1.5 font-bold text-xs text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span>ميزة حصرية: صفقة متكاملة بضغطة واحدة (One-Click Project Pack)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    هل ترغب في تعيين فني معتمد لتركيب أجهزتك بضمان رسمي ووساطة مالية موحدة بالتزامن مع تسليم الطرد؟
                  </p>
                </div>
                <Button
                  onClick={() => setIsBundleModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-sm gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  إضافة فني وضمان موحد
                </Button>
              </div>
            ) : (
              /* Active Bundle Details Card */
              <div className="p-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 space-y-3 shadow-sm text-right">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveBundle}
                    className="h-7 text-xs text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-3.5 w-3.5 ml-1" /> إلغاء باقة التركيب
                  </Button>
                  <Badge className="bg-emerald-600 text-white text-xs font-bold gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    تم تفعيل الصفقة المتكاملة (السلعة + التركيب + الضمان الموحد)
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3 flex-row-reverse text-xs">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-emerald-500 shrink-0">
                      <Image
                        src={bundleDetails.technician.avatarUrl}
                        alt={bundleDetails.technician.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{bundleDetails.technician.name}</p>
                      <p className="text-muted-foreground text-[11px]">{bundleDetails.technician.professionAr}</p>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-muted-foreground block text-[11px]">رسوم التركيب المعتمد:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{bundleDetails.installationFee.toLocaleString()} DA
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">
                    📅 موعد الحضور: <strong className="text-foreground">{bundleDetails.scheduledDate}</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWhatsAppPreview(true)}
                    className="h-7 text-[11px] rounded-lg border-emerald-500/40 text-emerald-700 dark:text-emerald-300 gap-1"
                  >
                    <MessageCircle className="h-3 w-3" />
                    معاينة إشعار WhatsApp وبطاقة الحرفي
                  </Button>
                </div>
              </div>
            )}

            {/* Cart Items List */}
            {cartItems.map(item => (
              <Card key={item.id} className="p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row-reverse sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-row-reverse sm:contents">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.lineItemImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=60'}
                        alt={item.productName}
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-grow text-right min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{item.productName}</h3>
                      {item.variantDescription && <p className="text-xs text-muted-foreground">{item.variantDescription}</p>}
                      <p className="text-sm font-bold text-primary">{item.unitPrice.toFixed(2)} DA</p>

                      {!bundleDetails && (
                        <button
                          onClick={() => setIsBundleModalOpen(true)}
                          className="mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 ml-auto"
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">تركيب وضمان معتمد؟</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-9 text-center text-sm"
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive/80 h-9 px-2 text-xs">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-left font-bold text-base sm:text-lg sm:mr-auto">
                      {(item.unitPrice * item.quantity).toFixed(2)} DA
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={handleClearCart} className="w-full mt-4">
              <Trash2 className="ml-2 h-4 w-4" /> إفراغ السلة
            </Button>
          </div>

          <aside className="md:col-span-1">
            <Card className="sticky top-24 shadow-lg text-right">
              <CardHeader>
                <CardTitle className="text-xl">ملخص الطلب والفاتورة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between flex-row-reverse">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal.toFixed(2)} DA</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between flex-row-reverse text-green-700 dark:text-green-400 font-semibold text-sm">
                    <span>خصم الكوبون ({appliedCoupon?.code})</span>
                    <span>-{discountAmount.toFixed(2)} DA</span>
                  </div>
                )}
                <div className="flex justify-between flex-row-reverse">
                  <span>تكلفة الشحن المقدرة</span>
                  <span>{estimatedShipping.toFixed(2)} DA</span>
                </div>

                {/* Project Pack Installation Fee in Ledger */}
                {bundleDetails && (
                  <div className="flex justify-between flex-row-reverse text-emerald-700 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span>أتعاب التركيب والضمان ({bundleDetails.technician.name})</span>
                    <span>+{bundleDetails.installationFee.toLocaleString()} DA</span>
                  </div>
                )}

                {/* Coupon Code Section */}
                <div className="pt-2">
                  <Separator className="my-2" />
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2 rounded-lg text-xs text-green-800 dark:text-green-300">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemoveCoupon} 
                        className="h-6 text-red-500 hover:text-red-700 p-1 font-bold text-xs"
                      >
                        إلغاء
                      </Button>
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span>الكوبون: {appliedCoupon.code}</span>
                        <Ticket className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="coupon-input" className="text-xs font-semibold">كود الخصم أو القسيمة</Label>
                      <div className="flex gap-1.5">
                        <Input 
                          id="coupon-input"
                          placeholder="مثال: KHIDMA10" 
                          value={couponCode} 
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponError(null);
                          }}
                          className="h-8 text-xs font-semibold text-right"
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleApplyCoupon} 
                          disabled={!couponCode.trim()} 
                          className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/95 shrink-0"
                        >
                          تطبيق
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex justify-between flex-row-reverse font-bold text-lg">
                  <span>الإجمالي النهائي</span>
                  <span className="text-primary">{total.toFixed(2)} DA</span>
                </div>
                {bundleDetails && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    🔒 معاملة وساطة موحدة (Unified Escrow) تحمي حقك في السلعة وجودة التركيب.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" asChild size="lg">
                  <Link href="/checkout">
                    <CreditCard className="ml-2 h-5 w-5" /> متابعة إلى الدفع الآمن
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </aside>
        </div>
      )}

      {/* Project Bundle Selection Modal */}
      <ProjectBundleOfferModal
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
        productName={cartItems[0]?.productName || 'مكيف هوائي / جهاز كهرومنزلي'}
        productPrice={cartItems[0]?.unitPrice || 45000}
        productImage={cartItems[0]?.lineItemImage}
        onAddBundle={handleSetBundle}
      />

      {/* WhatsApp Message & OTP Card Preview Dialog */}
      {showWhatsAppPreview && bundleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl max-w-lg w-full p-4 relative shadow-2xl border max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowWhatsAppPreview(false)}
              className="absolute top-4 left-4 p-1 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-3 text-right">
              <h3 className="font-bold text-lg text-foreground">معاينة إشعار واتساب وبطاقة الحرفي</h3>
              <p className="text-xs text-muted-foreground">هذا الإشعار يصل للعميل لحظياً فور تأكيد الطلب مع كود الـ OTP البديل:</p>
            </div>
            <WhatsAppNotificationCard
              orderNumber="KHD-ORD-2026-8801"
              technicianName={bundleDetails.technician.name}
              technicianPhone={bundleDetails.technician.phone}
              technicianAvatar={bundleDetails.technician.avatarUrl}
              technicianProfession={bundleDetails.technician.professionAr}
              installationDate={bundleDetails.scheduledDate}
              startOtpCode="849201"
              completionOtpCode="631584"
            />
          </div>
        </div>
      )}
    </div>
  );
}

