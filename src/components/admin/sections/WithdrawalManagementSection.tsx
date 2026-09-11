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
  Landmark, DollarSign, CheckCircle2, XCircle, Clock, 
  Eye, FileText, Send, AlertTriangle, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { financialService } from '@/services/financialService';
import { PlatformWithdrawalRecord } from '@/types/financials';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';

export function WithdrawalManagementSection() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<PlatformWithdrawalRecord[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PlatformWithdrawalRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modals
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [transferProof, setTransferProof] = useState('');

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = () => {
    setWithdrawals(financialService.getWithdrawals());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;

    const res = await financialService.approveWithdrawal(
      selectedWithdrawal.id,
      'Super Admin',
      transferProof.trim() || undefined
    );

    if (res.success) {
      toast({
        title: 'Payout Disbursed & Completed',
        description: `Transfer of ${selectedWithdrawal.netPayoutAmount.toLocaleString()} DA to ${selectedWithdrawal.recipientName} recorded.`,
      });
      loadData();
      setIsApproveOpen(false);
      setIsDetailOpen(false);
      setTransferProof('');
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal || !rejectReason.trim()) return;

    const res = await financialService.rejectWithdrawal(
      selectedWithdrawal.id,
      rejectReason.trim(),
      'Super Admin'
    );

    if (res.success) {
      toast({
        title: 'Withdrawal Rejected',
        description: `Funds returned to ${selectedWithdrawal.recipientName}'s available balance.`,
      });
      loadData();
      setIsRejectOpen(false);
      setIsDetailOpen(false);
      setRejectReason('');
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Payout Status',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Completed / Disbursed', value: 'completed' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      key: 'bankOrCCP',
      label: 'Disbursement Method',
      options: [
        { label: 'Algérie Poste (CCP)', value: 'Algérie Poste (CCP)' },
        { label: 'BaridiMob', value: 'BaridiMob' },
        { label: 'BNA Bank', value: 'BNA' },
      ],
    },
  ];

  const columns: ColumnDef<PlatformWithdrawalRecord>[] = [
    {
      header: 'Payout # & Recipient',
      accessorKey: 'payoutCode',
      cell: (w) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground font-mono">{w.payoutCode}</div>
          <div className="text-xs text-muted-foreground font-medium">{w.recipientName}</div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold bg-muted/40">
            {w.recipientType.replace('_', ' ')}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Bank / Postal CCP & RIP',
      accessorKey: 'bankOrCCP',
      cell: (w) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-foreground">{w.bankOrCCP}</div>
          <div className="text-muted-foreground font-mono text-[11px]">Acc: {w.accountNumber}</div>
          <div className="text-muted-foreground font-mono text-[11px]">RIP: {w.ripNumber}</div>
        </div>
      ),
    },
    {
      header: 'Requested & Net Payout',
      accessorKey: 'requestedAmount',
      cell: (w) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{w.requestedAmount.toLocaleString()} DA</span>
          <span className="text-muted-foreground block text-[11px]">
            Net: <strong className="text-emerald-600 dark:text-emerald-400">{w.netPayoutAmount.toLocaleString()} DA</strong> (Fee: {w.processingFee} DA)
          </span>
        </div>
      ),
    },
    {
      header: 'Request Date',
      accessorKey: 'requestedAt',
      cell: (w) => <span className="text-xs text-muted-foreground font-mono">{w.requestedAt}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (w) => {
        const sBadges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          pending: { label: 'Pending Review', variant: 'secondary' },
          completed: { label: 'Completed', variant: 'default' },
          rejected: { label: 'Rejected', variant: 'destructive' },
        };
        const conf = sBadges[w.status] || { label: w.status, variant: 'outline' };
        return <Badge variant={conf.variant} className="text-xs font-semibold">{conf.label}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (w) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedWithdrawal(w);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          {w.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="default"
                className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setSelectedWithdrawal(w);
                  setIsApproveOpen(true);
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSelectedWithdrawal(w);
                  setIsRejectOpen(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const stats = financialService.getPlatformFinancialStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Landmark className="mr-3 h-8 w-8 text-primary" /> Merchant & Craftsmen Withdrawal Desk
        </h1>
        <p className="text-muted-foreground text-sm">
          Review, approve, and disburse merchant earnings to Algerian Post CCP and 20-digit RIP bank accounts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Pending Payout Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingWithdrawalsCount} Requests</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingWithdrawalsAmount.toLocaleString()} DA awaiting disbursement</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Disbursed Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.totalWithdrawalsDisbursed.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully wired via CCP/Bank</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Seller Cleared Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.sellerAvailableBalancesTotal.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for future withdrawal</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Postal Transfer SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">&lt; 24 Hours</div>
            <p className="text-xs text-muted-foreground mt-1">CCP/BaridiMob wire clearance</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={withdrawals}
        columns={columns}
        searchPlaceholder="Search withdrawals by code, recipient name, CCP/RIP number..."
        searchKeys={['payoutCode', 'recipientName', 'accountNumber', 'ripNumber', 'bankOrCCP']}
        filterOptions={filterOptions}
        exportFileName="khidmatik_withdrawals"
        onRowClick={(w) => {
          setSelectedWithdrawal(w);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedWithdrawal && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Withdrawal ${selectedWithdrawal.payoutCode}`}
          subtitle={`Requested by ${selectedWithdrawal.recipientName} on ${selectedWithdrawal.requestedAt}`}
          statusBadge={{
            label: selectedWithdrawal.status,
            variant: selectedWithdrawal.status === 'completed' ? 'default' : 'secondary',
          }}
          metrics={[
            { label: 'Requested Amount', value: `${selectedWithdrawal.requestedAmount.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Postal/Bank Fee', value: `${selectedWithdrawal.processingFee} DA`, icon: Landmark },
            { label: 'Net Disbursed', value: `${selectedWithdrawal.netPayoutAmount.toLocaleString()} DA`, icon: ArrowUpRight },
            { label: 'Method', value: selectedWithdrawal.bankOrCCP, icon: ShieldCheck },
          ]}
          fields={[
            { label: 'Recipient Name', value: selectedWithdrawal.recipientName },
            { label: 'Entity Type', value: selectedWithdrawal.recipientType.replace('_', ' ').toUpperCase() },
            { label: 'Financial Institution', value: selectedWithdrawal.bankOrCCP },
            { label: 'Account Number', value: selectedWithdrawal.accountNumber },
            { label: '20-Digit Algerian RIP', value: selectedWithdrawal.ripNumber, fullWidth: true },
            { label: 'Transfer Wire Reference', value: selectedWithdrawal.transferProofReference || 'N/A' },
            { label: 'Processed By Operator', value: selectedWithdrawal.processedByAdmin || 'Pending' },
            { label: 'Rejection Reason', value: selectedWithdrawal.rejectionReason || 'None', fullWidth: true },
          ]}
          actions={
            selectedWithdrawal.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setIsApproveOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve & Disburse
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsRejectOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Reject Request
                </Button>
              </div>
            ) : undefined
          }
        />
      )}

      {/* Approve Modal */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> Confirm Wire Transfer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Authorize disbursement of <strong>{selectedWithdrawal?.netPayoutAmount.toLocaleString()} DA</strong> to {selectedWithdrawal?.recipientName} ({selectedWithdrawal?.bankOrCCP} RIP: {selectedWithdrawal?.ripNumber}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApprove} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bank / CCP Wire Reference # *</Label>
              <Input
                placeholder="e.g. CCP-VIR-891024 / BM-REF-9921"
                value={transferProof}
                onChange={(e) => setTransferProof(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsApproveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm & Log Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Reject Withdrawal Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rejecting this payout request will automatically unlock the funds ({selectedWithdrawal?.requestedAmount.toLocaleString()} DA) back into the seller available balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason for Rejection *</Label>
              <Textarea
                placeholder="e.g. Invalid RIP checksum / Account name mismatch with trade license"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Reject & Unlock Balance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
