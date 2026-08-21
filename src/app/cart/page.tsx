
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ShoppingCart, CreditCard, RefreshCw, Ticket } from 'lucide-react';
import type { CartItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const CART_STORAGE_KEY = 'khidmatikCart';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponsList, setCouponsList] = useState<any[]>([]);

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
  }, []);

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
    setCouponError(null);
    toast({
      title: "Coupon Applied!",
      description: `Promo code ${coupon.code} applied successfully.`
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
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
  const total = Math.max(0, subtotal - discountAmount + estimatedShipping);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <ShoppingCart className="mr-3 h-8 w-8 text-primary" /> Your Shopping Cart
        </h1>
        {cartItems.length > 0 && (
          <Button variant="outline" asChild>
            <Link href="/listings">Continue Shopping</Link>
          </Button>
        )}
      </header>

      {cartItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-2xl">Your Cart is Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/listings">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cartItems.map(item => (
              <Card key={item.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 shadow-sm">
                <div className="w-full sm:w-24 h-24 aspect-square bg-muted rounded-md overflow-hidden shrink-0">
                  <Image
                    src={item.lineItemImage || 'https://placehold.co/100x100.png'}
                    alt={item.productName}
                    width={100}
                    height={100}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{item.productName}</h3>
                  {item.variantDescription && <p className="text-sm text-muted-foreground">{item.variantDescription}</p>}
                  <p className="text-sm text-primary">{item.unitPrice.toFixed(2)} DA</p>
                </div>
                <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                      className="w-20 h-9 text-center"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
                <div className="w-full sm:w-auto text-right font-semibold text-lg pt-2 sm:pt-0">
                  {(item.unitPrice * item.quantity).toFixed(2)} DA
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={handleClearCart} className="w-full mt-4">
              <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
            </Button>
          </div>

          <aside className="md:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} DA</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 dark:text-green-400 font-semibold text-sm">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{discountAmount.toFixed(2)} DA</span>
                  </div>
                )}
                {appliedCoupon?.type === 'free_shipping' && (
                  <div className="flex justify-between text-green-700 dark:text-green-400 font-semibold text-sm">
                    <span>Shipping Discount</span>
                    <span>Free Shipping</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span>{estimatedShipping.toFixed(2)} DA</span>
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2">
                  <Separator className="my-2" />
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2 rounded-lg text-xs text-green-800 dark:text-green-300">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Ticket className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                        <span>Code: {appliedCoupon.code}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemoveCoupon} 
                        className="h-6 text-red-500 hover:text-red-700 p-1 font-bold text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="coupon-input" className="text-xs font-semibold">Promo / Coupon Code</Label>
                      <div className="flex gap-1.5">
                        <Input 
                          id="coupon-input"
                          placeholder="e.g. WELCOME10" 
                          value={couponCode} 
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponError(null);
                          }}
                          className="h-8 text-xs font-semibold"
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleApplyCoupon} 
                          disabled={!couponCode.trim()} 
                          className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/95 shrink-0"
                        >
                          Apply
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{total.toFixed(2)} DA</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild size="lg">
                  <Link href="/checkout">
                    <CreditCard className="mr-2 h-5 w-5" /> Proceed to Checkout
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
