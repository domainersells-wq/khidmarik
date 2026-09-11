'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  ArrowLeft, Package, Truck, ShieldCheck, MapPin, Phone, 
  CreditCard, Clock, CheckCircle2, RotateCcw, Ban, Store, 
  Receipt, MessageSquare, ExternalLink, Check, Copy, AlertCircle,
  Eye, EyeOff, KeyRound, ShieldAlert, RefreshCw, DollarSign, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { customerOrderService } from '@/services/customerOrderService';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';
import { rejectionCostAllocationService } from '@/services/rejectionCostAllocationService';
import { privateDeliveryCodeService } from '@/services/privateDeliveryCodeService';
import { escrowDisputeService } from '@/services/escrowDisputeService';
import { CustomerOrder, CustomerOrderStatus } from '@/types/customerOrder';
import { CustomerDeliveryCodeView } from '@/types/deliveryVerification';
import { CostAllocationCalculationResult, RejectionFinancialRule } from '@/types/rejectionCostAllocation';
import { PrivateDeliveryCodeView, DeliveryInspectionSession } from '@/types/privateDeliveryCode';
import { DisputeReasonCode, PlatformDisputeRecord } from '@/types/escrowDispute';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [privateCodeData, setPrivateCodeData] = useState<PrivateDeliveryCodeView | null>(null);
  const [inspectionSession, setInspectionSession] = useState<DeliveryInspectionSession | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(600);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [hasAcceptedProduct, setHasAcceptedProduct] = useState<boolean>(false);
  const [showConfirmationCode, setShowConfirmationCode] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfirmReceiptOpen, setIsConfirmReceiptOpen] = useState<boolean>(false);

  // Rejection State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('changed_mind');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [rejectionPreview, setRejectionPreview] = useState<CostAllocationCalculationResult | null>(null);
  const [agreedToCharges, setAgreedToCharges] = useState<boolean>(false);
  const [isSubmittingRejection, setIsSubmittingRejection] = useState<boolean>(false);

  // Escrow & Dispute State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [disputeReason, setDisputeReason] = useState<DisputeReasonCode>('DAMAGED_ITEMS');
  const [disputeDescription, setDisputeDescription] = useState<string>('');
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState<string>('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState<boolean>(false);
  const [activeDispute, setActiveDispute] = useState<PlatformDisputeRecord | null>(null);
  const [isEarlyReleasing, setIsEarlyReleasing] = useState<boolean>(false);

  const loadOrder = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const data = await customerOrderService.getOrderDetails(orderId);
      setOrder(data);
      if (data) {
        const privInfo = await privateDeliveryCodeService.getCustomerPrivateCode(data.id, 'usr_1');
        setPrivateCodeData(privInfo);
        if (privInfo?.inspectionSession) {
          setInspectionSession(privInfo.inspectionSession);
          setCountdownSeconds(privInfo.inspectionSession.remainingSeconds || 600);
          if (privInfo.inspectionSession.status === 'inspecting') {
            setIsInspecting(true);
          } else if (privInfo.inspectionSession.status === 'accepted' || data.status === 'delivered' || data.status === 'completed') {
            setHasAcceptedProduct(true);
          }
        }
        // Check active dispute
        const dispute = escrowDisputeService.getDisputeById(data.id);
        setActiveDispute(dispute);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleEarlyReleaseFunds = async () => {
    if (!order) return;
    setIsEarlyReleasing(true);
    try {
      const res = await escrowDisputeService.earlyReleaseFunds(order.id, 'usr_1', 'Customer satisfied - early release');
      if (res.success) {
        toast({
          title: 'Escrow Funds Released! 💸',
          description: res.message,
        });
        loadOrder();
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsEarlyReleasing(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!disputeDescription.trim()) {
      toast({ title: 'Description Required', description: 'Please explain your claim in detail.', variant: 'destructive' });
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const res = await escrowDisputeService.openDispute({
        orderId: order.id,
        customerId: 'usr_1',
        customerName: order.shippingAddress.recipientName,
        reasonCode: disputeReason,
        claimDescription: disputeDescription,
        evidenceUrls: disputeEvidenceUrl ? [disputeEvidenceUrl] : [],
      });

      if (res.success && res.dispute) {
        toast({
          title: 'Dispute Claim Opened 🛡️',
          description: `Dispute ${res.dispute.disputeNumber} submitted. Escrow funds have been locked.`,
        });
        setIsDisputeModalOpen(false);
        setDisputeDescription('');
        setDisputeEvidenceUrl('');
        loadOrder();
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Inspection Countdown Timer Ticker
  useEffect(() => {
    let interval: any = null;
    if (isInspecting && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsInspecting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInspecting, countdownSeconds]);

  const handleStartInspection = async () => {
    if (!order) return;
    const session = await privateDeliveryCodeService.startInspectionSession(order.id, 'usr_1');
    setInspectionSession(session);
    setCountdownSeconds(session.durationMinutes * 60);
    setIsInspecting(true);
    toast({
      title: 'Inspection Session Started ⏱️',
      description: `You have ${session.durationMinutes} minutes to inspect your package before providing the confirmation code.`,
    });
  };

  const handleAcceptProduct = async () => {
    if (!order) return;
    await privateDeliveryCodeService.recordInspectionDecision(order.id, 'accepted');
    setIsInspecting(false);
    setHasAcceptedProduct(true);
    toast({
      title: 'Product Accepted ✓',
      description: 'You can now reveal your Private Delivery Confirmation Code for the courier.',
    });
  };

  const handleConfirmReceipt = async () => {
    if (!order) return;
    const res = await customerOrderService.confirmReceipt(order.id, 'Karim Hadjadj');
    if (res.success) {
      toast({
        title: 'Receipt Confirmed! 🎉',
        description: `Order ${order.orderNumber} is now marked as Completed.`,
      });
      setIsConfirmReceiptOpen(false);
      loadOrder();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const handleRegenerateCode = async () => {
    if (!order) return;
    setIsRegenerating(true);
    try {
      const res = await deliveryVerificationService.regenerateDeliveryCode(order.id, 'usr_1');
      if (res.success && res.data) {
        setPrivateCodeData({
          orderId: order.id,
          orderNumber: order.orderNumber,
          code: res.data.code,
          isMasked: false,
          status: res.data.status,
          inspectionSession: inspectionSession || {
            status: 'not_started',
            durationMinutes: 10,
            remainingSeconds: 600,
            isExpired: false,
          },
          attemptsRemaining: Math.max(0, res.data.maxAttempts - res.data.attempts),
          maxAttempts: res.data.maxAttempts,
          canRegenerate: res.data.canRegenerate,
          verifiedAt: res.data.verifiedAt,
        });
        setShowConfirmationCode(true);
        toast({
          title: 'Confirmation Code Regenerated',
          description: 'A new 6-digit PIN has been generated. The previous code is now invalid.',
        });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to regenerate code', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyDeliveryCode = () => {
    if (!privateCodeData?.code) return;
    navigator.clipboard.writeText(privateCodeData.code);
    toast({ title: 'Confirmation Code Copied', description: privateCodeData.code });
  };

  const copyTracking = () => {
    if (!order?.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    toast({ title: 'Tracking # Copied', description: order.trackingNumber });
  };

  const handleOpenRejectModal = () => {
    if (!order) return;
    const initialPreview = rejectionCostAllocationService.calculateCostAllocation(
      order,
      rejectionReason,
      (order as any).sellerSubscriptionPlan || 'pro'
    );
    setRejectionPreview(initialPreview);
    setIsRejectModalOpen(true);
  };

  const handleRejectionReasonChange = (reason: string) => {
    setRejectionReason(reason);
    if (!order) return;
    const preview = rejectionCostAllocationService.calculateCostAllocation(
      order,
      reason,
      (order as any).sellerSubscriptionPlan || 'pro'
    );
    setRejectionPreview(preview);
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!agreedToCharges) {
      toast({
        title: 'Agreement Required',
        description: 'Please confirm that you understand the applicable rejection charges.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingRejection(true);
    try {
      const res = await rejectionCostAllocationService.submitOrderRejection({
        orderId: order.id,
        customerId: 'usr_1',
        reasonCode: rejectionReason,
        customerNotes: rejectionNotes,
      });

      if (res.success) {
        toast({
          title: 'Product Rejection Recorded',
          description: `Order ${order.orderNumber} status updated to Delivery Rejected. Refund processed according to policy.`,
        });
        setIsRejectModalOpen(false);
        loadOrder();
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-48 bg-card rounded-xl" />
          <div className="h-64 bg-card rounded-2xl border" />
          <div className="h-64 bg-card rounded-2xl border" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/20 py-16 px-4 text-center">
        <Card className="max-w-md mx-auto p-8 rounded-2xl shadow-sm space-y-4">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested order does not exist or has been removed.</p>
          <Button asChild className="rounded-xl">
            <Link href="/account/orders">Back to My Orders</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Visual Timeline Steps
  const timelineStages = [
    { key: 'placed', label: 'Order Placed', isCompleted: true },
    { key: 'paid', label: 'Payment Verified', isCompleted: order.status !== 'pending_payment' },
    { key: 'processing', label: 'Processing', isCompleted: !['pending_payment', 'paid'].includes(order.status) },
    { key: 'shipped', label: 'Dispatched', isCompleted: ['shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed'].includes(order.status) },
    { key: 'delivered', label: 'Delivered', isCompleted: ['delivered', 'completed'].includes(order.status) },
    { key: 'completed', label: 'Completed', isCompleted: order.status === 'completed' },
  ];

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/account/orders">
              <ArrowLeft className="h-4 w-4" /> Back to My Orders
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
            <Link href={`/account/orders/${order.id}/receipt`}>
              <Receipt className="h-3.5 w-3.5" /> Printable Invoice
            </Link>
          </Button>
        </div>

        {/* Order Header Card */}
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/5 via-card to-card border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                  {order.orderNumber}
                </h1>
                <Badge variant="default" className="text-xs font-bold uppercase">
                  {order.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Placed on {order.createdAt} • Store:{' '}
                <strong className="text-foreground">{order.storeName}</strong>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(order.status) && (
                <Button asChild size="sm" className="rounded-xl text-xs h-9 font-medium">
                  <Link href={`/account/orders/${order.id}/tracking`}>
                    <Truck className="h-3.5 w-3.5 mr-1.5" /> Live Carrier Tracking
                  </Link>
                </Button>
              )}

              {['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(order.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs h-9 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  onClick={handleOpenRejectModal}
                >
                  <Ban className="h-3.5 w-3.5 mr-1.5" /> Reject Product
                </Button>
              )}

              {order.status === 'delivered' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 font-semibold"
                  onClick={() => setIsConfirmReceiptOpen(true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Confirm Receipt
                </Button>
              )}
            </div>
          </div>

          {/* Visual Order Timeline Stepper */}
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Order Progress Timeline
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center py-2">
              {timelineStages.map((st, idx) => (
                <div key={st.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      st.isCompleted
                        ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground border"
                    )}
                  >
                    {st.isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={cn("text-[11px] font-semibold", st.isCompleted ? "text-foreground" : "text-muted-foreground")}>
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Private Delivery Confirmation & Physical Inspection Session Card */}
        {privateCodeData && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    Private Delivery Confirmation Code
                    {privateCodeData.status === 'verified' && (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ✓ Delivery Verified
                      </Badge>
                    )}
                    {privateCodeData.status === 'locked' && (
                      <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Locked
                      </Badge>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Secret customer code for physical parcel handover
                  </p>
                </div>
              </div>

              {privateCodeData.canRegenerate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerateCode}
                  disabled={isRegenerating}
                  className="rounded-xl text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRegenerating && "animate-spin")} />
                  Regenerate Code
                </Button>
              )}
            </div>

            {privateCodeData.status === 'verified' ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold">Delivery Verified Successfully</p>
                  <p className="text-[11px] opacity-90">
                    Handover verified on <strong>{privateCodeData.verifiedAt || order.deliveredAt || 'recently'}</strong> via Private Delivery OTP.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Physical Inspection Session Banner */}
                <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" /> Delivery Inspection Session
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Inspect your order before providing the confirmation code to the courier.
                      </p>
                    </div>

                    {isInspecting ? (
                      <Badge variant="outline" className="font-mono text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 shrink-0">
                        ⏱️ Inspection Timer: {Math.floor(countdownSeconds / 60).toString().padStart(2, '0')}:{(countdownSeconds % 60).toString().padStart(2, '0')}
                      </Badge>
                    ) : hasAcceptedProduct ? (
                      <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full shrink-0">
                        ✓ Product Accepted
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={handleStartInspection} className="rounded-xl text-xs h-8">
                        Start Delivery Inspection (10 min)
                      </Button>
                    )}
                  </div>

                  {/* Inspection Decision Buttons */}
                  {isInspecting && (
                    <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                      <Button
                        size="sm"
                        onClick={handleAcceptProduct}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8 font-semibold"
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" /> Accept Product & Reveal Code
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenRejectModal}
                        className="rounded-xl text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Ban className="h-3.5 w-3.5 mr-1.5" /> Reject Product
                      </Button>
                    </div>
                  )}
                </div>

                {/* Secret Confirmation Code Box (Hidden by Default) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-background border rounded-xl shadow-inner">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Private Delivery Confirmation Code
                    </span>
                    <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-primary flex items-center gap-2">
                      {showConfirmationCode ? (
                        <span>{privateCodeData.code}</span>
                      ) : (
                        <span className="tracking-[0.3em]">••••••</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowConfirmationCode(!showConfirmationCode)}
                      className="rounded-xl text-xs h-9 font-medium"
                    >
                      {showConfirmationCode ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide Code
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> Show Confirmation Code
                        </>
                      )}
                    </Button>

                    {showConfirmationCode && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          navigator.clipboard.writeText(privateCodeData.code);
                          toast({ title: 'Confirmation Code Copied', description: privateCodeData.code });
                        }}
                        className="rounded-xl text-xs h-9 font-semibold"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Code
                      </Button>
                    )}
                  </div>
                </div>

                {/* Prominent Security Warning */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="leading-relaxed">
                    <strong>Security Warning:</strong> Only show this code to the delivery agent <em>after</em> you have physically received and inspected your order.
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Active Dispute Banner (If Disputed) */}
        {activeDispute && (
          <Card className="border-2 border-amber-500/40 bg-amber-500/10 shadow-sm rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-sm text-foreground">
                  Active Dispute Case: {activeDispute.disputeNumber}
                </span>
              </div>
              <Badge className="bg-amber-600 text-white text-xs font-bold uppercase">
                {activeDispute.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <p className="text-muted-foreground">
                <strong>Claim:</strong> {activeDispute.customerClaimDescription}
              </p>
              {activeDispute.providerResponseText && (
                <div className="p-3 bg-background/80 border rounded-xl space-y-1">
                  <span className="font-semibold text-foreground block">Merchant Response ({activeDispute.providerName}):</span>
                  <p className="text-muted-foreground">{activeDispute.providerResponseText}</p>
                  {activeDispute.providerProposedRefundAmount && activeDispute.providerProposedRefundAmount > 0 && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      Merchant proposed {activeDispute.providerProposedRefundAmount.toLocaleString()} DA partial refund credit.
                    </p>
                  )}
                </div>
              )}
              {activeDispute.mediatorNotes && (
                <p className="text-[11px] text-muted-foreground italic">
                  ⚖️ Mediator Note: {activeDispute.mediatorNotes}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Buyer Protection & Escrow Card */}
        <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-sm rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/10 pb-3">
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>Khidmatik Buyer Protection Guaranteed</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {order.protection.escrowStatus === 'held_in_escrow' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEarlyReleaseFunds}
                  disabled={isEarlyReleasing}
                  className="rounded-xl text-xs h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                >
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  {isEarlyReleasing ? 'Releasing...' : 'Release Funds Early'}
                </Button>
              )}

              {!activeDispute && order.status !== 'cancelled' && order.status !== 'refunded' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="rounded-xl text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Open Dispute
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your payment of <strong>{order.totalAmount.toLocaleString()} DA</strong> is held securely in platform escrow.
            Escrow Status:{' '}
            <strong className="text-foreground uppercase">{order.protection.escrowStatus.replace(/_/g, ' ')}</strong>
            {order.protection.protectionEndsAt && (
              <span> • Protection period active through <strong>{order.protection.protectionEndsAt}</strong></span>
            )}.
          </p>
        </Card>

        {/* Itemized Products Snapshot */}
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4 text-primary" /> Purchased Items ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted overflow-hidden shrink-0 border relative">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2">
                      {item.productName}
                    </h4>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    )}
                    {item.sku && (
                      <p className="text-[11px] text-muted-foreground font-mono">SKU: {item.sku}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} × {item.unitPrice.toLocaleString()} DA
                  </div>
                  <div className="font-bold text-foreground text-sm sm:text-base">
                    {item.totalPrice.toLocaleString()} DA
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Shipping & Payment Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Shipping Address Snapshot */}
          <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> Delivery Address Snapshot
            </h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">{order.shippingAddress.recipientName}</p>
              <p className="flex items-center gap-1 font-mono text-foreground">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {order.shippingAddress.phone}
              </p>
              <p>{order.shippingAddress.addressLine}</p>
              <p>{order.shippingAddress.commune}, {order.shippingAddress.wilaya}</p>
              <p>{order.shippingAddress.country} {order.shippingAddress.postalCode && `(${order.shippingAddress.postalCode})`}</p>
            </div>

            {order.trackingNumber && (
              <div className="pt-2 border-t text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Carrier Tracking:</span>
                <button
                  onClick={copyTracking}
                  className="font-mono font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {order.trackingNumber} <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </Card>

          {/* Payment & Financials */}
          <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary" /> Payment & Accounting
            </h3>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Payment Method:</span>
                <span className="font-semibold text-foreground uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal:</span>
                <span className="font-medium text-foreground">{order.subtotal.toLocaleString()} DA</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee:</span>
                <span className="font-medium text-foreground">+{order.shippingFee.toLocaleString()} DA</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount:</span>
                  <span>-{order.discountAmount.toLocaleString()} DA</span>
                </div>
              )}
              <div className="border-t pt-2 mt-1 flex justify-between text-base font-bold text-foreground">
                <span>Total Amount Paid:</span>
                <span>{order.totalAmount.toLocaleString()} DA</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Status History Audit */}
        <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" /> Order Activity History
          </h3>
          <div className="space-y-3 border-l-2 border-primary/30 pl-4 ml-2 py-1 text-xs">
            {order.statusHistory.map((h, idx) => (
              <div key={h.id || idx} className="relative space-y-0.5">
                <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground capitalize">{h.status.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground font-mono text-[11px]">{h.createdAt}</span>
                </div>
                <p className="text-muted-foreground">{h.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Confirm Receipt Dialog */}
      <Dialog open={isConfirmReceiptOpen} onOpenChange={setIsConfirmReceiptOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" /> Confirm Delivery Receipt?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Have you received order <strong>{order.orderNumber}</strong> in good condition? Confirming receipt will complete the transaction and release payment to <strong>{order.storeName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmReceiptOpen(false)}>
              Not Yet Received
            </Button>
            <Button onClick={handleConfirmReceipt} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Yes, Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Product & Cost Allocation Dialog */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[540px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-600 flex items-center gap-2">
              <Ban className="h-5 w-5" /> Reject Order Handover & Inspection
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rejecting order <strong>{order.orderNumber}</strong> will cancel the Delivery OTP. The package will be returned to <strong>{order.storeName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRejection} className="space-y-4 py-2 text-xs">
            
            {/* Reason Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Rejection Reason *</Label>
              <select
                value={rejectionReason}
                onChange={(e) => handleRejectionReasonChange(e.target.value)}
                className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary"
              >
                <optgroup label="Buyer Responsibility (Shipping & Fees Apply)">
                  <option value="changed_mind">Changed Mind / No Longer Needed</option>
                  <option value="ordered_by_mistake">Ordered by Mistake / Duplicate Order</option>
                  <option value="wrong_variant_selected_by_customer">Wrong Size/Variant Selected by Buyer</option>
                </optgroup>
                <optgroup label="Seller Responsibility (100% Full Refund to Buyer)">
                  <option value="wrong_product">Wrong Item / Variant Sent by Merchant</option>
                  <option value="damaged_before_shipping">Defective / Damaged Before Shipping</option>
                  <option value="product_not_as_described">Item Not as Described on Listing</option>
                </optgroup>
                <optgroup label="Courier Responsibility (Carrier Damaged)">
                  <option value="damaged_during_transport">Package Crushed / Damaged by Carrier</option>
                </optgroup>
                <optgroup label="Shared Responsibility (50/50 Split)">
                  <option value="unclear_listing">Ambiguous Listing / Mutual Misunderstanding</option>
                </optgroup>
              </select>
            </div>

            {/* Live Financial Allocation Preview */}
            {rejectionPreview && (
              <div className="p-4 bg-muted/40 rounded-xl border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    Cost Allocation & Refund Preview
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize font-semibold">
                    {rejectionPreview.category} Responsibility
                  </Badge>
                </div>

                <div className="space-y-1 text-xs border-y py-2 divide-y divide-border/50">
                  <div className="flex justify-between text-muted-foreground pb-1">
                    <span>Product Amount:</span>
                    <span className="font-medium text-foreground">{rejectionPreview.productAmount.toLocaleString()} DA</span>
                  </div>

                  {rejectionPreview.category === 'BUYER' && (
                    <>
                      <div className="flex justify-between text-rose-600 pt-1">
                        <span>Outbound & Return Shipping Deduction:</span>
                        <span>-{rejectionPreview.buyerShippingShare.toLocaleString()} DA</span>
                      </div>
                      <div className="flex justify-between text-rose-600 pt-1">
                        <span>Platform Logistics Handling Fee (10%):</span>
                        <span>-{rejectionPreview.platformShippingFee.toLocaleString()} DA</span>
                      </div>
                    </>
                  )}

                  {rejectionPreview.category === 'SHARED' && (
                    <div className="flex justify-between text-rose-600 pt-1">
                      <span>Buyer Shipping Liability (50%):</span>
                      <span>-{rejectionPreview.buyerShippingShare.toLocaleString()} DA</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold text-emerald-600 dark:text-emerald-400 pt-2">
                    <span>Estimated Refund to Customer:</span>
                    <span>{rejectionPreview.finalCustomerRefund.toLocaleString()} DA</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                  💡 {rejectionPreview.explanation}
                </p>
              </div>
            )}

            {/* Notes / Remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Detailed Remarks for Review *</Label>
              <Textarea
                placeholder="Describe why you are rejecting this package at inspection..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={2}
                required
              />
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agree-charges"
                checked={agreedToCharges}
                onChange={(e) => setAgreedToCharges(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-muted-foreground/40 text-primary focus:ring-primary"
                required
              />
              <label htmlFor="agree-charges" className="text-[11px] text-muted-foreground cursor-pointer">
                I confirm that I am refusing this delivery, and I understand the applicable rejection deductions and return policies.
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingRejection || !agreedToCharges}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isSubmittingRejection ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Open Dispute Dialog */}
      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Open Order Dispute Claim
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Filing a dispute will immediately freeze escrow payout for order <strong>{order.orderNumber}</strong> ({order.totalAmount.toLocaleString()} DA) pending mediation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitDispute} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Dispute Reason *</Label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value as DisputeReasonCode)}
                className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary"
              >
                <option value="DAMAGED_ITEMS">Damaged or Broken Items Received</option>
                <option value="WRONG_ITEMS">Wrong Product or Variant Sent</option>
                <option value="NOT_DELIVERED">Package Not Delivered / Missing Delivery</option>
                <option value="POOR_QUALITY">Quality Substantially Below Description</option>
                <option value="UNAUTHORIZED_CHARGE">Billing or Amount Discrepancy</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Detailed Description of Issue *</Label>
              <Textarea
                placeholder="Explain why you are disputing this order and the exact issue encountered..."
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Proof / Photo Evidence URL (Optional)</Label>
              <Input
                type="url"
                placeholder="https://example.com/photo_evidence.jpg"
                value={disputeEvidenceUrl}
                onChange={(e) => setDisputeEvidenceUrl(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Paste an image URL or cloud link demonstrating the issue.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
              💡 <strong>Arbitration Notice:</strong> The merchant will have 48 hours to submit a statement or offer an amicable partial refund before platform arbiters make a final binding ruling.
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingDispute}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute Claim'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
