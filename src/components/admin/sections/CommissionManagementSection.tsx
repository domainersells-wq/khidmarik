'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Percent, DollarSign, Edit3, CheckCircle2, TrendingUp, 
  Layers, Store, Wrench, Building, Package, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { financialService } from '@/services/financialService';
import { PlatformCommissionRecord } from '@/types/financials';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function CommissionManagementSection() {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<PlatformCommissionRecord[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<PlatformCommissionRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit rates state
  const [editRate, setEditRate] = useState<number>(8);
  const [editMinFee, setEditMinFee] = useState<number>(200);

  const loadData = () => {
    setCommissions(financialService.getCommissions());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission) return;

    const list = financialService.getCommissions();
    const target = list.find((c) => c.id === selectedCommission.id);
    if (!target) return;

    target.defaultRatePercent = Number(editRate);
    target.minFeeDZD = Number(editMinFee);
    target.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 19);
    financialService.saveCommissions(list);

    loadData();
    setIsEditOpen(false);
    toast({
      title: 'Commission Rate Updated',
      description: `Updated ${target.categoryName} take-rate to ${target.defaultRatePercent}% (Min: ${target.minFeeDZD} DA).`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'entityType',
      label: 'Entity Domain',
      options: [
        { label: 'Merchant Stores', value: 'store' },
        { label: 'Craftsmen Services', value: 'craftsman' },
        { label: 'Marketplace Parts', value: 'marketplace_seller' },
        { label: 'Banquet Halls', value: 'banquet_hall' },
      ],
    },
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Paused', value: 'false' },
      ],
    },
  ];

  const columns: ColumnDef<PlatformCommissionRecord>[] = [
    {
      header: 'Category & Entity Domain',
      accessorKey: 'categoryName',
      cell: (c) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">{c.categoryName}</div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold bg-muted/40">
            {c.entityType.replace(/_/g, ' ')}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Take-Rate %',
      accessorKey: 'defaultRatePercent',
      cell: (c) => (
        <div className="text-sm font-bold text-primary">
          {c.defaultRatePercent}%
          <span className="text-muted-foreground block text-[11px] font-normal">
            Min Cap: {c.minFeeDZD} DA
          </span>
        </div>
      ),
    },
    {
      header: 'Volume Processed',
      accessorKey: 'totalVolumeProcessed',
      cell: (c) => (
        <span className="text-xs font-medium text-foreground">
          {c.totalVolumeProcessed.toLocaleString()} DA
        </span>
      ),
    },
    {
      header: 'Collected This Month',
      accessorKey: 'totalCollectedThisMonth',
      cell: (c) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          +{c.totalCollectedThisMonth.toLocaleString()} DA
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (c) => (
        <Badge variant={c.isActive ? 'default' : 'outline'} className="text-xs">
          {c.isActive ? 'Active Rule' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (c) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedCommission(c);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedCommission(c);
              setEditRate(c.defaultRatePercent);
              setEditMinFee(c.minFeeDZD);
              setIsEditOpen(true);
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const totalCollected = commissions.reduce((acc, c) => acc + c.totalCollectedThisMonth, 0);
  const totalVolume = commissions.reduce((acc, c) => acc + c.totalVolumeProcessed, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Percent className="mr-3 h-8 w-8 text-primary" /> Platform Commission Architecture & Rules
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure server-side category take-rates, minimum fee thresholds, and track month-to-date platform revenue.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Month-To-Date Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCollected.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Direct platform earned revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Processed GMV Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalVolume.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Cross-channel gross merchandise</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Average Take-Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">8.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Blended platform commission</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Fee Caps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">4 Categories</div>
            <p className="text-xs text-muted-foreground mt-1">Min/Max protections enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={commissions}
        columns={columns}
        searchPlaceholder="Search commission rules by category name, entity type..."
        searchKeys={['categoryName', 'entityType']}
        filterOptions={filterOptions}
        exportFileName="khidmatik_commission_rules"
        onRowClick={(c) => {
          setSelectedCommission(c);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedCommission && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedCommission.categoryName}
          subtitle={`Domain: ${selectedCommission.entityType.toUpperCase()} • Last Updated: ${selectedCommission.lastUpdated}`}
          statusBadge={{
            label: selectedCommission.isActive ? 'Active Rule' : 'Inactive',
            variant: selectedCommission.isActive ? 'default' : 'outline',
          }}
          metrics={[
            { label: 'Commission Rate', value: `${selectedCommission.defaultRatePercent}%`, icon: Percent },
            { label: 'Min Fee Cap', value: `${selectedCommission.minFeeDZD} DA`, icon: DollarSign },
            { label: 'Monthly Revenue', value: `${selectedCommission.totalCollectedThisMonth.toLocaleString()} DA`, icon: TrendingUp },
            { label: 'Status', value: selectedCommission.isActive ? 'ACTIVE' : 'INACTIVE', icon: CheckCircle2 },
          ]}
          fields={[
            { label: 'Category Rule Name', value: selectedCommission.categoryName },
            { label: 'Entity Domain Type', value: selectedCommission.entityType.replace(/_/g, ' ').toUpperCase() },
            { label: 'Percentage Take-Rate', value: `${selectedCommission.defaultRatePercent}%` },
            { label: 'Minimum Fee Floor (DZD)', value: `${selectedCommission.minFeeDZD} DA` },
            { label: 'Maximum Fee Ceiling (DZD)', value: selectedCommission.maxFeeDZD ? `${selectedCommission.maxFeeDZD} DA` : 'No Ceiling' },
            { label: 'Last Rule Update', value: selectedCommission.lastUpdated },
          ]}
        />
      )}

      {/* Edit Commission Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Configure Commission Rate</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adjust platform percentage take-rate and minimum fee threshold for {selectedCommission?.categoryName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCommission} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Percentage Commission Rate (%) *</Label>
              <Input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={editRate}
                onChange={(e) => setEditRate(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Minimum Fee Floor (DA) *</Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={editMinFee}
                onChange={(e) => setEditMinFee(Number(e.target.value))}
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Commission Rule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
