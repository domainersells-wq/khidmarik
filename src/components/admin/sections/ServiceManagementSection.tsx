'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, Briefcase, Star, Clock, CheckCircle2, XCircle, 
  Eye, DollarSign, MapPin, Layers, Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminService } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';

export function ServiceManagementSection() {
  const { toast } = useToast();
  const [services, setServices] = useState<AdminService[]>([]);
  const [selectedService, setSelectedService] = useState<AdminService | null>(null);
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
    setServices(adminDataService.getServices());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (serviceId: string, newStatus: AdminService['status']) => {
    adminDataService.updateServiceStatus(serviceId, newStatus);
    loadData();
    if (selectedService && selectedService.id === serviceId) {
      setSelectedService({ ...selectedService, status: newStatus });
    }
    toast({
      title: 'Service Status Updated',
      description: `Service status changed to ${newStatus}.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Approved', value: 'approved' },
        { label: 'Pending Approval', value: 'pending_approval' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Paused', value: 'paused' },
      ],
    },
    {
      key: 'pricingType',
      label: 'Pricing Model',
      options: [
        { label: 'Fixed Price', value: 'fixed' },
        { label: 'Hourly Rate', value: 'hourly' },
        { label: 'Custom Quote', value: 'custom_quote' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminService>[] = [
    {
      label: 'Approve Selected',
      icon: CheckCircle2,
      variant: 'default',
      action: (selected) => {
        selected.forEach((s) => adminDataService.updateServiceStatus(s.id, 'approved'));
        loadData();
        toast({ title: 'Batch Approval', description: `${selected.length} services approved for booking.` });
      },
    },
    {
      label: 'Reject Selected',
      icon: XCircle,
      variant: 'destructive',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Reject ${selected.length} Services`,
          description: `Are you sure you want to reject ${selected.length} service listings?`,
          variant: 'danger',
          action: () => {
            selected.forEach((s) => adminDataService.updateServiceStatus(s.id, 'rejected'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Batch Rejection', description: `${selected.length} services rejected.` });
          },
        });
      },
    },
  ];

  const columns: ColumnDef<AdminService>[] = [
    {
      header: 'Service Title',
      accessorKey: 'title',
      cell: (s) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">{s.title}</div>
          <div className="text-xs text-muted-foreground font-mono">{s.serviceCode}</div>
        </div>
      ),
    },
    {
      header: 'Provider',
      accessorKey: 'providerName',
      cell: (s) => (
        <div className="text-xs font-medium text-foreground flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          {s.providerName}
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (s) => (
        <Badge variant="outline" className="bg-muted/40 text-xs font-normal">
          {s.category}
        </Badge>
      ),
    },
    {
      header: 'Pricing & Duration',
      accessorKey: 'basePrice',
      cell: (s) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">
            {s.basePrice.toLocaleString()} DA
            {s.pricingType === 'hourly' ? '/hr' : ''}
          </span>
          <span className="text-muted-foreground block">~{s.durationMinutes} mins</span>
        </div>
      ),
    },
    {
      header: 'Total Bookings',
      accessorKey: 'totalBookings',
      cell: (s) => (
        <div className="text-xs">
          <span className="font-medium text-foreground">{s.totalBookings} bookings</span>
          {s.rating > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {s.rating.toFixed(1)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (s) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          approved: 'default',
          pending_approval: 'secondary',
          rejected: 'destructive',
          paused: 'outline',
        };
        return (
          <Badge variant={variants[s.status] || 'outline'} className="capitalize text-xs">
            {s.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (s) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedService(s);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          {s.status === 'pending_approval' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleStatusChange(s.id, 'approved')}
              title="Approve Service"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const total = services.length;
  const approved = services.filter((s) => s.status === 'approved').length;
  const pending = services.filter((s) => s.status === 'pending_approval').length;
  const totalBookings = services.reduce((acc, s) => acc + s.totalBookings, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Wrench className="mr-3 h-8 w-8 text-primary" /> Services Catalog
        </h1>
        <p className="text-muted-foreground text-sm">
          Audit and manage all craftsman, repair, plumbing, electrical, and event services offered on Khidmatik.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Catalog offerings</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Approved & Live</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approved}</div>
            <p className="text-xs text-muted-foreground mt-1">Bookable by clients</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting moderation</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime completed/active</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={services}
        columns={columns}
        searchPlaceholder="Search services by title, code, provider, category..."
        searchKeys={['title', 'serviceCode', 'providerName', 'category', 'description']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_services"
        onRowClick={(s) => {
          setSelectedService(s);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedService && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedService.title}
          subtitle={`Code: ${selectedService.serviceCode} • Provider: ${selectedService.providerName}`}
          statusBadge={{
            label: selectedService.status.replace('_', ' '),
            variant: selectedService.status === 'approved' ? 'default' : 'destructive',
          }}
          metrics={[
            { label: 'Base Rate', value: `${selectedService.basePrice.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Est. Duration', value: `${selectedService.durationMinutes} min`, icon: Clock },
            { label: 'Bookings Count', value: selectedService.totalBookings, icon: Briefcase },
            { label: 'Rating', value: selectedService.rating ? `${selectedService.rating.toFixed(1)} ★` : 'New', icon: Star },
          ]}
          fields={[
            { label: 'Service Title', value: selectedService.title },
            { label: 'Provider Name', value: selectedService.providerName },
            { label: 'Trade Category', value: selectedService.category },
            { label: 'Pricing Model', value: selectedService.pricingType.toUpperCase() },
            { label: 'Covered Wilayas', value: selectedService.wilayasCovered.join(', '), fullWidth: true, icon: MapPin },
            { label: 'Detailed Description', value: selectedService.description, fullWidth: true },
          ]}
          activityHistory={[
            {
              timestamp: `${selectedService.createdAt} 10:00`,
              actor: selectedService.providerName,
              action: 'Service Submitted',
              details: `Set base price to ${selectedService.basePrice} DA.`,
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {selectedService.status === 'approved' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange(selectedService.id, 'paused')}
                >
                  <Ban className="h-4 w-4 mr-1.5" /> Pause Service
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange(selectedService.id, 'approved')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve Service
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
