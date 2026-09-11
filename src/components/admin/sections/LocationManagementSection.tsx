'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  MapPin, Truck, DollarSign, Edit3, CheckCircle2, 
  Power, Globe, Compass, Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminLocation } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function LocationManagementSection() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AdminLocation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit rates state
  const [editBaseCost, setEditBaseCost] = useState<number>(500);
  const [editExpressCost, setEditExpressCost] = useState<number>(850);

  const loadData = () => {
    setLocations(adminDataService.getLocations());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleDelivery = (locId: string) => {
    const list = adminDataService.getLocations();
    const target = list.find((l) => l.id === locId);
    if (!target) return;
    target.isDeliveryAvailable = !target.isDeliveryAvailable;
    adminDataService.saveLocations(list);
    adminDataService.recordAudit('Super Admin', 'UPDATE', 'Location', locId, `Toggled delivery coverage for Wilaya ${target.nameEn} to ${target.isDeliveryAvailable}`);
    loadData();
    if (selectedLocation && selectedLocation.id === locId) {
      setSelectedLocation({ ...target });
    }
    toast({
      title: 'Coverage Updated',
      description: `Delivery coverage for ${target.nameEn} (${target.wilayaCode}) is now ${target.isDeliveryAvailable ? 'ENABLED' : 'DISABLED'}.`,
    });
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    const list = adminDataService.getLocations();
    const target = list.find((l) => l.id === selectedLocation.id);
    if (!target) return;

    target.baseShippingCost = Number(editBaseCost);
    target.expressShippingCost = Number(editExpressCost);
    adminDataService.saveLocations(list);
    adminDataService.recordAudit('Super Admin', 'CONFIG_CHANGE', 'Location', target.id, `Updated shipping rates for Wilaya ${target.nameEn}: Base ${target.baseShippingCost} DA, Express ${target.expressShippingCost} DA`);
    loadData();
    setIsEditOpen(false);
    toast({
      title: 'Shipping Rates Updated',
      description: `Updated delivery tariffs for Wilaya ${target.nameEn}.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'shippingZone',
      label: 'Shipping Zone',
      options: [
        { label: 'Zone 1 (Coast)', value: 'Zone 1 (Algiers & Coast)' },
        { label: 'Zone 2 (Central Plains)', value: 'Zone 2 (Central Plains)' },
        { label: 'Zone 4 (Sahara)', value: 'Zone 4 (Sahara)' },
      ],
    },
    {
      key: 'isDeliveryAvailable',
      label: 'Delivery Active',
      options: [
        { label: 'Available', value: 'true' },
        { label: 'Suspended', value: 'false' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminLocation>[] = [
    {
      label: 'Enable Delivery',
      icon: CheckCircle2,
      variant: 'default',
      action: (selected) => {
        const list = adminDataService.getLocations();
        const ids = new Set(selected.map((s) => s.id));
        list.forEach((l) => {
          if (ids.has(l.id)) l.isDeliveryAvailable = true;
        });
        adminDataService.saveLocations(list);
        loadData();
        toast({ title: 'Coverage Updated', description: `${selected.length} wilayas marked active for delivery.` });
      },
    },
  ];

  const columns: ColumnDef<AdminLocation>[] = [
    {
      header: 'Code & Wilaya Name',
      accessorKey: 'wilayaCode',
      cell: (loc) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">
              {loc.wilayaCode}
            </span>
            <span>{loc.nameEn}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {loc.nameAr} • {loc.nameFr}
          </div>
        </div>
      ),
    },
    {
      header: 'Shipping Zone & Communes',
      accessorKey: 'shippingZone',
      cell: (loc) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{loc.shippingZone}</div>
          <div className="text-muted-foreground">{loc.communesCount} communes</div>
        </div>
      ),
    },
    {
      header: 'Standard / Express Rates',
      accessorKey: 'baseShippingCost',
      cell: (loc) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{loc.baseShippingCost} DA base</span>
          <span className="text-muted-foreground block text-[11px]">{loc.expressShippingCost} DA express</span>
        </div>
      ),
    },
    {
      header: 'Couriers',
      accessorKey: 'activeCouriers',
      cell: (loc) => (
        <div className="flex gap-1 flex-wrap">
          {loc.activeCouriers.map((c, i) => (
            <Badge key={i} variant="outline" className="text-[10px] bg-muted/30">
              {c}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Delivery Coverage',
      accessorKey: 'isDeliveryAvailable',
      cell: (loc) => (
        <Badge variant={loc.isDeliveryAvailable ? 'default' : 'outline'} className="text-xs">
          {loc.isDeliveryAvailable ? 'Active Coverage' : 'Paused'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (loc) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedLocation(loc);
              setIsDetailOpen(true);
            }}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedLocation(loc);
              setEditBaseCost(loc.baseShippingCost);
              setEditExpressCost(loc.expressShippingCost);
              setIsEditOpen(true);
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const total = locations.length;
  const activeCount = locations.filter((l) => l.isDeliveryAvailable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <MapPin className="mr-3 h-8 w-8 text-primary" /> Locations & 58 Wilayas Coverage
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage Algerian geographical coverage zones, delivery courier partnerships (Yalidine, Procolis), and base shipping fees.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Wilayas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">58 Wilayas</div>
            <p className="text-xs text-muted-foreground mt-1">1,541 Municipalities (Communes)</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Covered by Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount} Wilayas</div>
            <p className="text-xs text-muted-foreground mt-1">Active parcel shipping</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Delivery Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4 Carriers</div>
            <p className="text-xs text-muted-foreground mt-1">Yalidine, Procolis, Kazi, In-House</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Average Base Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">550 DA</div>
            <p className="text-xs text-muted-foreground mt-1">Zone 1 & 2 standard rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={locations}
        columns={columns}
        searchPlaceholder="Search wilaya code (01-58), name, Arabic, zone..."
        searchKeys={['wilayaCode', 'nameEn', 'nameAr', 'nameFr', 'shippingZone']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_wilayas"
        onRowClick={(loc) => {
          setSelectedLocation(loc);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedLocation && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Wilaya (${selectedLocation.wilayaCode}) ${selectedLocation.nameEn}`}
          subtitle={`${selectedLocation.nameAr} • ${selectedLocation.nameFr}`}
          statusBadge={{
            label: selectedLocation.isDeliveryAvailable ? 'Delivery Active' : 'Delivery Paused',
            variant: selectedLocation.isDeliveryAvailable ? 'default' : 'outline',
          }}
          metrics={[
            { label: 'Base Shipping', value: `${selectedLocation.baseShippingCost} DA`, icon: DollarSign },
            { label: 'Express Shipping', value: `${selectedLocation.expressShippingCost} DA`, icon: Truck },
            { label: 'Communes', value: selectedLocation.communesCount, icon: Compass },
            { label: 'Zone', value: selectedLocation.shippingZone.split(' ')[0], icon: MapPin },
          ]}
          fields={[
            { label: 'Wilaya Number', value: selectedLocation.wilayaCode },
            { label: 'English Name', value: selectedLocation.nameEn },
            { label: 'Arabic Name (العربية)', value: selectedLocation.nameAr },
            { label: 'French Name (Français)', value: selectedLocation.nameFr },
            { label: 'Geographical Zone', value: selectedLocation.shippingZone },
            { label: 'Active Delivery Carriers', value: selectedLocation.activeCouriers.join(', '), fullWidth: true },
          ]}
          actions={
            <Button
              variant={selectedLocation.isDeliveryAvailable ? 'destructive' : 'default'}
              size="sm"
              onClick={() => handleToggleDelivery(selectedLocation.id)}
            >
              <Power className="h-4 w-4 mr-1.5" />
              {selectedLocation.isDeliveryAvailable ? 'Pause Delivery Coverage' : 'Enable Delivery Coverage'}
            </Button>
          }
        />
      )}

      {/* Edit Rates Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Shipping Tariffs</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adjust base standard and express delivery costs for Wilaya ({selectedLocation?.wilayaCode}) {selectedLocation?.nameEn}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRates} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Standard Base Shipping Rate (DA) *</Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={editBaseCost}
                onChange={(e) => setEditBaseCost(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Express 24h Delivery Rate (DA) *</Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={editExpressCost}
                onChange={(e) => setEditExpressCost(Number(e.target.value))}
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Tariffs</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
