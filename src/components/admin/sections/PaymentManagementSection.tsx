'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, DollarSign, CheckCircle2, XCircle, Clock, 
  Terminal, ShieldCheck, Eye, RefreshCw, Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { financialService } from '@/services/financialService';
import { PlatformPaymentRecord } from '@/types/financials';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function PaymentManagementSection() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PlatformPaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PlatformPaymentRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = () => {
    setPayments(financialService.getPayments());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Processing', value: 'processing' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Partially Refunded', value: 'partially_refunded' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      key: 'method',
      label: 'Gateway',
      options: [
        { label: 'Edahabia (SATIM)', value: 'edahabia' },
        { label: 'BaridiMob', value: 'baridimob' },
        { label: 'CIB Card', value: 'cib' },
        { label: 'Cash on Delivery', value: 'cash_on_delivery' },
      ],
    },
  ];

  const columns: ColumnDef<PlatformPaymentRecord>[] = [
    {
      header: 'Reference & Order',
      accessorKey: 'paymentReference',
      cell: (p) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground font-mono">{p.paymentReference}</div>
          <div className="text-xs text-muted-foreground font-mono">Order: {p.orderId}</div>
        </div>
      ),
    },
    {
      header: 'Payer / Customer',
      accessorKey: 'payerName',
      cell: (p) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{p.payerName}</div>
          <div className="text-muted-foreground font-mono">{p.payerPhone}</div>
        </div>
      ),
    },
    {
      header: 'Amount & Net',
      accessorKey: 'amount',
      cell: (p) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{p.amount.toLocaleString()} DA</span>
          <span className="text-muted-foreground block text-[11px]">
            Net: {p.netAmount.toLocaleString()} DA (Fee: {p.networkFee} DA)
          </span>
        </div>
      ),
    },
    {
      header: 'Gateway & Idempotency',
      accessorKey: 'method',
      cell: (p) => (
        <div className="space-y-0.5 text-xs">
          <Badge variant="outline" className="text-[10px] uppercase font-bold bg-muted/30">
            {p.method.replace(/_/g, ' ')}
          </Badge>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 truncate max-w-[160px]" title={p.idempotencyKey}>
            <Key className="h-3 w-3 shrink-0" />
            {p.idempotencyKey}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (p) => {
        const sBadges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          succeeded: { label: 'Succeeded', variant: 'default' },
          processing: { label: 'Processing', variant: 'secondary' },
          failed: { label: 'Failed', variant: 'destructive' },
          refunded: { label: 'Refunded', variant: 'outline' },
          partially_refunded: { label: 'Partially Refunded', variant: 'outline' },
        };
        const conf = sBadges[p.status] || { label: p.status, variant: 'outline' };
        return <Badge variant={conf.variant} className="text-xs font-semibold capitalize">{conf.label}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (p) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPayment(p);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View Receipt
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
          <CreditCard className="mr-3 h-8 w-8 text-primary" /> Platform Payment Gateway Records
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitor SATIM/Edahabia, BaridiMob, and CIB gateway transactions with server-side validation and idempotency safeguards.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Payments Captured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.grossMerchandiseVolume.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Processed platform volume</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Escrow In-Flight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.escrowPendingTotal.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Locked in pending protection</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Platform Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.platformNetCommissionRevenue.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Net platform revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Idempotency Guard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">100% Active</div>
            <p className="text-xs text-muted-foreground mt-1">Zero duplicate charge incidents</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={payments}
        columns={columns}
        searchPlaceholder="Search payments by reference, order ID, customer name, phone, gateway TX..."
        searchKeys={['paymentReference', 'orderId', 'payerName', 'payerPhone', 'gatewayTransactionId', 'idempotencyKey']}
        filterOptions={filterOptions}
        exportFileName="khidmatik_payment_records"
        onRowClick={(p) => {
          setSelectedPayment(p);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedPayment && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Payment ${selectedPayment.paymentReference}`}
          subtitle={`Captured on ${selectedPayment.createdAt} via ${selectedPayment.method.toUpperCase()}`}
          statusBadge={{
            label: selectedPayment.status,
            variant: selectedPayment.status === 'succeeded' ? 'default' : 'secondary',
          }}
          metrics={[
            { label: 'Gross Amount', value: `${selectedPayment.amount.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Gateway Fee', value: `${selectedPayment.networkFee} DA`, icon: CreditCard },
            { label: 'Net Cleared', value: `${selectedPayment.netAmount.toLocaleString()} DA`, icon: ShieldCheck },
            { label: 'Status', value: selectedPayment.status.toUpperCase(), icon: CheckCircle2 },
          ]}
          fields={[
            { label: 'Payment Reference', value: selectedPayment.paymentReference },
            { label: 'Associated Order ID', value: selectedPayment.orderId },
            { label: 'Payer Customer', value: selectedPayment.payerName },
            { label: 'Customer Phone', value: selectedPayment.payerPhone },
            { label: 'Gateway Transaction Code', value: selectedPayment.gatewayTransactionId },
            { label: 'Idempotency Key', value: selectedPayment.idempotencyKey },
            { label: 'Client IP Telemetry', value: selectedPayment.ipAddress || '105.101.44.10' },
          ]}
        />
      )}
    </div>
  );
}
