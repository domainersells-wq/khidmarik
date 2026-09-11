'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, Users, Star, ShieldCheck, CheckCircle2, Award, Eye, 
  Package, ShoppingBag, Phone, Mail, MapPin, Ban, CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminStore } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';
import { cn } from '@/lib/utils';

export function StoreManagementSection() {
  const { toast } = useToast();
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    variant: 'warning',
  });

  const loadData = () => {
    setStores(adminDataService.getStores());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (storeId: string, newStatus: AdminStore['status']) => {
    adminDataService.updateStoreStatus(storeId, newStatus);
    loadData();
    if (selectedStore && selectedStore.id === storeId) {
      setSelectedStore({ ...selectedStore, status: newStatus });
    }
    toast({
      title: 'Store Status Updated',
      description: `Store status changed to ${newStatus}.`,
    });
  };

  const handleToggleFeatured = (storeId: string) => {
    const list = adminDataService.getStores();
    const target = list.find((s) => s.id === storeId);
    if (!target) return;
    target.isFeatured = !target.isFeatured;
    adminDataService.saveStores(list);
    adminDataService.recordAudit('Super Admin', 'UPDATE', 'Store', storeId, `Toggled store featured badge to ${target.isFeatured}`);
    loadData();
    if (selectedStore && selectedStore.id === storeId) {
      setSelectedStore({ ...target });
    }
    toast({
      title: 'Featured Status Updated',
      description: `Store ${target.storeName} is now ${target.isFeatured ? 'FEATURED' : 'STANDARD'}.`,
    });
  };

  const handleToggleVerified = (storeId: string) => {
    const list = adminDataService.getStores();
    const target = list.find((s) => s.id === storeId);
    if (!target) return;
    target.isVerified = !target.isVerified;
    adminDataService.saveStores(list);
    adminDataService.recordAudit('Super Admin', 'UPDATE', 'Store', storeId, `Toggled store verified badge to ${target.isVerified}`);
    loadData();
    if (selectedStore && selectedStore.id === storeId) {
      setSelectedStore({ ...target });
    }
    toast({
      title: 'Badge Updated',
      description: `Store verification status is now ${target.isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
    {
      key: 'subscriptionPlan',
      label: 'Plan',
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
        { label: 'Premium Annual', value: 'premium_annual' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminStore>[] = [
    {
      label: 'Feature Selected',
      icon: Award,
      variant: 'default',
      action: (selected) => {
        const list = adminDataService.getStores();
        const ids = new Set(selected.map((s) => s.id));
        list.forEach((s) => {
          if (ids.has(s.id)) s.isFeatured = true;
        });
        adminDataService.saveStores(list);
        loadData();
        toast({ title: 'Batch Feature', description: `${selected.length} stores featured on homepage.` });
      },
    },
    {
      label: 'Suspend Selected',
      icon: Ban,
      variant: 'destructive',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Suspend ${selected.length} Stores`,
          description: `Suspend listings and storefronts for ${selected.length} stores?`,
          variant: 'danger',
          action: () => {
            selected.forEach((s) => adminDataService.updateStoreStatus(s.id, 'suspended'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Batch Suspension', description: `${selected.length} stores suspended.` });
          },
        });
      },
    },
  ];

  const columns: ColumnDef<AdminStore>[] = [
    {
      header: 'Storefront',
      accessorKey: 'storeName',
      cell: (store) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            {store.storeName}
            {store.isVerified && <span title="Verified Store"><ShieldCheck className="h-4 w-4 text-primary shrink-0" /></span>}
            {store.isFeatured && <span title="Featured Store"><Award className="h-3.5 w-3.5 text-amber-500 shrink-0" /></span>}
          </div>
          <div className="text-xs text-muted-foreground font-mono">/{store.slug}</div>
        </div>
      ),
    },
    {
      header: 'Owner / Contact',
      accessorKey: 'ownerName',
      cell: (store) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{store.ownerName}</div>
          <div className="text-muted-foreground">{store.ownerPhone}</div>
        </div>
      ),
    },
    {
      header: 'Category & Wilaya',
      accessorKey: 'category',
      cell: (store) => (
        <div className="space-y-0.5 text-xs">
          <Badge variant="outline" className="bg-muted/40 font-normal">
            {store.category}
          </Badge>
          <div className="text-muted-foreground">{store.wilaya}</div>
        </div>
      ),
    },
    {
      header: 'Products & Sales',
      accessorKey: 'productCount',
      cell: (store) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">{store.productCount} products</div>
          <div className="text-muted-foreground">{store.totalSalesCount} total sales</div>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessorKey: 'subscriptionPlan',
      cell: (store) => {
        const planBadges: Record<string, { label: string; className: string }> = {
          basic: { label: 'Basic', className: 'bg-slate-100 text-slate-700' },
          pro: { label: 'Pro', className: 'bg-blue-100 text-blue-800' },
          premium_annual: { label: 'Premium ★', className: 'bg-amber-100 text-amber-800' },
        };
        const p = planBadges[store.subscriptionPlan] || { label: store.subscriptionPlan, className: '' };
        return <Badge variant="outline" className={cn("text-[11px] font-semibold border-none", p.className)}>{p.label}</Badge>;
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (store) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          active: 'default',
          inactive: 'outline',
          pending_review: 'secondary',
          suspended: 'destructive',
        };
        return (
          <Badge variant={variants[store.status] || 'outline'} className="capitalize text-xs">
            {store.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (store) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedStore(store);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-8 px-2 text-xs", store.isFeatured ? "text-amber-600" : "text-muted-foreground")}
            onClick={() => handleToggleFeatured(store.id)}
            title="Toggle Featured"
          >
            <Award className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const total = stores.length;
  const active = stores.filter((s) => s.status === 'active').length;
  const verified = stores.filter((s) => s.isVerified).length;
  const totalVolume = stores.reduce((acc, s) => acc + s.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Store className="mr-3 h-8 w-8 text-primary" /> Merchant Stores Directory
        </h1>
        <p className="text-muted-foreground text-sm">
          Oversee vendor storefronts, subscriptions, inventory volume, and store verification.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Multi-Vendor Merchants</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Storefronts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{active}</div>
            <p className="text-xs text-muted-foreground mt-1">Selling online</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Verified Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{verified}</div>
            <p className="text-xs text-muted-foreground mt-1">RC / Commercial Validated</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Combined Gross Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{(totalVolume / 1000000).toFixed(1)}M DA</div>
            <p className="text-xs text-muted-foreground mt-1">Platform Merchandise Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={stores}
        columns={columns}
        searchPlaceholder="Search store by name, slug, owner, wilaya, category..."
        searchKeys={['storeName', 'slug', 'ownerName', 'ownerEmail', 'ownerPhone', 'wilaya', 'category']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_stores"
        onRowClick={(store) => {
          setSelectedStore(store);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedStore && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedStore.storeName}
          subtitle={`Store ID: ${selectedStore.id} • Slug: /${selectedStore.slug}`}
          statusBadge={{
            label: selectedStore.status.replace('_', ' '),
            variant: selectedStore.status === 'active' ? 'default' : 'destructive',
          }}
          metrics={[
            { label: 'Gross Revenue', value: `${selectedStore.totalRevenue.toLocaleString()} DA`, icon: CreditCard },
            { label: 'Total Orders', value: selectedStore.totalSalesCount, icon: ShoppingBag },
            { label: 'Products', value: selectedStore.productCount, icon: Package },
            { label: 'Commission Rate', value: `${selectedStore.commissionRate}%`, icon: Store },
          ]}
          fields={[
            { label: 'Owner Name', value: selectedStore.ownerName, icon: Users },
            { label: 'Owner Email', value: selectedStore.ownerEmail, icon: Mail },
            { label: 'Owner Phone', value: selectedStore.ownerPhone, icon: Phone },
            { label: 'Store Category', value: selectedStore.category },
            { label: 'Operating Wilaya', value: selectedStore.wilaya, icon: MapPin },
            { label: 'Physical Address', value: selectedStore.address, fullWidth: true },
            { label: 'Subscription Plan', value: selectedStore.subscriptionPlan.toUpperCase() },
            { label: 'Subscription Status', value: selectedStore.subscriptionStatus.toUpperCase() },
          ]}
          activityHistory={[
            {
              timestamp: `${selectedStore.joinedDate} 11:00`,
              actor: 'Merchant Onboarding',
              action: 'Storefront Created',
              details: 'Registered and selected subscription plan.',
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleVerified(selectedStore.id)}
              >
                <ShieldCheck className="h-4 w-4 mr-1.5 text-primary" />
                {selectedStore.isVerified ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
              </Button>
              {selectedStore.status === 'active' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange(selectedStore.id, 'suspended')}
                >
                  <Ban className="h-4 w-4 mr-1.5" /> Suspend Store
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange(selectedStore.id, 'active')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Activate Store
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Confirm Modal */}
      <AdminConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
      />
    </div>
  );
}
