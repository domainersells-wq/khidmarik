'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Palette, 
  Globe, 
  Image as ImageIcon, 
  UploadCloud, 
  AlertTriangle, 
  Trash2, 
  Loader2,
  Settings,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { BannerItem } from '@/types';

const HOMEPAGE_BANNERS_STORAGE_KEY = 'khidmatikHomepageBanners';
const FEATURE_FLAGS_STORAGE_KEY = 'khidmatikFeatureFlags';
const MAX_BANNER_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export function PlatformCMSection() {
  const { toast } = useToast();
  
  // Tab controller
  const [activeTab, setActiveTab] = useState<'content' | 'features'>('content');

  // Content states
  const [selectedPage, setSelectedPage] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerLink, setBannerLink] = useState('');
  const [bannerAltText, setBannerAltText] = useState('');
  const [uploadedBanners, setUploadedBanners] = useState<BannerItem[]>([]);
  const [isBannerSaving, setIsBannerSaving] = useState(false);

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    marketplace: true,
    reservations: true,
    subscriptions: true,
    digital_products: true,
    coupons: true,
    wallet: true,
    loyalty_points: true,
    affiliate_system: false,
    reviews: true,
    chat: true,
    support_center: true,
  });

  useEffect(() => {
    try {
      const storedBannersJSON = localStorage.getItem(HOMEPAGE_BANNERS_STORAGE_KEY);
      if (storedBannersJSON) {
        const bannersData: BannerItem[] = JSON.parse(storedBannersJSON);
        if (Array.isArray(bannersData)) {
          setUploadedBanners(bannersData);
        }
      }
      
      const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      if (storedFlags) {
        setFeatureFlags(JSON.parse(storedFlags));
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error);
    }
  }, []);

  const handleEditPage = (pageSlug: string) => {
    setSelectedPage(pageSlug);
    setPageContent(`Content for ${pageSlug}... (Loaded from backend - conceptual)`);
    toast({ title: `Editing Page: ${pageSlug}`, description: "WYSIWYG editor content loaded." });
  };

  const handleSavePageContent = () => {
    if (!selectedPage || !pageContent.trim()) {
      toast({ title: "Error", description: "No page selected or content is empty.", variant: "destructive"});
      return;
    }
    toast({ title: "Page Content Saved", description: `Content for ${selectedPage} updated.` });
  };
  
  const handleSaveBanner = async () => {
    if(!bannerImageFile) {
      toast({title: "Missing Image", description: "Please select a banner image.", variant: "destructive"});
      return;
    }
    if(!bannerAltText.trim()){
      toast({title: "Missing Alt Text", description: "Please provide alt text for accessibility.", variant: "destructive"});
      return;
    }

    if (bannerImageFile.size > MAX_BANNER_FILE_SIZE_BYTES) {
      toast({
        title: "Image Too Large",
        description: `Selected image exceeds 1MB. Please choose a smaller file.`,
        variant: "destructive",
      });
      return;
    }

    setIsBannerSaving(true);
    const reader = new FileReader();
    reader.readAsDataURL(bannerImageFile);
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      const newBanner: BannerItem = {
        id: 'banner_' + Date.now(),
        src: base64Image,
        alt: bannerAltText,
        link: bannerLink.trim() || undefined
      };
      
      const updatedBanners = [...uploadedBanners, newBanner];
      setUploadedBanners(updatedBanners);
      localStorage.setItem(HOMEPAGE_BANNERS_STORAGE_KEY, JSON.stringify(updatedBanners));
      
      setIsBannerSaving(false);
      setBannerImageFile(null);
      setBannerAltText('');
      setBannerLink('');
      toast({title: "Banner Added", description: "Banner registered successfully."});
    };
  };

  const handleDeleteBanner = (id: string) => {
    const updated = uploadedBanners.filter(b => b.id !== id);
    setUploadedBanners(updated);
    localStorage.setItem(HOMEPAGE_BANNERS_STORAGE_KEY, JSON.stringify(updated));
    toast({title: "Banner Deleted", description: "Removed banner configuration."});
  };

  const handleToggleFlag = (flagName: string) => {
    const nextFlags = {
      ...featureFlags,
      [flagName]: !featureFlags[flagName]
    };
    setFeatureFlags(nextFlags);
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(nextFlags));
    toast({
      title: "Feature Flag Updated",
      description: `Feature ${flagName.replace('_', ' ')} is now ${nextFlags[flagName] ? 'ENABLED' : 'DISABLED'}.`,
    });
  };

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> CMS & Feature Flags
          </h1>
          <p className="text-xs text-muted-foreground">Manage public web pages, landing promotional banners, and toggle core system modules dynamically.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'content' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('content')}
          >
            Content & Banners
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'features' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('features')}
          >
            Feature Management
          </Button>
        </div>
      </header>

      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Page Editor */}
          <Card className="border rounded-2xl shadow-sm bg-card">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Globe className="h-4.5 w-4.5 text-primary" /> Static Page Manager</CardTitle>
              <CardDescription className="text-xs">Update content templates for terms, privacy pages, and landing sections.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Select Page</Label>
                <Select value={selectedPage} onValueChange={handleEditPage}>
                  <SelectTrigger className="rounded-xl h-10 border-input text-xs">
                    <SelectValue placeholder="Choose a page..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="about-us">About Us Page</SelectItem>
                    <SelectItem value="terms-of-service">Terms of Service</SelectItem>
                    <SelectItem value="privacy-policy">Privacy Policy</SelectItem>
                    <SelectItem value="faq">FAQ Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPage && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-700">Page Content</Label>
                    <Textarea 
                      value={pageContent}
                      onChange={(e) => setPageContent(e.target.value)}
                      className="rounded-xl border-input text-xs min-h-[140px]"
                    />
                  </div>
                  <Button onClick={handleSavePageContent} className="rounded-xl h-10 px-5 text-xs bg-primary text-primary-foreground">Save Page Content</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promotional Banners */}
          <Card className="border rounded-2xl shadow-sm bg-card">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><ImageIcon className="h-4.5 w-4.5 text-primary" /> Homepage Carousel Banners</CardTitle>
              <CardDescription className="text-xs">Manage banners displayed on the landing page carousel.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="font-bold text-slate-700">Upload Banner Image (Max 1MB: PNG, JPG, WEBP) *</Label>
                <Input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setBannerImageFile(e.target.files?.[0] || null)} className="rounded-xl mt-1 text-xs" />
                {bannerImageFile && <p className="text-xs text-green-600 mt-1">Selected: {bannerImageFile.name} ({(bannerImageFile.size / 1024).toFixed(1)} KB)</p>}
              </div>
              <div>
                <Label className="font-bold text-slate-700">Banner Alt Text * (for accessibility)</Label>
                <Input value={bannerAltText} onChange={(e) => setBannerAltText(e.target.value)} placeholder="e.g. End of year special electronics sale" className="rounded-xl text-xs h-10" />
              </div>
              <div>
                <Label className="font-bold text-slate-700">Target Link URL (Optional)</Label>
                <Input value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} placeholder="e.g. /listings?category=electronics" className="rounded-xl text-xs h-10" />
              </div>
              <Button onClick={handleSaveBanner} disabled={!bannerImageFile || !bannerAltText.trim() || isBannerSaving} className="rounded-xl h-10 px-5 text-xs bg-primary text-primary-foreground">
                {isBannerSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Add Banner Config
              </Button>
              
              <div className="pt-4 border-t">
                <h4 className="font-bold text-xs text-slate-800 mb-2">Live Banners Carousel list</h4>
                {uploadedBanners.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedBanners.map((banner) => (
                      <div key={banner.id} className="flex gap-3 items-center border rounded-xl p-3 bg-slate-50/50">
                        <div className="relative h-12 w-24 rounded border overflow-hidden shrink-0 bg-white">
                          <Image src={banner.src} alt={banner.alt} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{banner.alt}</p>
                          {banner.link && <p className="text-[10px] text-muted-foreground truncate">{banner.link}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg" onClick={() => handleDeleteBanner(banner.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No banner slides configured yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'features' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Settings className="h-4.5 w-4.5 text-primary" /> Feature Management</CardTitle>
            <CardDescription className="text-xs">Enable or disable entire functional modules on-the-fly without editing code or rebuilding the bundle.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'marketplace', label: 'Marketplace Module', desc: 'Allows stores to sell physical products.' },
                { name: 'reservations', label: 'Reservations System', desc: 'Enables booking of halls, tables, and services.' },
                { name: 'subscriptions', label: 'Merchant Subscription Billing', desc: 'Controls monthly store plans checkout.' },
                { name: 'digital_products', label: 'Digital Products Store', desc: 'Supports downloadable PDF/key sales.' },
                { name: 'coupons', label: 'Coupons & Promo Codes', desc: 'Global platform discount calculations.' },
                { name: 'wallet', label: 'User Balance Wallet', desc: 'Stores merchant earnings and cash balances.' },
                { name: 'loyalty_points', label: 'Loyalty Points System', desc: 'Distributes cashbacks on successful purchases.' },
                { name: 'affiliate_system', label: 'Affiliate Marketing', desc: 'Referral tracking links and commission splits.' },
                { name: 'reviews', label: 'Reviews & Rating Engine', desc: 'Controls feedback logging on completed services.' },
                { name: 'chat', label: 'Direct Messages & Chat', desc: 'Instant chat between sellers and buyers.' },
                { name: 'support_center', label: 'Help & Support Tickets', desc: 'Support dispatch lines and query forms.' },
              ].map((flag) => {
                const isEnabled = featureFlags[flag.name] || false;
                return (
                  <div key={flag.name} className="flex justify-between items-start border rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5 max-w-[80%] text-left rtl:text-right">
                      <h4 className="text-xs font-bold text-slate-800">{flag.label}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{flag.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleToggleFlag(flag.name)}
                      className={`h-6 w-11 rounded-full relative transition-all duration-300 focus:outline-none shrink-0 ${
                        isEnabled ? 'bg-primary' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`h-4.5 w-4.5 rounded-full bg-white absolute top-0.75 transition-all shadow-sm ${
                        isEnabled ? 'right-0.75' : 'left-0.75'
                      }`}></span>
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t p-4 flex gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Toggling features updates the global configuration state locally. In production, these variables interface with Firebase Remote Config or database settings collections to update checkout rules instantly.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
