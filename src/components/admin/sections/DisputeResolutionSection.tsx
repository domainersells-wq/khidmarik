'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, 
  Eye, MessageSquare, Scale, Users, DollarSign, FileText,
  Gavel, RotateCcw, ArrowRight, ShieldCheck, HelpCircle, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { escrowDisputeService } from '@/services/escrowDisputeService';
import { 
  PlatformDisputeRecord, 
  DisputeStatus, 
  DisputeResolutionAction 
} from '@/types/escrowDispute';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function DisputeResolutionSection() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<PlatformDisputeRecord[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<PlatformDisputeRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Arbitration Modal State
  const [isArbitrationModalOpen, setIsArbitrationModalOpen] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<DisputeResolutionAction>('FULL_REFUND_CUSTOMER');
  const [customerRefundInput, setCustomerRefundInput] = useState<number>(0);
  const [providerPayoutInput, setProviderPayoutInput] = useState<number>(0);
  const [mediatorNotesInput, setMediatorNotesInput] = useState<string>('');
  const [isExecutingArbitration, setIsExecutingArbitration] = useState<boolean>(false);

  const loadData = () => {
    setDisputes(escrowDisputeService.getDisputes());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenArbitration = (dispute: PlatformDisputeRecord) => {
    setSelectedDispute(dispute);
    setResolutionAction('FULL_REFUND_CUSTOMER');
    setCustomerRefundInput(dispute.disputedAmount);
    setProviderPayoutInput(0);
    setMediatorNotesInput('');
    setIsArbitrationModalOpen(true);
  };

  const handleActionChange = (action: DisputeResolutionAction) => {
    setResolutionAction(action);
    if (!selectedDispute) return;
    if (action === 'FULL_REFUND_CUSTOMER') {
      setCustomerRefundInput(selectedDispute.disputedAmount);
      setProviderPayoutInput(0);
    } else if (action === 'RELEASE_TO_PROVIDER') {
      setCustomerRefundInput(0);
      setProviderPayoutInput(selectedDispute.disputedAmount);
    } else {
      // Partial Split 50/50 default
      const half = Math.round(selectedDispute.disputedAmount / 2);
      setCustomerRefundInput(half);
      setProviderPayoutInput(selectedDispute.disputedAmount - half);
    }
  };

  const handleExecuteArbitration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    if (!mediatorNotesInput.trim()) {
      toast({ title: 'Rationale Required', description: 'Please explain the legal/platform rationale for this decision.', variant: 'destructive' });
      return;
    }

    setIsExecutingArbitration(true);
    try {
      const res = await escrowDisputeService.resolveDispute({
        disputeId: selectedDispute.id,
        adminId: 'adm_arbiter_1',
        adminName: 'Platform Senior Arbiter',
        resolutionAction,
        customerRefundAmount: customerRefundInput,
        providerPayoutAmount: providerPayoutInput,
        mediatorNotes: mediatorNotesInput,
      });

      if (res.success && res.dispute) {
        toast({
          title: 'Dispute Arbitrated & Settled ⚖️',
          description: `Case ${res.dispute.disputeNumber} has been resolved via ${resolutionAction}. General ledger updated.`,
        });
        setIsArbitrationModalOpen(false);
        setIsDetailOpen(false);
        loadData();
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsExecutingArbitration(false);
    }
  };

  const handleUpdateStatusOnly = (status: DisputeStatus) => {
    if (!selectedDispute) return;
    escrowDisputeService.updateDisputeStatus(selectedDispute.id, status, 'adm_1', 'Status updated from admin workbench');
    loadData();
    const updated = escrowDisputeService.getDisputeById(selectedDispute.id);
    setSelectedDispute(updated);
    toast({ title: 'Status Updated', description: `Dispute moved to ${status}.` });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Dispute Status',
      options: [
        { label: 'Open', value: 'OPEN' },
        { label: 'Under Review', value: 'UNDER_REVIEW' },
        { label: 'Waiting Customer', value: 'WAITING_CUSTOMER' },
        { label: 'Waiting Provider', value: 'WAITING_PROVIDER' },
        { label: 'Resolved', value: 'RESOLVED' },
        { label: 'Refunded', value: 'REFUNDED' },
        { label: 'Released', value: 'RELEASED' },
        { label: 'Closed', value: 'CLOSED' },
      ],
    },
    {
      key: 'reasonCode',
      label: 'Reason',
      options: [
        { label: 'Damaged Items', value: 'DAMAGED_ITEMS' },
        { label: 'Wrong Items', value: 'WRONG_ITEMS' },
        { label: 'Not Delivered', value: 'NOT_DELIVERED' },
        { label: 'Poor Quality', value: 'POOR_QUALITY' },
        { label: 'Unauthorized Charge', value: 'UNAUTHORIZED_CHARGE' },
      ],
    },
  ];

  const columns: ColumnDef<PlatformDisputeRecord>[] = [
    {
      header: 'Case # & Reason',
      accessorKey: 'disputeNumber',
      cell: (d) => (
        <div>
          <div className="font-mono font-bold text-foreground text-xs">{d.disputeNumber}</div>
          <span className="text-[11px] text-muted-foreground capitalize">
            {d.reasonCode.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Order # & Amount',
      accessorKey: 'orderNumber',
      cell: (d) => (
        <div>
          <span className="font-mono font-semibold text-foreground text-xs">{d.orderNumber}</span>
          <div className="text-xs font-bold text-primary">{d.disputedAmount.toLocaleString()} DA</div>
        </div>
      ),
    },
    {
      header: 'Parties Involved',
      accessorKey: 'customerName',
      cell: (d) => (
        <div className="text-xs space-y-0.5">
          <div className="text-foreground font-medium">Buyer: {d.customerName}</div>
          <div className="text-muted-foreground">Store: {d.providerName}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (d) => {
        const badgeColors: Record<DisputeStatus, string> = {
          OPEN: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
          UNDER_REVIEW: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
          WAITING_CUSTOMER: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
          WAITING_PROVIDER: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
          RESOLVED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          REFUNDED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          RELEASED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          CLOSED: 'bg-muted text-muted-foreground border-border',
        };
        return (
          <Badge variant="outline" className={`font-bold text-[10px] uppercase ${badgeColors[d.status]}`}>
            {d.status.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Opened Date',
      accessorKey: 'createdAt',
      cell: (d) => <span className="text-[11px] text-muted-foreground font-mono">{d.createdAt}</span>,
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (d) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs rounded-xl"
            onClick={() => {
              setSelectedDispute(d);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>

          {!['RESOLVED', 'REFUNDED', 'RELEASED', 'CLOSED'].includes(d.status) && (
            <Button
              size="sm"
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
              onClick={() => handleOpenArbitration(d)}
            >
              <Gavel className="h-3.5 w-3.5 mr-1" /> Arbitrate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-primary/5 to-card border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-600 text-white font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              Escrow Protection
            </Badge>
            <span className="text-xs text-muted-foreground">• Platform Mediation Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scale className="h-6 w-6 text-amber-600" /> Dispute Resolution & Escrow Arbitration
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Review customer claims, examine evidence, request provider statements, and arbitrate binding financial settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-background border rounded-xl shadow-sm text-right">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
              Active Disputes
            </span>
            <span className="text-xl font-extrabold text-amber-600">
              {disputes.filter((d) => !['RESOLVED', 'REFUNDED', 'RELEASED', 'CLOSED'].includes(d.status)).length} Cases
            </span>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <AdminDataTable
        data={disputes}
        columns={columns}
        filterOptions={filterOptions}
        searchPlaceholder="Search case #, order #, buyer, store..."
      />

      {/* Dispute Detail Drawer */}
      <AdminDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedDispute ? `Dispute Case: ${selectedDispute.disputeNumber}` : 'Dispute Details'}
        subtitle={selectedDispute ? `Order ${selectedDispute.orderNumber} • ${selectedDispute.disputedAmount.toLocaleString()} DA in Escrow` : ''}
        statusBadge={
          selectedDispute
            ? {
                label: selectedDispute.status.replace(/_/g, ' '),
                variant: 'outline',
              }
            : undefined
        }
      >
        {selectedDispute && (
          <div className="space-y-6 text-xs">
            
            {/* Quick Arbitration Call-to-Action */}
            {!['RESOLVED', 'REFUNDED', 'RELEASED', 'CLOSED'].includes(selectedDispute.status) && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Gavel className="h-4 w-4 text-amber-600" /> Ready to Arbitrate?
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Execute full refund, partial split, or provider fund release.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenArbitration(selectedDispute)}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs"
                >
                  <Gavel className="h-3.5 w-3.5 mr-1" /> Arbitrate Case
                </Button>
              </div>
            )}

            {/* Parties & Escrow Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Customer (Buyer)</span>
                <p className="font-semibold text-foreground">{selectedDispute.customerName}</p>
                <p className="text-muted-foreground font-mono text-[11px]">ID: {selectedDispute.customerId}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Merchant Store</span>
                <p className="font-semibold text-foreground">{selectedDispute.providerName}</p>
                <p className="text-muted-foreground font-mono text-[11px]">Store ID: {selectedDispute.providerId}</p>
              </div>
            </div>

            {/* Customer Claim & Description */}
            <div className="p-4 bg-card border rounded-2xl space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Customer Claim Details
              </span>
              <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl">
                {selectedDispute.customerClaimDescription}
              </p>
            </div>

            {/* Evidence Gallery */}
            <div className="space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" /> Attached Claim Evidence ({selectedDispute.evidence.length})
              </span>
              {selectedDispute.evidence.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedDispute.evidence.map((ev) => (
                    <a
                      key={ev.id}
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 border rounded-xl hover:border-primary transition-all bg-card group"
                    >
                      <div className="h-24 rounded-lg bg-muted overflow-hidden relative mb-1.5">
                        <img src={ev.fileUrl} alt={ev.fileName} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="font-medium text-[11px] truncate text-foreground">{ev.fileName}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">By: {ev.uploaderRole.toLowerCase()}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic text-xs">No media files attached.</p>
              )}
            </div>

            {/* Provider Statement */}
            <div className="p-4 bg-card border rounded-2xl space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" /> Provider Statement & Counter-Offer
              </span>
              {selectedDispute.providerResponseText ? (
                <div className="space-y-2 bg-muted/20 p-3 rounded-xl">
                  <p className="text-foreground leading-relaxed">{selectedDispute.providerResponseText}</p>
                  {selectedDispute.providerProposedRefundAmount && selectedDispute.providerProposedRefundAmount > 0 && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-800 dark:text-emerald-300 font-medium">
                      ✓ Merchant offers <strong>{selectedDispute.providerProposedRefundAmount.toLocaleString()} DA</strong> amicable settlement.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-muted/20 rounded-xl text-muted-foreground flex items-center justify-between">
                  <span>Waiting for provider statement...</span>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatusOnly('WAITING_PROVIDER')} className="h-7 text-[11px] rounded-lg">
                    Request Statement
                  </Button>
                </div>
              )}
            </div>

            {/* Dispute Activity Timeline */}
            <div className="p-4 bg-card border rounded-2xl space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Dispute Activity Timeline
              </span>
              <div className="space-y-3 border-l-2 border-primary/30 pl-4 ml-2 py-1 text-xs">
                {selectedDispute.timeline.map((tl) => (
                  <div key={tl.id} className="relative space-y-0.5">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{tl.eventType.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{tl.createdAt}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{tl.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Status Transition Bar */}
            <div className="p-4 bg-muted/30 border rounded-2xl space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block">
                Workflow Status Actions
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatusOnly('UNDER_REVIEW')} className="rounded-xl text-xs h-8">
                  Mark Under Review
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatusOnly('WAITING_CUSTOMER')} className="rounded-xl text-xs h-8">
                  Wait Customer Evidence
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatusOnly('WAITING_PROVIDER')} className="rounded-xl text-xs h-8">
                  Wait Provider Statement
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatusOnly('CLOSED')} className="rounded-xl text-xs h-8 text-rose-600">
                  Close Dispute
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminDetailDrawer>

      {/* Interactive Dispute Arbitration Modal */}
      <Dialog open={isArbitrationModalOpen} onOpenChange={setIsArbitrationModalOpen}>
        <DialogContent className="sm:max-w-[560px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-600 flex items-center gap-2">
              <Gavel className="h-5 w-5" /> Execute Dispute Arbitration
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ruling on case <strong>{selectedDispute?.disputeNumber}</strong> (Order {selectedDispute?.orderNumber} • {selectedDispute?.disputedAmount.toLocaleString()} DA in Escrow).
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <form onSubmit={handleExecuteArbitration} className="space-y-4 py-2 text-xs">
              
              {/* Arbitration Action Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Binding Resolution Action *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => handleActionChange('FULL_REFUND_CUSTOMER')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${resolutionAction === 'FULL_REFUND_CUSTOMER' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted/40'}`}
                  >
                    <span className="font-bold block text-foreground">100% Full Refund</span>
                    <span className="text-[10px] text-muted-foreground">Refund buyer full {selectedDispute.disputedAmount.toLocaleString()} DA</span>
                  </div>

                  <div
                    onClick={() => handleActionChange('PARTIAL_REFUND_SPLIT')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${resolutionAction === 'PARTIAL_REFUND_SPLIT' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted/40'}`}
                  >
                    <span className="font-bold block text-foreground">Partial Refund Split</span>
                    <span className="text-[10px] text-muted-foreground">Custom DA allocation between parties</span>
                  </div>

                  <div
                    onClick={() => handleActionChange('RELEASE_TO_PROVIDER')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${resolutionAction === 'RELEASE_TO_PROVIDER' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted/40'}`}
                  >
                    <span className="font-bold block text-foreground">Release to Store</span>
                    <span className="text-[10px] text-muted-foreground">Disburse 100% funds to merchant</span>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown Calculator */}
              {resolutionAction === 'PARTIAL_REFUND_SPLIT' && (
                <div className="p-4 bg-muted/40 border rounded-xl space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Settlement Split Amounts (Total: {selectedDispute.disputedAmount.toLocaleString()} DA)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Customer Refund (DA)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={selectedDispute.disputedAmount}
                        value={customerRefundInput}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCustomerRefundInput(val);
                          setProviderPayoutInput(Math.max(0, selectedDispute.disputedAmount - val));
                        }}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-primary">Provider Payout (DA)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={selectedDispute.disputedAmount}
                        value={providerPayoutInput}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setProviderPayoutInput(val);
                          setCustomerRefundInput(Math.max(0, selectedDispute.disputedAmount - val));
                        }}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mediator Rationale Textarea */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mediator Legal / Platform Rationale *</Label>
                <Textarea
                  placeholder="Explain why this ruling was made based on evidence and platform policy..."
                  value={mediatorNotesInput}
                  onChange={(e) => setMediatorNotesInput(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                ⚖️ <strong>Financial Impact:</strong> Executing this arbitration will perform atomic double-entry ledger settlement and release/refund escrow funds immediately.
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsArbitrationModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isExecutingArbitration}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {isExecutingArbitration ? 'Executing Settlement...' : 'Execute Binding Ruling'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
