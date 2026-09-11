'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  RotateCcw, DollarSign, CheckCircle2, XCircle, Clock, 
  Eye, FileText, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { financialService } from '@/services/financialService';
import { PlatformRefundRecord } from '@/types/financials';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function RefundManagementSection() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<PlatformRefundRecord[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<PlatformRefundRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = () => {
    setRefunds(financialService.getRefunds());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterOptions: FilterOption[] = [
    {
      key: 'reason',
      label: 'Refund Reason',
      options: [
        { label: 'Defective Merchandise', value: 'product_defect' },
        { label: 'Not as Described', value: 'not_as_described' },
        { label: 'Late Delivery', value: 'late_delivery' },
        { label: 'Service Not Delivered', value: 'service_not_delivered' },
        { label: 'Dispute Settlement', value: 'dispute_arbitration' },
      ],
    },
    {
      key: 'isPartial',
      label: 'Refund Scope',
      options: [
        { label: 'Partial Refund', value: 'true' },
        { label: 'Full Refund', value: 'false' },
      ],
    },
  ];

  const columns: ColumnDef<PlatformRefundRecord>[] = [
    {
      header: 'Refund Code & Order',
      accessorKey: 'refundCode',
      cell: (r) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground font-mono">{r.refundCode}</div>
          <div className="text-xs text-muted-foreground font-mono">Order: {r.orderId}</div>
        </div>
      ),
    },
    {
      header: 'Customer & Seller',
      accessorKey: 'customerName',
      cell: (r) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{r.customerName}</div>
          <div className="text-muted-foreground">From: {r.sellerOrProviderName}</div>
        </div>
      ),
    },
    {
      header: 'Refund Amount & Scope',
      accessorKey: 'refundAmount',
      cell: (r) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{r.refundAmount.toLocaleString()} DA</span>
          <span className="text-muted-foreground block text-[11px]">
            {r.isPartial ? 'Partial Refund' : 'Full Refund'} (Orig: {r.originalAmount.toLocaleString()} DA)
          </span>
        </div>
      ),
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      cell: (r) => (
        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-muted/40">
          {r.reason.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Date & Operator',
      accessorKey: 'createdAt',
      cell: (r) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-mono text-muted-foreground">{r.createdAt}</div>
          <div className="text-muted-foreground text-[11px]">{r.processedBy}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (r) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRefund(r);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View Details
        </Button>
      ),
    },
  ];

  const stats = financialService.getPlatformFinancialStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <RotateCcw className="mr-3 h-8 w-8 text-primary" /> Customer Refunds & Charge Reversals
        </h1>
        <p className="text-muted-foreground text-sm">
          Inspect authorized full and partial customer refunds, dispute settlements, and double-entry reversal entries.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Refunded Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalRefundsVolume.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Returned to buyer cards & wallets</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Refund Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1.4%</div>
            <p className="text-xs text-muted-foreground mt-1">Low platform dispute index</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Gateway Settlement Reversals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Automated</div>
            <p className="text-xs text-muted-foreground mt-1">Proportional commission adjustment</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Dispute Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">100% Audited</div>
            <p className="text-xs text-muted-foreground mt-1">Immutable journal logging</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={refunds}
        columns={columns}
        searchPlaceholder="Search refunds by code, order ID, customer name, reason..."
        searchKeys={['refundCode', 'orderId', 'customerName', 'reason', 'processedBy']}
        filterOptions={filterOptions}
        exportFileName="khidmatik_refunds"
        onRowClick={(r) => {
          setSelectedRefund(r);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedRefund && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Refund Record ${selectedRefund.refundCode}`}
          subtitle={`Issued for Order ${selectedRefund.orderId} on ${selectedRefund.createdAt}`}
          statusBadge={{
            label: selectedRefund.status,
            variant: 'outline',
          }}
          metrics={[
            { label: 'Refund Amount', value: `${selectedRefund.refundAmount.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Scope', value: selectedRefund.isPartial ? 'PARTIAL' : 'FULL', icon: RotateCcw },
            { label: 'Original Charge', value: `${selectedRefund.originalAmount.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Authorized By', value: selectedRefund.processedBy, icon: ShieldCheck },
          ]}
          fields={[
            { label: 'Refund Reference Code', value: selectedRefund.refundCode },
            { label: 'Associated Order ID', value: selectedRefund.orderId },
            { label: 'Customer Buyer', value: selectedRefund.customerName },
            { label: 'Customer Email', value: selectedRefund.customerEmail },
            { label: 'Reason for Refund', value: selectedRefund.reason.replace(/_/g, ' ').toUpperCase() },
            { label: 'Gateway Reversal Code', value: selectedRefund.reversalTransactionId || 'N/A' },
            { label: 'Operator Decision Notes', value: selectedRefund.adminNotes || 'Standard refund authorization.', fullWidth: true },
          ]}
        />
      )}
    </div>
  );
}
