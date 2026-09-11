'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { PermissionButton } from '@/components/common/PermissionButton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Store, 
  Briefcase, 
  ShoppingCart, 
  CalendarDays, 
  DollarSign, 
  ShieldAlert, 
  Headset, 
  Activity, 
  Search, 
  Bell, 
  Send, 
  PlusCircle, 
  Sparkles,
  Database,
  AppWindow,
  Settings,
  ShieldCheck,
  Package,
  CheckCircle,
  Clock,
  Terminal,
  Server,
  Wallet
} from 'lucide-react';
import { financialService } from '@/services/financialService';
import { adminDataService } from '@/services/adminDataService';
import { useEffect } from 'react';

export function PlatformOverviewSection() {
  const router = useRouter();
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  // Dashboard state
  const [simState, setSimState] = useState<'normal' | 'disabled' | 'loading' | 'pending' | 'unauthorized'>('normal');
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastChannel, setBroadcastChannel] = useState('in_app');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Dialog control states
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Live pending Top-Up count for General Supervisor
  const [pendingTopUpsCount, setPendingTopUpsCount] = useState(() => {
    try {
      return financialService.getTopUpRequests({ status: 'UNDER_REVIEW' }).length;
    } catch {
      return 0;
    }
  });

  // Live operations stats from Supabase
  const [liveStats, setLiveStats] = useState({
    totalUsers: 15,
    totalStores: 11,
    totalProducts: 9,
    totalOrders: 0,
  });

  useEffect(() => {
    const updateCount = () => {
      try {
        setPendingTopUpsCount(financialService.getTopUpRequests({ status: 'UNDER_REVIEW' }).length);
      } catch {}
    };

    adminDataService.fetchPlatformOverviewStats().then((res: any) => {
      if (res) setLiveStats(res);
    }).catch(() => {});

    window.addEventListener('khidmatik:topup-updated', updateCount);
    window.addEventListener('khidmatik:admin-new-topup', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('khidmatik:topup-updated', updateCount);
      window.removeEventListener('khidmatik:admin-new-topup', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  // Mock global search datasets
  const mockDataset = [
    { type: 'user', name: 'Amine User', detail: 'amine.user@example.dz', status: 'Active' },
    { type: 'store', name: 'DzTech Store', detail: 'Electronics vendor in Algiers', status: 'Active' },
    { type: 'service', name: 'Plumbing Repair', detail: 'Offered by Nabil Plumb', status: 'Verified' },
    { type: 'order', name: 'Order #18302', detail: 'Total: 4,500 DA - Yalidine', status: 'Pending' },
    { type: 'booking', name: 'Hall booking #928', detail: 'Banquet Hall event', status: 'Confirmed' },
  ];

  const filteredSearch = mockDataset.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
                          item.detail.toLowerCase().includes(globalSearch.toLowerCase());
    const matchesCategory = searchCategory === 'all' || item.type === searchCategory;
    return globalSearch ? (matchesSearch && matchesCategory) : false;
  });

  const navigateToSection = (sectionName: string) => {
    router.push(`/admin/dashboard?section=${sectionName}`);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    toast({
      title: "Broadcast Sent Successfully",
      description: `Announcement sent to ${broadcastTarget.replace('_', ' ')} via ${broadcastChannel.replace('_', ' ')}.`,
    });
    setBroadcastMessage('');
  };

  const handleCreateBackup = () => {
    toast({
      title: "Backup Triggered",
      description: "Full snapshot backup created successfully and archived to Cloud Storage.",
    });
    setIsBackupOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border bg-card p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" /> {translate('adminDashboard', 'Platform Control Center')}
          </h2>
          <p className="text-xs text-muted-foreground">Manage SaaS operations, system parameters, backup routines, and features.</p>
        </div>
        
        {/* Global Search Bar */}
        <div className="flex-1 max-w-md flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border rounded-xl px-3 py-1">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input 
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder={translate('globalSearchPlh', 'Universal Search (Users, Stores, Invoices)...')}
            className="border-none bg-transparent h-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs w-full"
          />
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger className="border-none bg-transparent h-8 w-24 text-[10px] focus:ring-0 font-semibold text-slate-600">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="store">Stores</SelectItem>
              <SelectItem value="service">Services</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global Search Results Preview */}
      {globalSearch && (
        <Card className="border rounded-2xl shadow-sm bg-card transition-all duration-300">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200">Universal Search Matches ({filteredSearch.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {filteredSearch.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">No results match your query.</p>
            ) : (
              filteredSearch.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div>
                    <Badge variant="outline" className="text-[9px] uppercase mr-2">{item.type}</Badge>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-3">({item.detail})</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{item.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Operations Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', count: liveStats.totalUsers.toLocaleString(), sub: 'Registered profiles', icon: Users, section: 'user-management', color: 'text-blue-600 bg-blue-50/50' },
          { title: 'Active Stores', count: liveStats.totalStores.toLocaleString(), sub: 'Verified merchants', icon: Store, section: 'store-management', color: 'text-indigo-600 bg-indigo-50/50' },
          { title: 'Total Products', count: liveStats.totalProducts.toLocaleString(), sub: 'Catalog inventory items', icon: Package, section: 'product-management', color: 'text-purple-600 bg-purple-50/50' },
          { title: 'Platform Orders', count: liveStats.totalOrders.toLocaleString(), sub: 'Recorded marketplace orders', icon: ShoppingCart, section: 'order-management', color: 'text-pink-600 bg-pink-50/50' },
          { title: 'Top-Up Reviews', count: `${pendingTopUpsCount} pending`, sub: 'Requires supervisor review', icon: DollarSign, section: 'topup-management', color: 'text-amber-600 bg-amber-50/50' },
          { title: 'Active Bookings', count: '12', sub: 'Services & appointments', icon: CalendarDays, section: 'reservation-management', color: 'text-teal-600 bg-teal-50/50' },
          { title: 'System Health', count: '99.9%', sub: 'Supabase cloud live', icon: Database, section: 'security-audit', color: 'text-emerald-600 bg-emerald-50/50' },
          { title: 'Open Tickets', count: '3 active', sub: 'Live support tickets', icon: Headset, section: 'support-system', color: 'text-red-600 bg-red-50/50' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              onClick={() => navigateToSection(stat.section)}
              className="border hover:shadow-md transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{stat.count}</div>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Operations Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Broadcast System Panel */}
        <Card className="lg:col-span-2 border rounded-2xl shadow-sm">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Multi-Channel Broadcast Center
            </CardTitle>
            <CardDescription className="text-xs">Dispatch global or role-targeted announcements across the platform instantly.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left rtl:text-right">
                  <label className="text-[11px] font-bold text-slate-700">Target Audience</label>
                  <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                    <SelectTrigger className="rounded-xl h-10 border-input text-xs">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="all">All Platform Users</SelectItem>
                      <SelectItem value="vendors">Store Owners Only</SelectItem>
                      <SelectItem value="providers">Service Providers Only</SelectItem>
                      <SelectItem value="customers">Customers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 text-left rtl:text-right">
                  <label className="text-[11px] font-bold text-slate-700">Channel Mode</label>
                  <Select value={broadcastChannel} onValueChange={setBroadcastChannel}>
                    <SelectTrigger className="rounded-xl h-10 border-input text-xs">
                      <SelectValue placeholder="In-App Notification" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="in_app">In-App Notification</SelectItem>
                      <SelectItem value="email">Direct Email Broadcast</SelectItem>
                      <SelectItem value="push">Mobile Push Notification</SelectItem>
                      <SelectItem value="sms">SMS Text Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1 text-left rtl:text-right">
                <label className="text-[11px] font-bold text-slate-700">Message Content</label>
                <Textarea 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter message details here. Markdown support enabled..."
                  className="rounded-xl border-input text-xs min-h-[90px]"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="rounded-xl h-10 px-5 text-xs flex items-center gap-1.5 bg-primary text-primary-foreground">
                  <Send className="h-4 w-4" /> Dispatch Announcement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Shortcuts / Quick Actions Panel */}
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" /> Administrative Actions
            </CardTitle>
            <CardDescription className="text-xs">Shortcuts to manage settings and spawn core platform accounts.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-2">
            <TooltipProvider delayDuration={150}>
              {/* Create User Dialog */}
              {simState === 'unauthorized' ? (
                <PermissionButton
                  forceUnauthorized
                  unauthorizedMessage="Missing required permission: users:create"
                  variant="outline"
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Users className="mr-2.5 h-4.5 w-4.5 text-primary" /> Create User Account
                </PermissionButton>
              ) : (
                <Dialog open={isUserOpen} onOpenChange={setIsUserOpen}>
                  <DialogTrigger asChild>
                    <PermissionButton
                      permission="users:create"
                      isLoadingState={simState === 'loading'}
                      isPendingState={simState === 'pending'}
                      disabled={simState === 'disabled'}
                      variant="outline"
                      className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <Users className="mr-2.5 h-4.5 w-4.5 text-primary" /> Create User Account
                    </PermissionButton>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-sm font-sans">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold">New User Account</DialogTitle>
                      <DialogDescription className="text-xs">Insert details to register user details immediately.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 my-2 text-left rtl:text-right text-xs">
                      <Input placeholder="Full Name" className="rounded-xl" />
                      <Input placeholder="Email Address" className="rounded-xl" />
                      <Input placeholder="Phone Number" className="rounded-xl" />
                    </div>
                    <DialogFooter className="mt-2">
                      <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsUserOpen(false)}>Cancel</Button>
                      <Button className="rounded-xl text-xs h-9 bg-primary" onClick={() => { setIsUserOpen(false); toast({title: 'Account created'}); }}>Create Account</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Create Store Dialog */}
              {simState === 'unauthorized' ? (
                <PermissionButton
                  forceUnauthorized
                  unauthorizedMessage="Missing required permission: stores:create"
                  variant="outline"
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Store className="mr-2.5 h-4.5 w-4.5 text-primary" /> Spawn Store Merchant
                </PermissionButton>
              ) : (
                <Dialog open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                  <DialogTrigger asChild>
                    <PermissionButton
                      permission="stores:create"
                      isLoadingState={simState === 'loading'}
                      isPendingState={simState === 'pending'}
                      disabled={simState === 'disabled'}
                      variant="outline"
                      className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <Store className="mr-2.5 h-4.5 w-4.5 text-primary" /> Spawn Store Merchant
                    </PermissionButton>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-sm font-sans">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold">Register Store Merchant</DialogTitle>
                      <DialogDescription className="text-xs">Creates a merchant store dashboard profile.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 my-2 text-left rtl:text-right text-xs">
                      <Input placeholder="Store Name" className="rounded-xl" />
                      <Input placeholder="Owner Email" className="rounded-xl" />
                    </div>
                    <DialogFooter className="mt-2">
                      <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsStoreOpen(false)}>Cancel</Button>
                      <Button className="rounded-xl text-xs h-9 bg-primary" onClick={() => { setIsStoreOpen(false); toast({title: 'Store setup triggered'}); }}>Register Merchant</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Create Service Dialog */}
              {simState === 'unauthorized' ? (
                <PermissionButton
                  forceUnauthorized
                  unauthorizedMessage="Missing required permission: services:create"
                  variant="outline"
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Briefcase className="mr-2.5 h-4.5 w-4.5 text-primary" /> Spawn Service Provider
                </PermissionButton>
              ) : (
                <Dialog open={isServiceOpen} onOpenChange={setIsServiceOpen}>
                  <DialogTrigger asChild>
                    <PermissionButton
                      permission="services:create"
                      isLoadingState={simState === 'loading'}
                      isPendingState={simState === 'pending'}
                      disabled={simState === 'disabled'}
                      variant="outline"
                      className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <Briefcase className="mr-2.5 h-4.5 w-4.5 text-primary" /> Spawn Service Provider
                    </PermissionButton>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-sm font-sans">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold">Register Service Provider</DialogTitle>
                      <DialogDescription className="text-xs">Creates a professional services provider account.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 my-2 text-left rtl:text-right text-xs">
                      <Input placeholder="Provider Name" className="rounded-xl" />
                      <Input placeholder="Main Category" className="rounded-xl" />
                    </div>
                    <DialogFooter className="mt-2">
                      <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsServiceOpen(false)}>Cancel</Button>
                      <Button className="rounded-xl text-xs h-9 bg-primary" onClick={() => { setIsServiceOpen(false); toast({title: 'Provider setup triggered'}); }}>Register Provider</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Trigger Backup Dialog */}
              {simState === 'unauthorized' ? (
                <PermissionButton
                  forceUnauthorized
                  unauthorizedMessage="Missing required permission: system:backup"
                  variant="outline"
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Database className="mr-2.5 h-4.5 w-4.5 text-primary" /> Snapshot System Backup
                </PermissionButton>
              ) : (
                <Dialog open={isBackupOpen} onOpenChange={setIsBackupOpen}>
                  <DialogTrigger asChild>
                    <PermissionButton
                      permission="system:backup"
                      isLoadingState={simState === 'loading'}
                      isPendingState={simState === 'pending'}
                      disabled={simState === 'disabled'}
                      variant="outline"
                      className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <Database className="mr-2.5 h-4.5 w-4.5 text-primary" /> Snapshot System Backup
                    </PermissionButton>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-sm font-sans">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold">Snapshot Database Backup</DialogTitle>
                      <DialogDescription className="text-xs">Creates a point-in-time snapshot backup of the databases.</DialogDescription>
                    </DialogHeader>
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between"><span>DB Size:</span><strong>184.2 MB</strong></div>
                      <div className="flex justify-between"><span>Active connection pool:</span><strong>34</strong></div>
                    </div>
                    <DialogFooter className="mt-2">
                      <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsBackupOpen(false)}>Cancel</Button>
                      <Button className="rounded-xl text-xs h-9 bg-primary" onClick={handleCreateBackup}>Execute Backup</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              {/* Toggle Maintenance Mode */}
              {simState === 'unauthorized' ? (
                <PermissionButton
                  forceUnauthorized
                  unauthorizedMessage="Missing required permission: system:settings"
                  variant={maintenanceMode ? 'destructive' : 'outline'}
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold transition-colors"
                >
                  <Settings className="mr-2.5 h-4.5 w-4.5" /> 
                  {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </PermissionButton>
              ) : (
                <PermissionButton 
                  permission="system:settings"
                  isLoadingState={simState === 'loading'}
                  isPendingState={simState === 'pending'}
                  disabled={simState === 'disabled'}
                  variant={maintenanceMode ? 'destructive' : 'outline'}
                  onClick={() => {
                    setMaintenanceMode(!maintenanceMode);
                    toast({
                      title: maintenanceMode ? "Maintenance Mode Disabled" : "Maintenance Mode Enabled",
                      description: maintenanceMode ? "Platform is now publicly accessible." : "Platform public routing is disabled. Showing maintenance template.",
                    });
                  }}
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold transition-colors"
                >
                  <Settings className="mr-2.5 h-4.5 w-4.5" /> 
                  {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </PermissionButton>
              )}

              {/* Manage Role Permissions */}
              {simState === 'unauthorized' ? (
                <PermissionButton
                  forceUnauthorized
                  unauthorizedMessage="Missing required permission: rbac:manage"
                  variant="outline"
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="mr-2.5 h-4.5 w-4.5 text-primary" /> Manage Role Permissions
                </PermissionButton>
              ) : (
                <PermissionButton 
                  permission="rbac:manage"
                  isLoadingState={simState === 'loading'}
                  isPendingState={simState === 'pending'}
                  disabled={simState === 'disabled'}
                  variant="outline" 
                  onClick={() => navigateToSection('user-management')} 
                  className="w-full justify-start h-[44px] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="mr-2.5 h-4.5 w-4.5 text-primary" /> Manage Role Permissions
                </PermissionButton>
              )}

              {/* Financial Supervisor Operations: Top-Up Requests Shortcut */}
              <PermissionButton 
                permission="manage_payments"
                variant="outline" 
                onClick={() => navigateToSection('topup-management')} 
                className="w-full justify-between h-[44px] rounded-xl text-xs font-semibold hover:bg-amber-500/10 transition-colors border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="mr-1 h-4.5 w-4.5 text-amber-600" />
                  <span>مراجعة طلبات الشحن والوصولات (المشرف المالي)</span>
                </div>
                {pendingTopUpsCount > 0 ? (
                  <Badge variant="destructive" className="h-5 px-2 text-[10px] font-bold rounded-full animate-pulse">
                    {pendingTopUpsCount} بانتظار التدقيق
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground border-border">
                    مكتمل
                  </Badge>
                )}
              </PermissionButton>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              {/* Interactive Simulation Controls */}
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2 text-left rtl:text-right">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <span>RBAC State Simulator</span>
                  <Badge variant="outline" className="text-[8px] bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700">Test Utility</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Toggle states to test button text visibility and behavior for authorization requirements.
                </p>
                <div className="grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
                  {(['normal', 'disabled', 'loading', 'pending', 'unauthorized'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSimState(s)}
                      className={cn(
                        "text-[9px] py-1 rounded font-semibold capitalize transition-all",
                        simState === s 
                          ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 shadow-sm" 
                          : "text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Center & Server Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Activity logs */}
        <Card className="lg:col-span-2 border rounded-2xl shadow-sm">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Real-time Activity Center
            </CardTitle>
            <CardDescription className="text-xs">Live log of events and account modifications across the entire platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              { text: 'User registration completed: Amine User', time: '2 mins ago', ip: '197.112.4.92', device: 'Chrome/Win10', icon: CheckCircle, badge: 'User', color: 'text-green-600' },
              { text: 'Store visibility toggled: DzTech Store', time: '14 mins ago', ip: '105.12.80.3', device: 'Safari/iOS', icon: Clock, badge: 'Store', color: 'text-indigo-600' },
              { text: 'Payout request initiated: 12,000 DA', time: '40 mins ago', ip: '197.200.32.90', device: 'Firefox/Linux', icon: Clock, badge: 'Finance', color: 'text-amber-600' },
              { text: 'Banquet Hall listing added: Banquet Palace', time: '1 hour ago', ip: '105.42.102.14', device: 'Edge/Win11', icon: CheckCircle, badge: 'Listing', color: 'text-purple-600' },
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex justify-between items-start gap-3 p-3 rounded-xl border bg-slate-50/20 text-xs hover:shadow-sm transition-shadow">
                  <div className="flex gap-2.5 items-start">
                    <Icon className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${activity.color}`} />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{activity.text}</p>
                      <p className="text-[10px] text-muted-foreground">IP: {activity.ip} • Browser: {activity.device}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className="text-[9px] uppercase font-bold">{activity.badge}</Badge>
                    <span className="text-[9px] text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Server & DB Status (System Administration) */}
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" /> Live System Monitor
            </CardTitle>
            <CardDescription className="text-xs">Real-time resources usage for platform servers and background queues.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            {/* CPU */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>CPU Usage</span>
                <span>14%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: '14%' }}></div>
              </div>
            </div>

            {/* RAM */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>RAM Memory (Allocated)</span>
                <span>4.2 GB / 8 GB</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '52.5%' }}></div>
              </div>
            </div>

            {/* Database Connections */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>DB Connection Pool</span>
                <span>34 / 100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: '34%' }}></div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

            {/* Background queues */}
            <div className="space-y-2 font-mono text-[10px] text-muted-foreground bg-slate-50 dark:bg-slate-900/50 border p-3 rounded-xl">
              <p className="flex justify-between"><span>Background Queue:</span><span className="font-bold text-green-600">Active (0 delayed)</span></p>
              <p className="flex justify-between"><span>Active workers:</span><span className="font-bold text-slate-800 dark:text-slate-200">8</span></p>
              <p className="flex justify-between"><span>Cron tasks scheduled:</span><span className="font-bold text-slate-800 dark:text-slate-200">4 active</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
