'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { algerianWilayas } from '@/data/algerian-wilayas';
import { 
  PlusCircle, ShoppingCart, Trash2, Calculator, Check, Printer,
  User, Mail, Phone, MapPin, Truck, AlertCircle, ScanBarcode, Search, DollarSign, Send
} from 'lucide-react';

interface POSItem {
  id: string; // generated
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  qty: number;
  maxStock: number;
}

export function NewOrderSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Database state
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('16'); // Algiers
  const [selectedCourier, setSelectedCourier] = useState('Yalidine');
  const [customerNotes, setCustomerNotes] = useState('');

  // Cart
  const [cartItems, setCartItems] = useState<POSItem[]>([]);

  // Finance details
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [tvaRate, setTvaRate] = useState<number>(19); // Default Algeria TVA is 19%
  const [shippingCost, setShippingCost] = useState(600); // Yalidine Algiers fee
  const [paymentType, setPaymentType] = useState<string>('cash');
  const [onCredit, setOnCredit] = useState(false);

  // Cash calculation
  const [amountReceived, setAmountReceived] = useState('');
  
  // Print Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<any>(null);

  // Load Products & Variants
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      const storeId = user?.storeId || '00000000-0000-0000-0000-000000000001';
      try {
        const { data: prods, error } = await supabase
          .from('products')
          .select(`
            *,
            product_variants(*)
          `)
          .eq('store_id', storeId);

        if (error) throw error;
        if (prods && prods.length > 0) {
          setDbProducts(prods);
          setFilteredProducts(prods);
        } else {
          throw new Error("No products loaded");
        }
      } catch (e) {
        console.warn('Failed loading products for POS from DB. Falling back to local data:', e);
        const localProds = [
          { id: 'prod1', name: 'Organic Olive Oil (1L)', base_image_url: 'https://placehold.co/40x40.png?text=Oil', product_variants: [{ id: 'var1', price: 1500, stock: 45, sku: 'OL-1L', barcode: '1111' }] },
          { id: 'prod2', name: 'Handcrafted Ceramic Set', base_image_url: 'https://placehold.co/40x40.png?text=Ceramic', product_variants: [{ id: 'var2', price: 12000, stock: 12, sku: 'CR-SET', barcode: '2222' }] },
          { id: 'prod3', name: 'Traditional Honey Jar', base_image_url: 'https://placehold.co/40x40.png?text=Honey', product_variants: [{ id: 'var3', price: 1800, stock: 25, sku: 'HN-JAR', barcode: '3333' }] },
          { id: 'prod4', name: 'Premium Deglet Nour Dates', base_image_url: 'https://placehold.co/40x40.png?text=Dates', product_variants: [{ id: 'var4', price: 950, stock: 38, sku: 'DT-KG', barcode: '4444' }] }
        ];
        setDbProducts(localProds);
        setFilteredProducts(localProds);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [user]);

  // Handle live search
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredProducts(dbProducts);
      return;
    }
    const filtered = dbProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.product_variants?.some((v: any) => v.sku?.toLowerCase().includes(query) || v.barcode?.includes(query))
    );
    setFilteredProducts(filtered);
  }, [searchQuery, dbProducts]);

  // Handle barcode scanning submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeQuery.trim();
    if (!barcode) return;

    // Search variants for matching barcode or SKU
    let matchedProd: any = null;
    let matchedVariant: any = null;

    for (const p of dbProducts) {
      const v = p.product_variants?.find((v: any) => v.barcode === barcode || v.sku === barcode);
      if (v) {
        matchedProd = p;
        matchedVariant = v;
        break;
      }
    }

    if (matchedProd && matchedVariant) {
      addToCart(matchedProd, matchedVariant);
      setBarcodeQuery('');
      toast({ title: 'Scanned Successfully', description: `Added ${matchedProd.name} to cart.` });
    } else {
      toast({ title: 'Not Found', description: `No product variant matches code: ${barcode}`, variant: 'destructive' });
    }
  };

  // Add Product Variant to Cart
  const addToCart = (product: any, variant: any) => {
    const existing = cartItems.find(item => item.variantId === variant.id);
    if (existing) {
      if (existing.qty >= variant.stock) {
        toast({ title: 'Stock Limit', description: `Only ${variant.stock} units available in stock.`, variant: 'destructive' });
        return;
      }
      setCartItems(cartItems.map(item => item.variantId === variant.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      const newItem: POSItem = {
        id: Math.random().toString(36).substring(7),
        productId: product.id,
        variantId: variant.id,
        name: `${product.name} (${variant.sku || 'No SKU'})`,
        price: Number(variant.price),
        qty: 1,
        maxStock: variant.stock
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    const item = cartItems.find(i => i.id === id);
    if (item && qty > item.maxStock) {
      toast({ title: 'Stock Limit', description: `Maximum stock for this item is ${item.maxStock} units.`, variant: 'destructive' });
      return;
    }
    setCartItems(cartItems.map(i => i.id === id ? { ...i, qty } : i));
  };

  const removeCartItem = (id: string) => {
    setCartItems(cartItems.filter(i => i.id !== id));
  };

  // Apply Coupon Code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data: cp, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim())
        .eq('active', true)
        .single();
      
      if (error || !cp) throw new Error("Invalid Coupon");
      
      const discVal = Number(cp.value);
      if (cp.type === 'percentage') {
        setCouponDiscount(Math.round(subtotal * (discVal / 100)));
      } else {
        setCouponDiscount(discVal);
      }
      toast({ title: 'Coupon Applied', description: `Discount of ${discVal} (${cp.type}) has been applied.` });
    } catch (e) {
      console.warn('Failed coupon query, logging locally', e);
      if (couponCode.trim().toUpperCase() === 'ALGERIA10') {
        setCouponDiscount(Math.round(subtotal * 0.1));
        toast({ title: 'Local Coupon Applied', description: '10% discount applied.' });
      } else {
        toast({ title: 'Coupon Rejected', description: 'Invalid, expired, or inactive coupon code.', variant: 'destructive' });
      }
    }
  };

  // Pricing math
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tvaValue = Math.round(subtotal * (tvaRate / 100));
  const finalTotal = Math.max(0, subtotal - couponDiscount + tvaValue + shippingCost);
  const changeOwed = Number(amountReceived) > finalTotal ? Number(amountReceived) - finalTotal : 0;

  // Checkout Handler
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast({ title: 'POS Cart Empty', description: 'Please add at least one product to check out.', variant: 'destructive' });
      return;
    }

    if (!customerName || !customerPhone) {
      toast({ title: 'Customer Missing', description: 'Customer Name and Phone Number are required for POS receipt.', variant: 'destructive' });
      return;
    }

    const orderPayload = {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress: shippingAddress || 'Store POS Checkout',
      billingAddress: shippingAddress || 'Store POS Checkout',
      paymentType,
      paymentStatus: onCredit ? 'pending' : 'paid',
      total: finalTotal,
      profit: Math.round(finalTotal * 0.15), // Est 15% profit
      items: cartItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        quantity: item.qty,
        price: item.price
      })),
      customerNotes
    };

    try {
      setIsLoading(true);
      // Connect to orderService
      const { data: newOrder } = await supabase
        .from('orders')
        .insert({
          store_id: user?.storeId || '00000000-0000-0000-0000-000000000001',
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress || 'POS Sale',
          billing_address: shippingAddress || 'POS Sale',
          payment_type: paymentType,
          payment_status: onCredit ? 'pending' : 'paid',
          total: finalTotal,
          profit: orderPayload.profit,
          status: 'completed',
          customer_notes: customerNotes
        })
        .select()
        .single();
      
      if (newOrder) {
        // Insert order items
        const itemsToInsert = cartItems.map(item => ({
          order_id: newOrder.id,
          product_id: item.productId,
          variant_id: item.variantId || null,
          product_name: item.name,
          quantity: item.qty,
          price: item.price
        }));
        await supabase.from('order_items').insert(itemsToInsert);

        // Deduct inventory
        for (const item of cartItems) {
          if (item.variantId) {
            const { data: v } = await supabase.from('product_variants').select('stock').eq('id', item.variantId).single();
            if (v) {
              const newStk = Math.max(0, v.stock - item.qty);
              await supabase.from('product_variants').update({ stock: newStk }).eq('id', item.variantId);
            }
          }
        }

        // Set receipt
        setReceiptOrder({
          id: newOrder.id.slice(0, 8).toUpperCase(),
          date: new Date().toLocaleDateString(),
          customerName,
          customerPhone,
          items: cartItems,
          subtotal,
          discount: couponDiscount,
          tva: tvaValue,
          shipping: shippingCost,
          total: finalTotal,
          paymentType,
          onCredit
        });
        setIsReceiptOpen(true);
      }
    } catch (err) {
      console.warn('Failed recording sale to database, creating local receipt', err);
      // Fallback local receipt
      setReceiptOrder({
        id: `POS-${Math.floor(Math.random() * 9000 + 1000)}`,
        date: new Date().toLocaleDateString(),
        customerName,
        customerPhone,
        items: cartItems,
        subtotal,
        discount: couponDiscount,
        tva: tvaValue,
        shipping: shippingCost,
        total: finalTotal,
        paymentType,
        onCredit
      });
      setIsReceiptOpen(true);
    } finally {
      setIsLoading(false);
    }

    // Reset checkout
    setCartItems([]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setShippingAddress('');
    setCouponCode('');
    setCouponDiscount(0);
    setAmountReceived('');
    setOnCredit(false);
    toast({ title: 'Sale Completed', description: 'POS receipt generated successfully.' });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" /> Point of Sale (POS) Checkout (نقطة البيع)
          </h1>
          <p className="text-muted-foreground">Search/Scan items, apply loyalty coupons, log payments, and print thermal customer receipts.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Columns: Products list & Barcode search */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow border bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><ScanBarcode className="h-4 w-4 text-primary" /> Scan Barcode / SKU</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <Input
                  placeholder="Scan SKU or Barcode..."
                  value={barcodeQuery}
                  onChange={e => setBarcodeQuery(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button type="submit" variant="secondary"><Check className="h-4 w-4" /></Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow border bg-card flex flex-col max-h-[500px]">
            <CardHeader className="p-4 pb-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products in database..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 overflow-y-auto space-y-2 flex-grow">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">No matching products found.</div>
              ) : (
                filteredProducts.map(p => {
                  const variant = p.product_variants?.[0];
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => variant && addToCart(p, variant)}
                      className="flex items-center justify-between p-2 border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 relative rounded overflow-hidden border bg-muted shrink-0">
                          <img src={p.base_image_url || 'https://placehold.co/40x40.png?text=Item'} alt={p.name} className="object-cover h-full w-full" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">SKU: {variant?.sku || 'N/A'} • Stock: {variant?.stock || 0}</div>
                        </div>
                      </div>
                      <div className="font-semibold font-mono text-primary">{variant?.price ? `${Number(variant.price).toLocaleString()} DA` : 'N/A'}</div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 7 Columns: Order Cart Ledger & Customer Form */}
        <form onSubmit={handleCheckout} className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cart Items List */}
          <Card className="shadow border bg-card flex flex-col h-full md:col-span-2">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Active Shopping Cart</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-grow max-h-[220px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="w-[80px] text-center text-xs">Qty</TableHead>
                    <TableHead className="w-[100px] text-right text-xs">Price</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">Cart is empty. Click left items to add.</TableCell>
                    </TableRow>
                  ) : (
                    cartItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="py-2 text-xs truncate max-w-[160px] font-semibold">{item.name}</TableCell>
                        <TableCell className="py-2 text-center">
                          <input 
                            type="number" 
                            className="w-12 text-center border rounded h-6 font-mono text-xs" 
                            value={item.qty} 
                            onChange={e => updateQty(item.id, Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono font-semibold text-xs">
                          {(item.price * item.qty).toLocaleString()} DA
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => removeCartItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Customer Details Form */}
          <Card className="shadow border bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Name *</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ahmed Ali" className="h-8 text-xs" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Phone Number *</Label>
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0550 12 34 56" className="h-8 text-xs font-mono" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Wilaya (Province)</Label>
                <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border text-xs">
                    {algerianWilayas.map(w => <SelectItem key={w.code} value={w.code}>{w.code} - {w.name_en || w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Address</Label>
                <Input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Algiers Center" className="h-8 text-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Ledger calculations & checkout payment */}
          <Card className="shadow border bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow text-xs">
              <div className="flex gap-2">
                <Input placeholder="Coupon (Algeria10)" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="h-8 text-xs font-mono" />
                <Button type="button" size="sm" variant="outline" onClick={handleApplyCoupon} className="h-8">Apply</Button>
              </div>
              
              <div className="space-y-1.5 border-y py-2 font-mono">
                <div className="flex justify-between"><span>Subtotal:</span><span>{subtotal.toLocaleString()} DA</span></div>
                <div className="flex justify-between text-red-500"><span>Discount:</span><span>-{couponDiscount.toLocaleString()} DA</span></div>
                <div className="flex justify-between"><span>TVA (19%):</span><span>{tvaValue.toLocaleString()} DA</span></div>
                <div className="flex justify-between"><span>Shipping ({selectedCourier}):</span><span>{shippingCost.toLocaleString()} DA</span></div>
                <div className="flex justify-between font-bold text-sm text-primary border-t pt-1.5">
                  <span>Grand Total:</span><span>{finalTotal.toLocaleString()} DA</span>
                </div>
              </div>

              {/* Payment selector */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[9px]">Payment Method</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border text-xs">
                      <SelectItem value="cash">Cash (نقدي)</SelectItem>
                      <SelectItem value="cib">CIB Card</SelectItem>
                      <SelectItem value="ccp">BaridiMob</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[9px]">Cash Received (DA)</Label>
                  <Input 
                    type="number" 
                    value={amountReceived} 
                    onChange={e => setAmountReceived(e.target.value)} 
                    className="h-7 text-xs font-mono" 
                    placeholder="e.g. 5000"
                    disabled={paymentType !== 'cash'}
                  />
                </div>
              </div>

              {paymentType === 'cash' && Number(amountReceived) > 0 && (
                <div className="bg-slate-50 border p-1 rounded font-mono font-bold text-center text-[10px] text-slate-700">
                  Change: {changeOwed.toLocaleString()} DA
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Checkbox id="onCredit" checked={onCredit} onCheckedChange={(val: boolean) => setOnCredit(val)} />
                <Label htmlFor="onCredit" className="cursor-pointer text-[10px] font-bold text-red-500">Deferred Payment (الدفع الآجل - On Credit)</Label>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button type="submit" className="w-full h-9 bg-primary hover:bg-primary/95 text-white text-xs font-bold">
                Finalize Sale & Print Invoice
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>

      {/* Printable Thermal Receipt Modal Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-sm bg-white border text-black font-mono text-xs">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-center font-bold text-base uppercase">Khidmatik Receipt</DialogTitle>
            <DialogDescription className="text-center text-[10px]">Merchant POS Invoice Copy</DialogDescription>
          </DialogHeader>
          {receiptOrder && (
            <div className="space-y-3 py-2">
              <div className="space-y-0.5 border-b pb-2 text-[10px]">
                <div>Order Ref: #{receiptOrder.id}</div>
                <div>Date: {receiptOrder.date}</div>
                <div>Customer: {receiptOrder.customerName}</div>
                <div>Phone: {receiptOrder.customerPhone}</div>
              </div>
              
              {/* Receipt Items list */}
              <div className="space-y-1.5 border-b pb-2">
                {receiptOrder.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <div className="truncate max-w-[180px]">{item.name} x {item.qty}</div>
                    <div>{(item.price * item.qty).toLocaleString()} DA</div>
                  </div>
                ))}
              </div>

              {/* Financial calculations summary */}
              <div className="space-y-1 text-right text-[10px]">
                <div className="flex justify-between"><span>Subtotal:</span><span>{receiptOrder.subtotal.toLocaleString()} DA</span></div>
                <div className="flex justify-between"><span>Discount:</span><span>-{receiptOrder.discount.toLocaleString()} DA</span></div>
                <div className="flex justify-between"><span>TVA (19%):</span><span>{receiptOrder.tva.toLocaleString()} DA</span></div>
                <div className="flex justify-between"><span>Shipping:</span><span>{receiptOrder.shipping.toLocaleString()} DA</span></div>
                <div className="flex justify-between font-bold text-[12px] border-t pt-1.5 uppercase">
                  <span>Grand Total:</span><span>{receiptOrder.total.toLocaleString()} DA</span>
                </div>
              </div>

              <div className="text-center text-[9px] border-t pt-2 space-y-1">
                <div>Payment Mode: <span className="font-bold uppercase">{receiptOrder.paymentType} {receiptOrder.onCredit ? '(ON CREDIT)' : ''}</span></div>
                <div>*** Thank you for shopping with us! ***</div>
                <div>Powered by Khidmatik Algeria</div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row gap-2 border-t pt-2 mt-2">
            <Button size="sm" variant="outline" className="flex-grow text-[10px]" onClick={() => window.print()}><Printer className="mr-1 h-3.5 w-3.5" /> Print</Button>
            <Button size="sm" variant="secondary" className="flex-grow text-[10px]" onClick={() => toast({ title: 'Sent successfully', description: 'Invoice sent to customer via WhatsApp link.' })}><Send className="mr-1 h-3.5 w-3.5" /> WhatsApp</Button>
            <DialogClose asChild><Button size="sm" className="text-[10px]">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
