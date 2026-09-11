'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Users, Star, ShieldCheck, CheckCircle2, XCircle, 
  Eye, Phone, Mail, MapPin, Award, FileText, Ban, RefreshCw, Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminProvider } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';

export function ServiceProviderManagementSection() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AdminProvider | null>(null);
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
    setProviders(adminDataService.getProviders());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (providerId: string, newStatus: AdminProvider['status']) => {
    adminDataService.updateProviderStatus(providerId, newStatus);
    loadData();
    if (selectedProvider && selectedProvider.id === providerId) {
      setSelectedProvider({ ...selectedProvider, status: newStatus });
    }
    toast({
      title: 'Provider Status Updated',
      description: `Status changed to ${newStatus}.`,
    });
  };

  const handleToggleVerified = (providerId: string) => {
    const list = adminDataService.getProviders();
    const target = list.find((p) => p.id === providerId);
    if (!target) return;
    target.isVerified = !target.isVerified;
    if (target.isVerified) target.identityDocumentStatus = 'verified';
    adminDataService.saveProviders(list);
    adminDataService.recordAudit('Super Admin', 'UPDATE', 'Provider', providerId, `Toggled verification badge to ${target.isVerified}`);
    loadData();
    if (selectedProvider && selectedProvider.id === providerId) {
      setSelectedProvider({ ...target });
    }
    toast({
      title: 'Badge Updated',
      description: `Provider verification status is now ${target.isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      options: [
        { label: 'Plumbing & Heating', value: 'Plumbing & Heating' },
        { label: 'Electrical & Solar', value: 'Electrical & Solar' },
        { label: 'HVAC & Air Conditioning', value: 'HVAC & Air Conditioning' },
        { label: 'Carpentry & Windows', value: 'Carpentry & Windows' },
        { label: 'Painting & Finishing', value: 'Painting & Finishing' },
        { label: 'Automotive & Towing', value: 'Automotive & Towing' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminProvider>[] = [
    {
      label: 'Verify Selected',
      icon: ShieldCheck,
      variant: 'default',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Verify ${selected.length} Providers`,
          description: `Grant official Khidmatik Verified Badge to ${selected.length} providers?`,
          variant: 'success',
          action: () => {
            const list = adminDataService.getProviders();
            const ids = new Set(selected.map((s) => s.id));
            list.forEach((p) => {
              if (ids.has(p.id)) {
                p.isVerified = true;
                p.identityDocumentStatus = 'verified';
              }
            });
            adminDataService.saveProviders(list);
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Batch Verification', description: `${selected.length} providers verified.` });
          },
        });
      },
    },
    {
      label: 'Suspend Selected',
      icon: Ban,
      variant: 'destructive',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Suspend ${selected.length} Providers`,
          description: `Suspend listings and service availability for ${selected.length} providers?`,
          variant: 'danger',
          action: () => {
            selected.forEach((p) => adminDataService.updateProviderStatus(p.id, 'suspended'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Batch Suspension', description: `${selected.length} providers suspended.` });
          },
        });
      },
    },
  ];

  const columns: ColumnDef<AdminProvider>[] = [
    {
      header: 'Provider / Trade',
      accessorKey: 'providerName',
      cell: (p) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            {p.providerName}
            {p.isVerified && <span title="Verified Badge"><ShieldCheck className="h-4 w-4 text-primary shrink-0" /></span>}
            {p.isFeatured && <span title="Featured"><Award className="h-3.5 w-3.5 text-amber-500 shrink-0" /></span>}
          </div>
          <div className="text-xs text-muted-foreground">{p.specialty}</div>
        </div>
      ),
    },
    {
      header: 'Owner / Contact',
      accessorKey: 'ownerName',
      cell: (p) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{p.ownerName}</div>
          <div className="text-muted-foreground font-mono">{p.phone}</div>
        </div>
      ),
    },
    {
      header: 'Category & Wilaya',
      accessorKey: 'category',
      cell: (p) => (
        <div className="space-y-0.5 text-xs">
          <Badge variant="outline" className="bg-muted/40 font-normal">
            {p.category}
          </Badge>
          <div className="text-muted-foreground">{p.wilaya}</div>
        </div>
      ),
    },
    {
      header: 'Rating / Jobs',
      accessorKey: 'rating',
      cell: (p) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 font-bold text-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {p.rating.toFixed(1)}
            <span className="text-muted-foreground font-normal">({p.reviewCount})</span>
          </div>
          <div className="text-muted-foreground text-[11px]">{p.completedJobs} jobs done</div>
        </div>
      ),
    },
    {
      header: 'Documents',
      accessorKey: 'identityDocumentStatus',
      cell: (p) => {
        const docStyles: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          verified: { label: 'Verified CNI/RC', variant: 'default' },
          pending: { label: 'Under Review', variant: 'secondary' },
          rejected: { label: 'Rejected', variant: 'destructive' },
          not_submitted: { label: 'Missing', variant: 'outline' },
        };
        const conf = docStyles[p.identityDocumentStatus] || { label: p.identityDocumentStatus, variant: 'outline' };
        return <Badge variant={conf.variant} className="text-[11px]">{conf.label}</Badge>;
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (p) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          active: 'default',
          pending_review: 'secondary',
          suspended: 'destructive',
          rejected: 'destructive',
        };
        return (
          <Badge variant={variants[p.status] || 'outline'} className="capitalize text-xs">
            {p.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (p) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedProvider(p);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-primary"
            onClick={() => handleToggleVerified(p.id)}
            title="Toggle Verification Badge"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const total = providers.length;
  const active = providers.filter((p) => p.status === 'active').length;
  const verified = providers.filter((p) => p.isVerified).length;
  const pendingReview = providers.filter((p) => p.status === 'pending_review').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Briefcase className="mr-3 h-8 w-8 text-primary" /> Service Providers & Craftsmen
        </h1>
        <p className="text-muted-foreground text-sm">
          Oversee professional service accounts, credentials verification, ratings, and commission assignments.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Artisans & Professionals</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active & Bookable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{active}</div>
            <p className="text-xs text-muted-foreground mt-1">Receiving appointments</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Verified Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{verified}</div>
            <p className="text-xs text-muted-foreground mt-1">Identity & Trade Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Require document audit</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={providers}
        columns={columns}
        searchPlaceholder="Search by provider name, owner, specialty, category, wilaya..."
        searchKeys={['providerName', 'ownerName', 'specialty', 'category', 'wilaya', 'email', 'phone']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_providers"
        onRowClick={(p) => {
          setSelectedProvider(p);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedProvider && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedProvider.providerName}
          subtitle={`Provider ID: ${selectedProvider.id} • Joined: ${selectedProvider.joinedDate}`}
          statusBadge={{
            label: selectedProvider.status.replace('_', ' '),
            variant: selectedProvider.status === 'active' ? 'default' : 'destructive',
          }}
          metrics={[
            { label: 'Rating', value: `${selectedProvider.rating.toFixed(1)} ★`, subtext: `${selectedProvider.reviewCount} reviews`, icon: Star },
            { label: 'Completed Jobs', value: selectedProvider.completedJobs, icon: Briefcase },
            { label: 'Platform Balance', value: `${selectedProvider.balance.toLocaleString()} DA`, icon: Wallet },
            { label: 'Commission Rate', value: `${selectedProvider.commissionRate}%`, icon: FileText },
          ]}
          fields={[
            { label: 'Owner / Contact Name', value: selectedProvider.ownerName, icon: Users },
            { label: 'Phone Number', value: selectedProvider.phone, icon: Phone },
            { label: 'Email Address', value: selectedProvider.email, icon: Mail },
            { label: 'Operating Wilaya', value: selectedProvider.wilaya, icon: MapPin },
            { label: 'Trade Category', value: selectedProvider.category },
            { label: 'Specialty / Services', value: selectedProvider.specialty, fullWidth: true },
            { label: 'Identity Document Type', value: selectedProvider.identityDocumentType || 'Not specified' },
            { label: 'Document Status', value: selectedProvider.identityDocumentStatus.toUpperCase() },
          ]}
          activityHistory={[
            {
              timestamp: `${selectedProvider.joinedDate} 09:30`,
              actor: 'System',
              action: 'Provider Onboarding',
              details: 'Submitted identity documents for verification.',
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleVerified(selectedProvider.id)}
              >
                <ShieldCheck className="h-4 w-4 mr-1.5 text-primary" />
                {selectedProvider.isVerified ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
              </Button>
              {selectedProvider.status === 'active' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange(selectedProvider.id, 'suspended')}
                >
                  <Ban className="h-4 w-4 mr-1.5" /> Suspend Provider
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange(selectedProvider.id, 'active')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve & Activate
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Confirmation Modal */}
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
