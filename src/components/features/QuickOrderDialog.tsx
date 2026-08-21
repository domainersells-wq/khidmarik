
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ProductItem, ProductVariant, CartItem, ShippingAddress, AlgerianMunicipality } from '@/types';
import { algerianWilayas } from '@/data/algerian-wilayas';
import { User, Phone, MapPin, Building2, PackagePlus, ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';

interface QuickOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductItem;
  selectedVariant?: ProductVariant;
}

const CONCEPTUAL_SHIPPING_FEE = 500; // Standard shipping fee in DA

export function QuickOrderDialog({ isOpen, onOpenChange, product, selectedVariant }: QuickOrderDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaCode, setWilayaCode] = useState('');
  const [cityCode, setCityCode] = useState(''); // Will store municipality name_fr or name
  const [addressLine, setAddressLine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<AlgerianMunicipality[]>([]);

  const productName = product.name;
  const productPrice = selectedVariant?.price ?? product.variants?.[0]?.price ?? 0;
  const productImage = selectedVariant?.image || product.baseImageUrl || `https://placehold.co/100x100.png?text=${encodeURIComponent(productName)}`;
  const variantDescription = selectedVariant?.attributes.map(a => a.value).join(' / ');

  const totalOrderPrice = productPrice + CONCEPTUAL_SHIPPING_FEE;

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPhone('');
      setWilayaCode('');
      setCityCode('');
      setAddressLine('');
      setAvailableMunicipalities([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (wilayaCode) {
      const selectedWilaya = algerianWilayas.find(w => w.code === wilayaCode);
      setAvailableMunicipalities(selectedWilaya?.municipalities || []);
      setCityCode(''); // Reset city when wilaya changes
    } else {
      setAvailableMunicipalities([]);
      setCityCode('');
    }
  }, [wilayaCode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !wilayaCode || !cityCode.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in your Name, Phone, Wilaya, and City/Municipality.',
        variant: 'destructive',
      });
      return;
    }
    if (!/^(05|06|07)\d{8}$/.test(phone)) {
        toast({ title: "Invalid Phone", description: "Please enter a valid Algerian mobile number (e.g., 05xxxxxxxx).", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const selectedCityName = cityCode; // cityCode now stores the name

    const orderDetails = {
      productName,
      variantDescription,
      productPrice,
      customerName: name,
      customerPhone: phone,
      shippingWilaya: algerianWilayas.find(w => w.code === wilayaCode)?.name_fr,
      shippingCity: selectedCityName,
      shippingAddress: addressLine,
      total: totalOrderPrice,
    };
    console.log('Quick Order Placed (Conceptual):', orderDetails);

    toast({
      title: 'Quick Order Placed! (Conceptual)',
      description: `Your order for ${productName} has been received. We will contact you at ${phone} to confirm details and delivery. Total: ${totalOrderPrice.toFixed(2)} DA.`,
      duration: 7000,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-headline">
            <PackagePlus className="mr-2 h-6 w-6 text-primary" /> Quick Order
          </DialogTitle>
          <DialogDescription>Confirm your details to quickly order this item.</DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 aspect-square bg-background rounded-md overflow-hidden shrink-0">
                <Image
                  src={productImage}
                  alt={productName}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <h3 className="font-semibold text-md">{productName}</h3>
                {variantDescription && <p className="text-xs text-muted-foreground">{variantDescription}</p>}
                <p className="text-lg font-bold text-primary">{productPrice.toFixed(2)} DA</p>
              </div>
            </div>
          </Card>

          <Separator />
          <h4 className="font-semibold text-center text-md text-foreground">أدخل معلوماتك هنا (Enter your information here)</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="quick-order-name" className="flex items-center">
                <User className="mr-2 h-4 w-4 text-muted-foreground" /> الإسم (Full Name) *
              </Label>
              <Input
                id="quick-order-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك (Enter your name)"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="quick-order-phone" className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" /> رقم الهاتف (Phone Number) *
              </Label>
              <Input
                id="quick-order-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="أدخل رقم هاتفك (e.g., 05xxxxxxxx)"
                required
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="quick-order-wilaya" className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" /> الولاية (Wilaya/Province) *
                    </Label>
                    <Select value={wilayaCode} onValueChange={setWilayaCode} required>
                        <SelectTrigger id="quick-order-wilaya" className="mt-1">
                        <SelectValue placeholder="اختر ولايتك (Select Wilaya)" />
                        </SelectTrigger>
                        <SelectContent>
                        {algerianWilayas.map((wilaya) => (
                            <SelectItem key={wilaya.code} value={wilaya.code}>
                            {wilaya.name_fr} ({wilaya.name})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="quick-order-city" className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" /> البلدية (City/Municipality) *
                    </Label>
                    <Select value={cityCode} onValueChange={setCityCode} required disabled={!wilayaCode || availableMunicipalities.length === 0}>
                        <SelectTrigger id="quick-order-city" className="mt-1">
                            <SelectValue placeholder={!wilayaCode ? "Select Wilaya first" : "اختر بلديتك (Select Municipality)"} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMunicipalities.length > 0 ? (
                                availableMunicipalities.map((municipality) => (
                                    <SelectItem key={municipality.name_fr || municipality.name} value={municipality.name_fr || municipality.name}>
                                    {municipality.name_fr || municipality.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="_placeholder_no_municipalities_" disabled>No municipalities for selected Wilaya (mock data)</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                     {wilayaCode && availableMunicipalities.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Mock data: No municipalities listed for this Wilaya yet.</p>
                    )}
                </div>
            </div>

            <div>
              <Label htmlFor="quick-order-address" className="flex items-center">
                عنوان إضافي (Additional Address - Optional)
              </Label>
              <Textarea
                id="quick-order-address"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g., Street name, building, apartment number..."
                rows={2}
                className="mt-1"
              />
            </div>
            
            <Separator className="my-3" />

            <div className="p-3 border rounded-md bg-card space-y-1.5">
                <h4 className="font-semibold text-md mb-1">ملخص الطلب (Order Summary)</h4>
                <div className="flex justify-between text-sm">
                    <span>{productName} {variantDescription && `(${variantDescription})`}</span>
                    <span>{productPrice.toFixed(2)} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>التوصيل (Conceptual Shipping)</span>
                    <span>{CONCEPTUAL_SHIPPING_FEE.toFixed(2)} DA</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>المجموع (Total)</span>
                    <span>{totalOrderPrice.toFixed(2)} DA</span>
                </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs flex items-start gap-2 mt-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                    الدفع عند الاستلام. سيتم الاتصال بك لتأكيد الطلب والتوصيل.
                    (Payment on delivery. You will be contacted to confirm the order and delivery.)
                </span>
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Processing...' : 'Place Quick Order'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

