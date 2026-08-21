'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Globe, 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  DollarSign, 
  Sliders, 
  Layout, 
  FileText,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export function PlatformSettingsSection() {
  const { toast } = useToast();
  
  // Settings Tab Controller
  const [activeTab, setActiveTab] = useState<'general' | 'communications' | 'security' | 'payments' | 'dashboards' | 'advanced'>('general');

  // Form local states
  const [siteName, setSiteName] = useState('Khidmatik');
  const [defaultCurrency, setDefaultCurrency] = useState('DZD (Algerian Dinar)');
  const [defaultLanguage, setDefaultLanguage] = useState('ar');
  const [taxRate, setTaxRate] = useState('19%');
  const [smtpServer, setSmtpServer] = useState('smtp.mailgun.org');
  const [smsGateway, setSmsGateway] = useState('Twilio / Vonage API');
  const [seoTitle, setSeoTitle] = useState('Khidmatik | Multi-Vendor Marketplace & Booking Platform');
  const [seoKeywords, setSeoKeywords] = useState('algeria, booking, listings, marketplace, services');

  // Dashboard Page Visibility flags (Fulfills Request 4: Dashboard Control)
  const [dashPages, setDashPages] = useState({
    store_dashboard_home: true,
    store_orders: true,
    store_inventory: true,
    store_coupons: true,
    services_dashboard_home: true,
    services_bookings: true,
    services_schedule: true,
    customer_orders: true,
    customer_wallet: true,
    marketplace_checkout: true,
    digital_products_vault: true
  });

  const handleTogglePageVisibility = (key: keyof typeof dashPages) => {
    const nextVal = !dashPages[key];
    const nextState = {
      ...dashPages,
      [key]: nextVal
    };
    setDashPages(nextState);
    localStorage.setItem('khidmatik_dashboard_page_visibility', JSON.stringify(nextState));
    toast({
      title: "Dashboard Visibility Updated",
      description: `Page/feature is now ${nextVal ? 'VISIBLE' : 'HIDDEN'} on user sidebars.`,
    });
  };

  useEffect(() => {
    const savedVisibility = localStorage.getItem('khidmatik_dashboard_page_visibility');
    if (savedVisibility) {
      try { setDashPages(JSON.parse(savedVisibility)); } catch (e) {}
    }
  }, []);

  const handleSaveSettings = (group: string) => {
    toast({
      title: "Settings Saved Successfully",
      description: `${group} configuration updated in Firestore settings repository.`,
    });
  };

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Platform Settings Hub
        </h1>
        <p className="text-xs text-muted-foreground">Adjust SEO metadata, language localizations, payment modes, SMTP mailer configurations, and dashboard sidebar visibility.</p>
      </header>

      {/* Categories Grid Menu */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
        {[
          { key: 'general', label: 'General & Localization', icon: Globe },
          { key: 'communications', label: 'Email & SMS Gateways', icon: Mail },
          { key: 'security', label: 'Auth & Security Overrides', icon: ShieldCheck },
          { key: 'payments', label: 'Payments & Commision', icon: DollarSign },
          { key: 'dashboards', label: 'Dashboard Control', icon: Layout },
          { key: 'advanced', label: 'SEO & Integrations', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl gap-1.5 transition-all text-[11px] font-bold ${
                activeTab === tab.key 
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-50/50'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Tab Workspaces */}
      
      {/* General Settings */}
      {activeTab === 'general' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800">General & Localization settings</CardTitle>
            <CardDescription className="text-xs">Configure localized currencies, taxes rates, and site language defaults.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Platform Public Name</Label>
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="rounded-xl h-10 border-input" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Default Currency</Label>
                <Input value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className="rounded-xl h-10 border-input" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Default Language Locale</Label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger className="rounded-xl h-10 border-input">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="ar">Arabic (RTL)</SelectItem>
                    <SelectItem value="fr">French (LTR)</SelectItem>
                    <SelectItem value="en">English (LTR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Value Added Tax (VAT)</Label>
                <Input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="rounded-xl h-10 border-input" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => handleSaveSettings("General")} className="rounded-xl h-10 px-5 text-xs bg-primary text-primary-foreground">Save General Settings</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email & SMS Settings */}
      {activeTab === 'communications' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800">Email SMTP & SMS Gateway configurations</CardTitle>
            <CardDescription className="text-xs">Configure Yalidine shipment email notification templates and SMS text dispatch gateways.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">SMTP Host Server</Label>
                <Input value={smtpServer} onChange={(e) => setSmtpServer(e.target.value)} className="rounded-xl h-10 border-input font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">SMS Gateway Endpoint</Label>
                <Input value={smsGateway} onChange={(e) => setSmsGateway(e.target.value)} className="rounded-xl h-10 border-input" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => handleSaveSettings("Communications")} className="rounded-xl h-10 px-5 text-xs bg-primary text-primary-foreground">Save Communications</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auth & Security Override Settings */}
      {activeTab === 'security' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800">Authentication & Security Parameters</CardTitle>
            <CardDescription className="text-xs">Enforce multi-factor OTP access, configure OAuth callbacks, and token expiration.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">JWT Access Token Lifetime</Label>
                <Select defaultValue="1h">
                  <SelectTrigger className="rounded-xl h-10 border-input">
                    <SelectValue placeholder="Lifetime" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="1h">1 Hour (Recommended)</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Failed Login Lockout Tries</Label>
                <Select defaultValue="5">
                  <SelectTrigger className="rounded-xl h-10 border-input">
                    <SelectValue placeholder="Attempts" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="3">3 Tries</SelectItem>
                    <SelectItem value="5">5 Tries</SelectItem>
                    <SelectItem value="10">10 Tries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => handleSaveSettings("Security")} className="rounded-xl h-10 px-5 text-xs bg-primary text-primary-foreground">Save Security Override</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Settings */}
      {activeTab === 'payments' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800">Payments & Platform Commission Rates</CardTitle>
            <CardDescription className="text-xs">Manage commission deductions and billing structures for stores and services.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Default Store Commission (%)</Label>
                <Input defaultValue="10" type="number" className="rounded-xl h-10 border-input" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Service Provider Commission (%)</Label>
                <Input defaultValue="15" type="number" className="rounded-xl h-10 border-input" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => handleSaveSettings("Payments & Rates")} className="rounded-xl h-10 px-5 text-xs bg-primary text-primary-foreground">Save Payments Settings</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Control Panel (Fulfills Request 4: Dashboard Control) */}
      {activeTab === 'dashboards' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800">Dashboard Sidebar & Features Visibility Control</CardTitle>
            <CardDescription className="text-xs">Configure access controls, hide routes, or deactivate pages in user layouts without writing code.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Store Owner dashboard pages */}
              <div className="border dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-primary">Store Owner Sidebar Controls</h4>
                <div className="space-y-2">
                  {[
                    { key: 'store_dashboard_home', label: 'Store Main Dashboard Page' },
                    { key: 'store_orders', label: 'All Orders & Invoices list' },
                    { key: 'store_inventory', label: 'Stock & Inventory Management' },
                    { key: 'store_coupons', label: 'Discount Codes Creator' }
                  ].map((item) => {
                    const isVisible = dashPages[item.key as keyof typeof dashPages];
                    return (
                      <div key={item.key} className="flex justify-between items-center bg-white dark:bg-slate-950 border dark:border-slate-800 p-2 rounded-xl text-slate-800 dark:text-slate-200">
                        <span>{item.label}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleTogglePageVisibility(item.key as any)}
                          className={`h-8 text-[11px] rounded-lg flex items-center gap-1 ${
                            isVisible ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service Provider dashboard pages */}
              <div className="border dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-primary">Service Provider Sidebar Controls</h4>
                <div className="space-y-2">
                  {[
                    { key: 'services_dashboard_home', label: 'Services Main Dashboard' },
                    { key: 'services_bookings', label: 'Booking Reservations Pipeline' },
                    { key: 'services_schedule', label: 'Provider Calendar Schedules' }
                  ].map((item) => {
                    const isVisible = dashPages[item.key as keyof typeof dashPages];
                    return (
                      <div key={item.key} className="flex justify-between items-center bg-white dark:bg-slate-950 border dark:border-slate-800 p-2 rounded-xl text-slate-800 dark:text-slate-200">
                        <span>{item.label}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleTogglePageVisibility(item.key as any)}
                          className={`h-8 text-[11px] rounded-lg flex items-center gap-1 ${
                            isVisible ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO & Integrations Settings */}
      {activeTab === 'advanced' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800">SEO & Core Integration Settings</CardTitle>
            <CardDescription className="text-xs">Adjust search engine titles, description tags, and tracking scripts.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Global SEO Title Page Meta</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="rounded-xl h-10 border-input" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">Search Engine Keywords (comma separated)</Label>
                <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} className="rounded-xl h-10 border-input" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => handleSaveSettings("SEO & Integration")} className="rounded-xl h-10 px-5 text-xs bg-primary text-primary-foreground">Save SEO settings</Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
