'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Megaphone, Ticket, Image as ImageIcon, SearchCheck, PlusCircle, List, Settings, Mail, Bell, Activity, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'flash_sale' | 'first_order' | 'post_review';
  value: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired';
  userRestriction?: string;
  usageLimit?: number;
  timesUsed?: number;
  minOrderValue?: number;
  storeId?: string;
}

interface Banner {
  id: string;
  imageUrl: string;
  redirectUrl: string;
}

export function MarketingSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: '1', code: 'RAMADAN2026', type: 'percentage', value: 15, startDate: '2026-03-01', endDate: '2026-04-15', status: 'Active', userRestriction: 'all', timesUsed: 4 },
    { id: '2', code: 'WELCOME10', type: 'fixed', value: 500, startDate: '2026-01-01', endDate: '2026-12-31', status: 'Active', userRestriction: 'first_order', timesUsed: 12 }
  ]);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping' | 'flash_sale' | 'first_order' | 'post_review'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userRestriction, setUserRestriction] = useState('all');
  const [usageLimit, setUsageLimit] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [isCouponsDialogOpen, setIsCouponsDialogOpen] = useState(false);

  // Banners State
  const [banners, setBanners] = useState<Banner[]>([
    { id: 'b1', imageUrl: 'https://placehold.co/600x200.png', redirectUrl: '/listings/store2' }
  ]);
  const [bannerRedirect, setBannerRedirect] = useState('');
  const [bannerFile, setBannerFile] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // SEO State
  const [seoTitle, setSeoTitle] = useState('My Khidmatik E-commerce Shop');
  const [seoDescription, setSeoDescription] = useState('Find the best hand-crafted items and digital services in Algeria.');
  const [seoKeywords, setSeoKeywords] = useState('khidmatik, shop, algeria, ecommerce');
  const [isSavingSeo, setIsSavingSeo] = useState(false);
  const [isSeoDialogOpen, setIsSeoDialogOpen] = useState(false);

  // Automation States
  const [abandonedEnabled, setAbandonedEnabled] = useState(true);
  const [abandonedDelay, setAbandonedDelay] = useState('2');
  const [abandonedTemplate, setAbandonedTemplate] = useState('Hey! You left items in your cart. Complete purchase now to get 10% off.');
  const [isAbandonedOpen, setIsAbandonedOpen] = useState(false);

  const [postPurchaseEnabled, setPostPurchaseEnabled] = useState(false);
  const [postPurchaseDelay, setPostPurchaseDelay] = useState('3');
  const [postPurchaseTemplate, setPostPurchaseTemplate] = useState('Thank you for buying! Leave a review to claim 50 loyalty points.');
  const [isPostPurchaseOpen, setIsPostPurchaseOpen] = useState(false);

  const [restockEnabled, setRestockEnabled] = useState(true);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // Load configuration from Supabase / LocalStorage
  useEffect(() => {
    async function loadMarketing() {
      if (!user) return;
      setIsLoading(true);
      const keys = ['coupons', 'banners', 'seo', 'automation'];
      const localData: Record<string, any> = {};

      // Load defaults / local fallbacks
      keys.forEach(key => {
        if (key === 'coupons') {
          const stored = localStorage.getItem('khidmatik_marketing_coupons');
          if (stored) {
            const allCoupons = JSON.parse(stored);
            localData[key] = user.storeId 
              ? allCoupons.filter((c: any) => c.storeId === user.storeId)
              : allCoupons;
          }
        } else {
          const stored = localStorage.getItem(`khidmatik_marketing_${user.storeId || 'global'}_${key}`);
          if (stored) {
            localData[key] = JSON.parse(stored);
          }
        }
      });

      // Try fetching from Supabase
      try {
        let query = supabase.from('store_settings').select('*').in('key', keys);
        if (user.storeId) {
          query = query.eq('store_id', user.storeId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          data.forEach(item => {
            localData[item.key] = item.value;
          });
        }
      } catch (e) {
        console.warn('Failed loading marketing options from Supabase:', e);
      }

      if (localData.coupons) setCoupons(localData.coupons);
      if (localData.banners) setBanners(localData.banners);
      if (localData.seo) {
        setSeoTitle(localData.seo.title || 'My Khidmatik E-commerce Shop');
        setSeoDescription(localData.seo.description || '');
        setSeoKeywords(localData.seo.keywords || '');
      }
      if (localData.automation) {
        setAbandonedEnabled(localData.automation.abandonedEnabled ?? true);
        setAbandonedDelay(localData.automation.abandonedDelay || '2');
        setAbandonedTemplate(localData.automation.abandonedTemplate || '');
        setPostPurchaseEnabled(localData.automation.postPurchaseEnabled ?? false);
        setPostPurchaseDelay(localData.automation.postPurchaseDelay || '3');
        setPostPurchaseTemplate(localData.automation.postPurchaseTemplate || '');
        setRestockEnabled(localData.automation.restockEnabled ?? true);
      }
      setIsLoading(false);
    }
    loadMarketing();
  }, [user]);

  // Save Config Helper
  const saveMarketingKey = async (key: string, value: any) => {
    if (!user) return false;
    
    // Save to LocalStorage first
    if (key === 'coupons') {
      const existingRaw = localStorage.getItem('khidmatik_marketing_coupons');
      let allCoupons: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      allCoupons = allCoupons.filter(c => c.storeId !== user.storeId);
      const merged = [...allCoupons, ...value.map((c: any) => ({ ...c, storeId: user.storeId }))];
      localStorage.setItem('khidmatik_marketing_coupons', JSON.stringify(merged));
    } else {
      localStorage.setItem(`khidmatik_marketing_${user.storeId || 'global'}_${key}`, JSON.stringify(value));
    }

    try {
      const payload: any = {
        key,
        value,
        updated_at: new Date().toISOString()
      };
      if (user.storeId) {
        payload.store_id = user.storeId;
      }
      const { error } = await supabase.from('store_settings').upsert(payload);
      return !error;
    } catch (e) {
      console.warn(`Failed writing marketing key ${key} to Supabase:`, e);
      return false;
    }
  };

  // Create Coupon action
  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode || !user) return;
    setIsCreatingCoupon(true);

    const newCoupon: Coupon = {
      id: Date.now().toString(),
      code: couponCode.toUpperCase().replace(/\s+/g, ''),
      type: discountType,
      value: discountType === 'free_shipping' ? 0 : Number(discountValue),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      userRestriction: userRestriction,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
      timesUsed: 0
    };

    const updated = [...coupons, newCoupon];
    const saved = await saveMarketingKey('coupons', updated);
    setCoupons(updated);
    setIsCreatingCoupon(false);
    setCouponCode('');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
    setUserRestriction('all');
    setUsageLimit('');
    setMinOrderValue('');

    toast({
      title: saved ? "Coupon Saved to Cloud" : "Coupon Saved Locally",
      description: `Discount Coupon ${newCoupon.code} created successfully.`
    });
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const updated = coupons.filter(c => c.id !== couponId);
    const saved = await saveMarketingKey('coupons', updated);
    setCoupons(updated);
    toast({ title: "Coupon Removed", description: "The coupon has been successfully deactivated." });
  };

  // Upload Banner action
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBannerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bannerFile) return;
    setIsUploadingBanner(true);

    const newBanner: Banner = {
      id: `b-${Date.now()}`,
      imageUrl: bannerFile,
      redirectUrl: bannerRedirect || '#'
    };

    const updated = [...banners, newBanner];
    const saved = await saveMarketingKey('banners', updated);
    setBanners(updated);

    setIsUploadingBanner(false);
    setIsBannerDialogOpen(false);
    setBannerFile('');
    setBannerRedirect('');

    toast({
      title: saved ? "Banner Uploaded to Cloud" : "Banner Uploaded Locally",
      description: "New homepage banner added successfully."
    });
  };

  const handleDeleteBanner = async (bannerId: string) => {
    const updated = banners.filter(b => b.id !== bannerId);
    const saved = await saveMarketingKey('banners', updated);
    setBanners(updated);
    toast({ title: "Banner Removed", description: "Banner has been deleted from homepage list." });
  };

  // Save SEO settings
  const handleSaveSeo = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingSeo(true);
    const data = { title: seoTitle, description: seoDescription, keywords: seoKeywords };
    const saved = await saveMarketingKey('seo', data);
    setIsSavingSeo(false);
    setIsSeoDialogOpen(false);

    toast({
      title: saved ? "SEO Configuration Updated" : "SEO Config Saved Locally",
      description: "Search engine tags, meta title, and description updated."
    });
  };

  // Save Automation settings
  const handleSaveAutomation = async (type: 'abandoned' | 'post' | 'restock') => {
    const data = {
      abandonedEnabled,
      abandonedDelay,
      abandonedTemplate,
      postPurchaseEnabled,
      postPurchaseDelay,
      postPurchaseTemplate,
      restockEnabled
    };
    const saved = await saveMarketingKey('automation', data);
    
    if (type === 'abandoned') setIsAbandonedOpen(false);
    if (type === 'post') setIsPostPurchaseOpen(false);
    if (type === 'restock') setIsRestockOpen(false);

    toast({
      title: saved ? "Marketing Automations Saved" : "Automation Rules Saved Locally",
      description: "Trigger alerts, emails, and timeouts configuration updated."
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading marketing & automated tools...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-4">
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Megaphone className="mr-3 h-8 w-8 text-primary" /> Marketing & Promotions
        </h1>
        <p className="text-muted-foreground">Tools to boost sales, attract customers, and automate marketing tasks.</p>
      </header>

      {/* Discount Coupons & Promotions */}
      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle className="flex items-center"><Ticket className="mr-2 h-5 w-5 text-primary" /> Discount Coupons & Promotions</CardTitle>
          <CardDescription>Create and manage promotional discount codes and time-limited offers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCreateCoupon} className="space-y-4 p-4 border dark:border-slate-800 rounded-md bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="couponCode">Coupon Code</Label>
                <Input id="couponCode" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g., SUMMER20" required />
              </div>
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={discountType} onValueChange={val => setDiscountType(val as any)}>
                  <SelectTrigger id="discountType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (DA)</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale override</SelectItem>
                    <SelectItem value="first_order">First Order promo</SelectItem>
                    <SelectItem value="post_review">Post-Review reward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">Value / Amount</Label>
                <Input id="discountValue" type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="e.g., 20 or 500" disabled={discountType === 'free_shipping'} required={discountType !== 'free_shipping'}/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minOrderValue">Min Basket Value (DA)</Label>
                <Input id="minOrderValue" type="number" min="0" value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} placeholder="e.g. 2000" />
              </div>
              <div>
                <Label htmlFor="usageLimit">Total Usage Limit</Label>
                <Input id="usageLimit" type="number" min="0" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="e.g. 100 uses" />
              </div>
              <div>
                <Label htmlFor="userRestriction">Audience Scope</Label>
                <Select value={userRestriction} onValueChange={setUserRestriction}>
                  <SelectTrigger id="userRestriction"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buyers</SelectItem>
                    <SelectItem value="first_order">First Order Only</SelectItem>
                    <SelectItem value="post_review">Verified Reviewers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="promoStartDate">Promotion Start Date</Label>
                <Input id="promoStartDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="promoEndDate">Promotion End Date</Label>
                <Input id="promoEndDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={isCreatingCoupon} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isCreatingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PlusCircle className="mr-2 h-4 w-4" /> Create Coupon/Promotion
            </Button>
          </form>

          <div>
            <h4 className="font-semibold text-sm mb-2">Manage Active Promotions</h4>
            <p className="text-xs text-muted-foreground mb-3">View performance, usage count, and active discount terms.</p>
            
            <Dialog open={isCouponsDialogOpen} onOpenChange={setIsCouponsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <List className="mr-2 h-4 w-4" /> View All Coupons ({coupons.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg text-slate-800 bg-white">
                <DialogHeader>
                  <DialogTitle>Active & Past Promotions</DialogTitle>
                  <DialogDescription>Deactivate or delete promo codes. Active codes apply to checkout.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 max-h-60 overflow-y-auto border p-2 rounded-md bg-muted/20 my-3">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex justify-between items-center bg-card p-3 border rounded-md text-xs">
                      <div>
                        <p className="font-bold text-primary text-sm">{coupon.code}</p>
                        <p className="text-muted-foreground">
                          {coupon.type === 'free_shipping' ? 'Free Shipping' : coupon.type === 'percentage' ? `${coupon.value}% off` : `${coupon.value} DA discount`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Valid: {coupon.startDate} to {coupon.endDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${coupon.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{coupon.status}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {coupons.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No active coupons.</p>}
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsCouponsDialogOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Manage Banners */}
      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary" /> Manage Banners</CardTitle>
          <CardDescription>Control homepage slides, promotional banners, and links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <div key={banner.id} className="relative border rounded-md overflow-hidden bg-muted/20 group">
                <div className="relative h-28 w-full">
                  <Image src={banner.imageUrl} alt="Promo Banner" fill className="object-cover" />
                </div>
                <div className="p-2 flex justify-between items-center bg-card text-xs">
                  <span className="truncate flex items-center gap-1 text-muted-foreground"><LinkIcon className="h-3 w-3" /> {banner.redirectUrl}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="text-destructive hover:text-destructive/80 h-7 w-7"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" /> Upload New Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md text-slate-800 bg-white">
              <form onSubmit={handleUploadBannerSubmit}>
                <DialogHeader>
                  <DialogTitle>Upload Promotional Banner</DialogTitle>
                  <DialogDescription>Add a slide banner to public listings page. Size recommendation: 1200x400.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="grid gap-1.5">
                    <Label htmlFor="b-file">Select Image File</Label>
                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerFileChange} />
                    <Button type="button" variant="outline" onClick={() => bannerInputRef.current?.click()}>
                      Choose Image
                    </Button>
                    {bannerFile && (
                      <div className="relative h-20 w-full border rounded-md overflow-hidden bg-slate-100">
                        <Image src={bannerFile} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="b-link">Redirect Destination URL</Label>
                    <Input id="b-link" value={bannerRedirect} onChange={e => setBannerRedirect(e.target.value)} placeholder="e.g., /listings/store2" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isUploadingBanner || !bannerFile}>
                    {isUploadingBanner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Banner
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* SEO Configuration */}
      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle className="flex items-center"><SearchCheck className="mr-2 h-5 w-5 text-primary" /> Search Engine Optimization (SEO)</CardTitle>
          <CardDescription>Improve store visibility on search engine results.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Edit store SEO tags, description, and keywords to rank better on Google and local directories.</p>
          
          <Dialog open={isSeoDialogOpen} onOpenChange={setIsSeoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" /> Configure SEO Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border text-slate-800">
              <form onSubmit={handleSaveSeo}>
                <DialogHeader>
                  <DialogTitle>Search Engine Optimization Settings</DialogTitle>
                  <DialogDescription>Modify global metadata. Search engines cache these fields dynamically.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="grid gap-1.5">
                    <Label htmlFor="seo-title">Meta Title Tag</Label>
                    <Input id="seo-title" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="seo-desc">Meta Description Tag</Label>
                    <Textarea id="seo-desc" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={3} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="seo-keys">Keywords (Comma separated)</Label>
                    <Input id="seo-keys" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSavingSeo}>
                    {isSavingSeo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save SEO Tags
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Marketing Automation */}
      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> Marketing Automation</CardTitle>
          <CardDescription>Enable trigger-based auto-alert rules to engage buyers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Abandoned Cart */}
          <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-sm">Abandoned Cart Reminder Emails</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Send a notice if a customer leaves items in cart.</p>
            </div>
            
            <Dialog open={isAbandonedOpen} onOpenChange={setIsAbandonedOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Configure</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800">
                <DialogHeader>
                  <DialogTitle>Abandoned Cart Auto-reminder</DialogTitle>
                  <DialogDescription>Customize email triggers sent to potential buyers.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ab-enable">Enable Automation</Label>
                    <Switch id="ab-enable" checked={abandonedEnabled} onCheckedChange={setAbandonedEnabled} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ab-delay">Trigger Delay (Hours)</Label>
                    <Select value={abandonedDelay} onValueChange={setAbandonedDelay}>
                      <SelectTrigger id="ab-delay">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Hour</SelectItem>
                        <SelectItem value="2">2 Hours (Recommended)</SelectItem>
                        <SelectItem value="24">24 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ab-template">Email Message Body</Label>
                    <Textarea id="ab-template" value={abandonedTemplate} onChange={e => setAbandonedTemplate(e.target.value)} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleSaveAutomation('abandoned')}>Save Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Post Purchase */}
          <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-sm">Post-Purchase Follow-up Messages</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Send a review request or thank you message post purchase.</p>
            </div>
            
            <Dialog open={isPostPurchaseOpen} onOpenChange={setIsPostPurchaseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Configure</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800">
                <DialogHeader>
                  <DialogTitle>Post-Purchase Auto-Alert</DialogTitle>
                  <DialogDescription>Build review reminders or follow-up discount coupons.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pp-enable">Enable Automation</Label>
                    <Switch id="pp-enable" checked={postPurchaseEnabled} onCheckedChange={setPostPurchaseEnabled} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="pp-delay">Trigger Delay (Days)</Label>
                    <Select value={postPurchaseDelay} onValueChange={setPostPurchaseDelay}>
                      <SelectTrigger id="pp-delay">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day after purchase</SelectItem>
                        <SelectItem value="3">3 Days after purchase</SelectItem>
                        <SelectItem value="7">7 Days after purchase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="pp-template">Notification Template</Label>
                    <Textarea id="pp-template" value={postPurchaseTemplate} onChange={e => setPostPurchaseTemplate(e.target.value)} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleSaveAutomation('post')}>Save Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Restocked Item */}
          <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-sm">Restocked Item Alerts</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Alert customers automatically if a watchlisted product is back.</p>
            </div>
            
            <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Configure</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800">
                <DialogHeader>
                  <DialogTitle>Back-in-stock Alerts</DialogTitle>
                  <DialogDescription>Notify watchlist users when quantity is updated.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rs-enable">Enable Automation</Label>
                    <Switch id="rs-enable" checked={restockEnabled} onCheckedChange={setRestockEnabled} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This triggers system-wide email notifications automatically whenever inventory quantity changes from 0 to positive numbers.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleSaveAutomation('restock')}>Save Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
