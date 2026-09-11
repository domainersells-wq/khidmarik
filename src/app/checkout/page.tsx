'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, User, Package, CreditCard, AlertCircle, Truck, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { algerianWilayas } from '@/data/algerian-wilayas';
import type { CartItem, ShippingAddress } from '@/types';
import { logEvent } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { customerOrderService } from '@/services/customerOrderService';
import { unifiedOrderLifecycleService } from '@/services/unifiedOrderLifecycleService';

import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/orderService';

const CART_STORAGE_KEY = 'khidmatikCart';

interface OrderSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
    items: [],
  });

  const [shippingAddress, setShippingAddress] = useState<Partial<ShippingAddress>>({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: 'Sidi Bel Abbès',
    wilayaCode: '22',
  });
  const [shippingMethod, setShippingMethod] = useState<string>('standard');
  const [paymentMethod, setPaymentMethod] = useState<string>('escrow_wallet');

  // Algerian payments state
  const [merchantBaridiMobRip, setMerchantBaridiMobRip] = useState('00799999000002134567');
  const [baridimobTxRef, setBaridimobTxRef] = useState('');
  
  // Chargily / SofyPay gateway modal state
  const [isChargilyOpen, setIsChargilyOpen] = useState(false);
  const [chargilyCardNumber, setChargilyCardNumber] = useState('');
  const [chargilyExpiry, setChargilyExpiry] = useState('');
  const [chargilyCvv, setChargilyCvv] = useState('');
  const [chargilySmsCode, setChargilySmsCode] = useState('');
  const [chargilyStep, setChargilyStep] = useState<1 | 2 | 3>(1); // 1 = card inputs, 2 = sms otp, 3 = paid success
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isOrderPlacing, setIsOrderPlacing] = useState(false);

  useEffect(() => {
    document.title = 'Checkout | Khidmatik';
    loadCartAndCalculateSummary();

    // Auto-fill user profile info if logged in
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
      }));
    }

    // Load applied coupon from Cart
    try {
      const storedCoupon = localStorage.getItem('khidmatik_applied_coupon');
      if (storedCoupon) {
        setAppliedCoupon(JSON.parse(storedCoupon));
      }
    } catch (e) {
      console.warn('Failed parsing stored coupon:', e);
    }
    
    // Load merchant BaridiMob settings if available
    const storedPayment = localStorage.getItem('khidmatik_settings_payment');
    if (storedPayment) {
      try {
        const parsed = JSON.parse(storedPayment);
        if (parsed.baridimobRip) {
          setMerchantBaridiMobRip(parsed.baridimobRip);
        }
      } catch (e) {
        console.warn('Failed parsing stored payment settings:', e);
      }
    }
  }, [user]);

  useEffect(() => {
    calculateOrderSummary(cartItems, shippingMethod, appliedCoupon);
  }, [cartItems, shippingMethod, appliedCoupon]);

  const loadCartAndCalculateSummary = () => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      const loadedCartItems = storedCart ? JSON.parse(storedCart) : [];
      setCartItems(loadedCartItems);
    } catch (error) {
      console.error("Error loading cart from storage:", error);
      setCartItems([]);
    }
  };

  const calculateOrderSummary = (currentCartItems: CartItem[], currentShippingMethod: string, currentCoupon?: any) => {
    const subtotal = currentCartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    let shippingCost = currentCartItems.length > 0 ? 500 : 0;

    if (currentShippingMethod === 'app_partner') {
      shippingCost = currentCartItems.length > 0 ? 1200 : 0;
    } else if (currentShippingMethod === 'pickup') {
      shippingCost = 0;
    }

    let discountAmount = 0;
    if (currentCoupon) {
      if (currentCoupon.type === 'percentage') {
        discountAmount = (subtotal * (currentCoupon.discount || 0)) / 100;
      } else {
        discountAmount = currentCoupon.discount || 0;
      }
    }
    discountAmount = Math.min(discountAmount, subtotal);

    const total = Math.max(0, Math.round((subtotal - discountAmount + shippingCost) * 100) / 100);
    const summaryItems = currentCartItems.map(item => ({
      name: `${item.productName}${item.variantDescription ? ` (${item.variantDescription})` : ''}`,
      quantity: item.quantity,
      price: item.unitPrice,
    }));
    setOrderSummary({ subtotal, discount: discountAmount, shipping: shippingCost, total, items: summaryItems });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingAddress(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleWilayaChange = (value: string) => {
    setShippingAddress(prev => ({ ...prev, wilayaCode: value }));
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.wilayaCode) {
      toast({ title: "Missing Address Info", description: "Please fill all required shipping address fields.", variant: "destructive" });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Empty Cart", description: "Your cart is empty. Please add items before checking out.", variant: "destructive" });
      return;
    }

    if (paymentMethod === 'sofypay') {
      // Open Chargily / SofyPay payment modal
      setIsChargilyOpen(true);
      setChargilyStep(1);
      setChargilyCardNumber('');
      setChargilyExpiry('');
      setChargilyCvv('');
      setChargilySmsCode('');
    } else if (paymentMethod === 'baridimob' && !baridimobTxRef) {
      toast({ title: "Transaction Reference Required", description: "Please enter your BaridiMob Transfer Reference Number (Tx Ref) to proceed.", variant: "destructive" });
    } else {
      // Proceed with wallet or baridimob normal order placement
      placeFinalOrder();
    }
  };

  const placeFinalOrder = async () => {
    setIsOrderPlacing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    logEvent('purchase', {
      value: orderSummary.total,
      currency: 'DZD',
      payment_method: paymentMethod,
      items: orderSummary.items.map(item => ({
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    let successMessage = "";
    let methodName = "";
    if (paymentMethod === 'escrow_wallet') {
      successMessage = "Your payment has been successfully processed via your Khidmatik Escrow wallet.";
      methodName = "Khidmatik Escrow Wallet";
    } else if (paymentMethod === 'baridimob') {
      successMessage = `Your BaridiMob transfer (Ref: ${baridimobTxRef}) will be verified by the merchant shortly.`;
      methodName = "BaridiMob Transfer";
    } else if (paymentMethod === 'sofypay') {
      successMessage = "Your card transaction was successfully cleared via Chargily Gateway.";
      methodName = "Chargily Gateway (Edahabia/CIB)";
    }

    const matchedWilaya = algerianWilayas.find(w => w.code === shippingAddress.wilayaCode);
    const wilayaName = matchedWilaya ? `${matchedWilaya.code} - ${matchedWilaya.name_en}` : (shippingAddress.wilayaCode || '16 - Alger');

    const mappedItems = cartItems.map((item, idx) => ({
      productId: item.productId || `prd_${idx + 1}`,
      productName: item.productName || (item as any).title || (item as any).name || 'Product',
      productImage: (item as any).imageUrl || (item as any).image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
      sku: (item as any).sku || `SKU-${idx + 1}`,
      variantName: item.variantDescription || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      storeId: (item as any).storeId || 'str_1',
      storeName: (item as any).storeName || 'Tech Universe Algérie',
    }));

    // 1. Direct insertion to Supabase orders and order_items tables
    const fallbackCustomerId = user?.id || '00000000-0000-0000-0000-000000000000';
    const primaryStoreId = mappedItems[0]?.storeId || '00000000-0000-0000-0000-000000000002';
    try {
      await orderService.createOrder({
        customerId: fallbackCustomerId,
        storeId: primaryStoreId,
        customerName: shippingAddress.fullName || 'Customer',
        customerEmail: user?.email || 'customer@khidmatik.dz',
        customerPhone: shippingAddress.phone || '0550000000',
        shippingAddress: `${shippingAddress.addressLine1 || ''}, ${shippingAddress.city || ''}, ${wilayaName}`,
        billingAddress: `${shippingAddress.addressLine1 || ''}, ${shippingAddress.city || ''}, ${wilayaName}`,
        paymentType: paymentMethod,
        paymentStatus: paymentMethod === 'escrow_wallet' || paymentMethod === 'sofypay' ? 'paid' : 'pending',
        total: orderSummary.total,
        profit: Math.round(orderSummary.total * 0.08),
        items: mappedItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productImageUrl: item.productImage,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        customerNotes: `Payment via ${methodName}. Applied discount: ${orderSummary.discount} DA`
      });
    } catch (dbErr) {
      console.warn("Could not insert directly into Supabase orders (using local canonical store):", dbErr);
    }

    // 2. Create canonical customer order in centralized store for tracking & offline resilience
    const createdOrder = await customerOrderService.createCustomerOrder({
      customerId: fallbackCustomerId,
      customerName: shippingAddress.fullName || 'Customer',
      customerEmail: user?.email || 'customer@khidmatik.dz',
      customerPhone: shippingAddress.phone || '0550000000',
      shippingAddress: {
        recipientName: shippingAddress.fullName || 'Customer',
        phone: shippingAddress.phone || '0550000000',
        country: 'Algeria',
        wilaya: wilayaName,
        commune: shippingAddress.city || 'Alger Centre',
        addressLine: shippingAddress.addressLine1 || '',
      },
      subtotal: orderSummary.subtotal,
      shippingFee: orderSummary.shipping,
      discountAmount: orderSummary.discount,
      totalAmount: orderSummary.total,
      paymentMethod: (paymentMethod === 'sofypay' ? 'edahabia' : paymentMethod === 'baridimob' ? 'baridimob' : 'wallet') as any,
      items: mappedItems,
      storeId: primaryStoreId,
      storeName: mappedItems[0]?.storeName || 'Tech Universe Algérie',
    });

    setPlacedOrderDetails({
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      shipping: {
        ...shippingAddress,
        wilayaName: matchedWilaya ? matchedWilaya.name_en : shippingAddress.wilayaCode
      },
      paymentMethodName: methodName,
      paymentRef: paymentMethod === 'baridimob' ? baridimobTxRef : (paymentMethod === 'sofypay' ? `CHG-${Math.floor(Math.random() * 1000000)}` : `WLT-${Math.floor(Math.random() * 1000000)}`),
      items: createdOrder.items.map(i => ({ name: i.productName, quantity: i.quantity, price: i.unitPrice })),
      summary: { ...orderSummary }
    });

    toast({
      title: "Order Placed Successfully! (تم إنشاء الطلب بنجاح)",
      description: `رقم الطلب: ${createdOrder.orderNumber}. ${successMessage}`,
      duration: 8000,
    });

    // Clear cart
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
    setIsOrderPlacing(false);
    setIsSuccess(true);
  };

  // Chargily payment simulation
  const handleChargilyCardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (chargilyCardNumber.length < 16) {
      toast({ title: "Invalid Card Number", description: "Edahabia or CIB cards must be 16 digits.", variant: "destructive" });
      return;
    }
    setIsProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessingPayment(false);
    setChargilyStep(2); // Go to SMS OTP step
  };

  const handleChargilyOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chargilySmsCode) return;
    setIsProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsProcessingPayment(false);
    setChargilyStep(3); // Success step
  };

  const handleChargilySuccessClose = () => {
    setIsChargilyOpen(false);
    placeFinalOrder();
  };

  if (isSuccess && placedOrderDetails) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-300">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
          }
        `}</style>

        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-950/35 flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Order Confirmed!</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Thank you for your order. Your payment has been registered, and the merchant has been notified.
          </p>
        </div>

        {/* Receipt Container */}
        <Card id="printable-receipt" className="border shadow-lg bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h3 className="font-bold text-xl text-primary flex items-center gap-2">
                Khidmatik Receipt
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Receipt Ref: #KHM-{placedOrderDetails.orderId}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString('fr-FR')}</span>
              <p className="text-xs font-semibold text-green-600 mt-1">Status: Paid (Secure Escrow)</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-muted-foreground mb-1">Customer / Shipping Details</h4>
              <p className="font-medium">{placedOrderDetails.shipping.fullName}</p>
              <p className="text-muted-foreground">{placedOrderDetails.shipping.phone}</p>
              <p className="text-muted-foreground">{placedOrderDetails.shipping.addressLine1}</p>
              <p className="text-muted-foreground">{placedOrderDetails.shipping.city}, {placedOrderDetails.shipping.wilayaName}</p>
            </div>
            <div className="text-right">
              <h4 className="font-semibold text-muted-foreground mb-1">Payment Information</h4>
              <p className="font-medium">Method: {placedOrderDetails.paymentMethodName}</p>
              {placedOrderDetails.paymentRef && (
                <p className="text-muted-foreground">Tx Reference: <span className="font-mono">{placedOrderDetails.paymentRef}</span></p>
              )}
              <p className="text-muted-foreground font-semibold text-indigo-600 dark:text-indigo-400 mt-1">Type: Escrow Wallet Secure</p>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-muted-foreground">Ordered Items</h4>
            <div className="space-y-2">
              {placedOrderDetails.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-1.5 font-mono">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} DA</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{placedOrderDetails.summary.subtotal.toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{placedOrderDetails.summary.shipping.toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t text-foreground">
              <span>Total Paid</span>
              <span>{placedOrderDetails.summary.total.toFixed(2)} DA</span>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 border text-center p-3 rounded-lg text-[10px] text-muted-foreground">
            This receipt serves as proof of deposit in Khidmatik Escrow. Funds are locked securely and will only be released to the store owner upon successful delivery.
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 h-11 rounded-2xl shadow-sm">
            <Link href="/account/orders">
              عرض في طلباتي (View in My Orders) ➔
            </Link>
          </Button>
          {placedOrderDetails?.orderId && (
            <Button asChild variant="outline" className="font-bold h-11 rounded-2xl border-primary/40 text-primary hover:bg-primary/10">
              <Link href={`/account/orders/${placedOrderDetails.orderId}`}>
                تتبع تفاصيل الشحنة (Order Tracking)
              </Link>
            </Button>
          )}
          <Button variant="ghost" asChild className="h-11 rounded-2xl">
            <Link href="/listings">مواصلة التسوق (Continue Shopping)</Link>
          </Button>
          <Button onClick={() => window.print()} variant="secondary" className="h-11 rounded-2xl font-bold">
            Print / PDF (طبع الوصل)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
      </Link>
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">Checkout</h1>

      <form onSubmit={handleCheckoutSubmit} className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card className="shadow border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" /> Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={shippingAddress.fullName} onChange={handleAddressChange} placeholder="Enter your full name" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" value={shippingAddress.phone} onChange={handleAddressChange} placeholder="e.g., 05xxxxxxxx" required />
              </div>
              <div>
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input id="addressLine1" value={shippingAddress.addressLine1} onChange={handleAddressChange} placeholder="Street address, Wilaya, Town" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={shippingAddress.city} onChange={handleAddressChange} required />
                </div>
                <div>
                  <Label htmlFor="wilayaCode">Wilaya (Province) *</Label>
                  <Select value={shippingAddress.wilayaCode} onValueChange={handleWilayaChange} required>
                    <SelectTrigger id="wilayaCode">
                      <SelectValue placeholder="Select your Wilaya" />
                    </SelectTrigger>
                    <SelectContent>
                      {algerianWilayas.map(wilaya => (
                        <SelectItem key={wilaya.code} value={wilaya.code}>
                          {wilaya.code} - {wilaya.name_fr} ({wilaya.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Method */}
          <Card className="shadow border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Truck className="mr-2 h-5 w-5 text-primary" /> Shipping Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-2">
                <Label htmlFor="shipping-standard" className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="standard" id="shipping-standard" className="mr-3" />
                  <div>
                    <span className="font-semibold">Seller Standard Shipping</span> (5-7 days)
                    <p className="text-xs text-muted-foreground">{cartItems.length > 0 ? '500.00' : '0.00'} DA</p>
                  </div>
                </Label>
                <Label htmlFor="shipping-express" className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="app_partner" id="shipping-express" className="mr-3" />
                  <div>
                    <span className="font-semibold">App Partner Express</span> (2-3 days)
                    <p className="text-xs text-muted-foreground">{cartItems.length > 0 ? '1200.00' : '0.00'} DA - Via Yalidine / EMS</p>
                  </div>
                </Label>
                <Label htmlFor="shipping-pickup" className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="pickup" id="shipping-pickup" className="mr-3" />
                  <div>
                    <span className="font-semibold">Collect from Store</span>
                    <p className="text-xs text-muted-foreground">Free - Arrange pickup directly</p>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="shadow border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" /> Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2.5">
                <Label htmlFor="payment-escrow" className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="escrow_wallet" id="payment-escrow" className="mr-3" />
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-semibold">Khidmatik Escrow Wallet</span>
                      <p className="text-xs text-muted-foreground">Pay using your platform digital balance (Balance: 500.00 DA)</p>
                    </div>
                  </div>
                </Label>
                
                <Label htmlFor="payment-baridimob" className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="baridimob" id="payment-baridimob" className="mr-3" />
                  <div className="flex items-center gap-2">
                    <Image src="https://placehold.co/24x24.png" alt="BaridiMob" width={24} height={24} className="rounded" />
                    <div>
                      <span className="font-semibold">BaridiMob (Algeria Post)</span>
                      <p className="text-xs text-muted-foreground">Transfer instantly using Algeria Post BaridiMob mobile app.</p>
                    </div>
                  </div>
                </Label>

                <Label htmlFor="payment-sofypay" className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="sofypay" id="payment-sofypay" className="mr-3" />
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                    <div>
                      <span className="font-semibold">Chargily / SofyPay</span>
                      <p className="text-xs text-muted-foreground">Pay with Edahabia or CIB bank cards securely.</p>
                    </div>
                  </div>
                </Label>
              </RadioGroup>

              {paymentMethod === 'baridimob' && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-md text-sm space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">BaridiMob Payout Details</p>
                      <p className="text-xs text-amber-800">Please send exactly <strong className="text-foreground font-bold">{orderSummary.total.toLocaleString()} DA</strong> to RIP:</p>
                      <p className="font-mono text-base bg-white border p-2 rounded-md font-bold mt-1 text-center select-all">{merchantBaridiMobRip}</p>
                    </div>
                  </div>
                  <div className="grid gap-1.5 pl-7">
                    <Label htmlFor="baridimobTxRef" className="text-xs text-amber-900 font-semibold">Enter BaridiMob Transaction Reference (Tx Ref) *</Label>
                    <Input
                      id="baridimobTxRef"
                      required
                      value={baridimobTxRef}
                      onChange={(e) => setBaridimobTxRef(e.target.value)}
                      placeholder="e.g. 00892348"
                      className="bg-white border-amber-300"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'sofypay' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-xs flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Chargily Pay Integrated Gateway</p>
                    <p className="mt-0.5">Clicking "Place Order" will redirect you to secure local card details validation step.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <aside className="md:col-span-1">
          <Card className="sticky top-24 shadow-lg border">
            <CardHeader>
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orderSummary.items.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
              {orderSummary.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} DA</span>
                </div>
              ))}
              {orderSummary.items.length > 0 && <Separator className="my-2" />}
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{orderSummary.subtotal.toFixed(2)} DA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{orderSummary.shipping.toFixed(2)} DA</span>
              </div>
              <Separator className="my-2"/>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{orderSummary.total.toFixed(2)} DA</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={cartItems.length === 0 || isOrderPlacing}>
                {isOrderPlacing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Order...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-5 w-5" /> Place Order
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </form>

      {/* Chargily / SofyPay Simulation Modal Gateway */}
      <Dialog open={isChargilyOpen} onOpenChange={setIsChargilyOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto bg-white border border-slate-200 text-slate-800">
          <DialogHeader className="sr-only">
            <DialogTitle>بوابة الدفع الإلكتروني / Chargily Pay Gateway</DialogTitle>
            <DialogDescription>دفع آمن بالبطاقة الذهبية أو بطاقة CIB</DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-t-lg bg-red-600 text-white flex justify-between items-center -mx-6 -mt-6">
            <span className="font-bold tracking-wide text-sm flex items-center gap-1.5"><CreditCard className="h-5 w-5" /> Chargily Pay / Gateway</span>
            <span className="text-xs bg-red-700/80 px-2 py-0.5 rounded font-mono">DZD {orderSummary.total.toLocaleString()}</span>
          </div>

          {chargilyStep === 1 && (
            <form onSubmit={handleChargilyCardSubmit} className="space-y-4 pt-4">
              <div className="text-center pb-2">
                <p className="text-xs text-muted-foreground">Algeria eCommerce Card Payment validation.</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-num" className="text-xs font-semibold">Credit Card Number (Edahabia / CIB) *</Label>
                <Input
                  id="c-num"
                  required
                  maxLength={16}
                  value={chargilyCardNumber}
                  onChange={(e) => setChargilyCardNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="6081 1044 1234 5678"
                  className="font-mono text-center font-bold tracking-wider"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="c-exp" className="text-xs font-semibold">Expiry Date (MM/YY) *</Label>
                  <Input
                    id="c-exp"
                    required
                    value={chargilyExpiry}
                    onChange={(e) => setChargilyExpiry(e.target.value)}
                    placeholder="12/28"
                    className="font-mono text-center"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="c-cvv" className="text-xs font-semibold">CVV *</Label>
                  <Input
                    id="c-cvv"
                    type="password"
                    maxLength={3}
                    required
                    value={chargilyCvv}
                    onChange={(e) => setChargilyCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="***"
                    className="font-mono text-center"
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isProcessingPayment}>
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Card...
                    </>
                  ) : (
                    "Validate Payment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {chargilyStep === 2 && (
            <form onSubmit={handleChargilyOtpSubmit} className="space-y-4 pt-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">A 3D Secure SMS validation code has been sent to your phone number +213 5*****99</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-otp" className="text-xs font-semibold text-center">SMS Verification Code (OTP)</Label>
                <Input
                  id="c-otp"
                  required
                  value={chargilySmsCode}
                  onChange={(e) => setChargilySmsCode(e.target.value)}
                  placeholder="e.g. 981320"
                  className="font-mono text-center text-lg font-bold tracking-widest bg-red-50/50 border-red-300"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isProcessingPayment}>
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authorizing...
                    </>
                  ) : (
                    "Confirm Authorization"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {chargilyStep === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-green-600">Payment Authorization Cleared</h3>
                <p className="text-xs text-muted-foreground">Receipt code: TXN_CHRG_98319</p>
              </div>
              <Button onClick={handleChargilySuccessClose} className="w-full bg-green-600 hover:bg-green-700 text-white mt-2">
                Proceed & Complete Order
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
