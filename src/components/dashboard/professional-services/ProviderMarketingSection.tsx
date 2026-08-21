'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Ticket, Users, PlusCircle, PackagePlus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const defaultCoupons = [
  { id: 'cpn1', code: 'WELCOME10', discountType: 'percentage', value: 10, expiryDate: '2025-12-31', usageLimit: 100, usedCount: 23, status: 'Active' },
  { id: 'cpn2', code: 'SUMMER25', discountType: 'fixed', value: 2500, expiryDate: '2025-09-30', usageLimit: 50, usedCount: 50, status: 'Expired' },
];

export function ProviderMarketingSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_coupons');
    if (saved) {
      try { setCoupons(JSON.parse(saved)); } catch { setCoupons(defaultCoupons); }
    } else {
      setCoupons(defaultCoupons);
      localStorage.setItem('khidmatik_coupons', JSON.stringify(defaultCoupons));
    }
  }, []);

  const persist = (updated: any[]) => {
    setCoupons(updated);
    localStorage.setItem('khidmatik_coupons', JSON.stringify(updated));
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !discountValue) {
      toast({ title: translate('validationError', 'Validation Error'), description: translate('fillRequiredFields', 'Please fill code and value.'), variant: 'destructive' });
      return;
    }
    const numValue = parseFloat(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      toast({ title: translate('validationError', 'Error'), description: translate('invalidValue', 'Invalid discount value.'), variant: 'destructive' });
      return;
    }
    const newCoupon = {
      id: 'cpn_' + Date.now(),
      code: couponCode.trim().toUpperCase(),
      discountType,
      value: numValue,
      expiryDate: expiryDate || 'No Expiry',
      usageLimit: parseInt(usageLimit) || 0,
      usedCount: 0,
      status: 'Active',
    };
    const updated = [newCoupon, ...coupons];
    persist(updated);
    setCouponCode('');
    setDiscountValue('');
    setExpiryDate('');
    setUsageLimit('');
    toast({ title: translate('couponCreated', 'Coupon Created'), description: `${translate('couponCreatedDesc', 'Coupon')} "${newCoupon.code}" ${translate('createdSuccessfully', 'created successfully')}.` });
  };

  const handleDeleteCoupon = (id: string) => {
    const updated = coupons.filter(c => c.id !== id);
    persist(updated);
    toast({ title: translate('couponDeleted', 'Coupon Deleted') });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Megaphone className="mr-3 h-8 w-8 text-primary" /> {translate('marketingPromotions', 'Marketing & Promotions')}
        </h1>
        <p className="text-muted-foreground">{translate('boostVisibility', 'Boost your visibility and attract more clients with promotional tools.')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Ticket className="mr-2 h-5 w-5 text-primary" /> {translate('discountCoupons', 'Discount Coupons & Promo Codes')}</CardTitle>
          <CardDescription>{translate('createManageCoupons', 'Create and manage discount codes for your services.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCoupon} className="space-y-4 p-4 border rounded-md bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="couponCode">{translate('couponCode', 'Coupon Code')}</Label>
                <Input id="couponCode" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g., WELCOME10" />
              </div>
              <div>
                <Label htmlFor="discountType">{translate('discountType', 'Discount Type')}</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger id="discountType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{translate('percentage', 'Percentage (%)')}</SelectItem>
                    <SelectItem value="fixed">{translate('fixedAmount', 'Fixed Amount (DA)')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">{translate('valueAmount', 'Value / Amount')}</Label>
                <Input id="discountValue" type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="e.g., 10 or 500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="couponExpiry">{translate('expiryDate', 'Expiry Date (Optional)')}</Label>
                <Input id="couponExpiry" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="couponUsageLimit">{translate('usageLimit', 'Usage Limit (0 = unlimited)')}</Label>
                <Input id="couponUsageLimit" type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="e.g., 100" />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> {translate('createCoupon', 'Create Coupon')}</Button>
          </form>

          {coupons.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">{translate('existingCoupons', 'Existing Coupons')}</h4>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translate('code', 'Code')}</TableHead>
                      <TableHead>{translate('discount', 'Discount')}</TableHead>
                      <TableHead>{translate('expiryDate', 'Expiry')}</TableHead>
                      <TableHead>{translate('usage', 'Usage')}</TableHead>
                      <TableHead>{translate('tableStatusHeader', 'Status')}</TableHead>
                      <TableHead className="text-right">{translate('tableActionsHeader', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map(cpn => (
                      <TableRow key={cpn.id}>
                        <TableCell className="font-mono font-bold">{cpn.code}</TableCell>
                        <TableCell>{cpn.value}{cpn.discountType === 'percentage' ? '%' : ' DA'}</TableCell>
                        <TableCell>{cpn.expiryDate}</TableCell>
                        <TableCell>{cpn.usedCount}/{cpn.usageLimit || '∞'}</TableCell>
                        <TableCell>
                          <Badge className={cpn.status === 'Active' ? 'bg-green-500 text-white' : ''} variant={cpn.status === 'Active' ? 'default' : 'secondary'}>
                            {cpn.status === 'Active' ? translate('filterActive', 'Active') : translate('expired', 'Expired')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(cpn.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><PackagePlus className="mr-2 h-5 w-5 text-primary" /> {translate('serviceBundlesTitle', 'Discounted Service Packages')}</CardTitle>
          <CardDescription>{translate('serviceBundlesDesc', 'Create special offers by bundling multiple services at a discounted rate.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{translate('manageBundlesNote', 'Manage service bundles from the Service Management section when adding or editing services.')}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => toast({ title: translate('serviceBundlesTitle', 'Service Bundles'), description: translate('navigateToServiceManagement', 'Navigate to Service Management to create bundles.') })}>
            {translate('manageServiceBundles', 'Manage Service Bundles')}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> {translate('clientTargeting', 'Client Targeting')}</CardTitle>
          <CardDescription>{translate('clientTargetingDesc', 'Tools to run targeted promotions to specific client segments.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{translate('clientTargetingPlanned', 'This feature is planned for future releases with personalized marketing capabilities.')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
