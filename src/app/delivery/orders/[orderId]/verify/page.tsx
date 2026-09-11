'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, ShieldCheck, MapPin, Phone, CheckCircle2, 
  AlertTriangle, KeyRound, ArrowLeft, Package, User, Store, Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';
import { customerOrderService } from '@/services/customerOrderService';
import { CustomerOrder } from '@/types/customerOrder';
import { cn } from '@/lib/utils';

export default function DeliveryVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    success?: boolean;
    error?: string;
    remainingAttempts?: number;
    isLocked?: boolean;
    verifiedAt?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function load() {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const data = await customerOrderService.getOrderDetails(orderId);
        setOrder(data);
        if (data && (data.status === 'delivered' || data.status === 'completed')) {
          setVerificationResult({
            success: true,
            verifiedAt: data.deliveredAt || data.updatedAt,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [orderId]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setVerificationResult(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      toast({ title: 'Invalid Code', description: 'Please enter all 6 digits of the delivery code.', variant: 'destructive' });
      return;
    }

    if (!order) return;

    setIsVerifying(true);
    try {
      const res = await deliveryVerificationService.verifyDeliveryCode({
        orderId: order.id,
        code,
        agentId: 'agt_yalidine_01',
        agentRole: 'DELIVERY_AGENT',
        agentName: 'Mourad (Yalidine Courier)',
      });

      setVerificationResult(res);

      if (res.success) {
        toast({
          title: 'Delivery Verified! 🎉',
          description: `Order ${order.orderNumber} is confirmed as delivered.`,
        });
        // Reload order state
        const updated = await customerOrderService.getOrderDetails(order.id);
        if (updated) setOrder(updated);
      } else {
        toast({
          title: 'Verification Failed',
          description: res.error || 'Incorrect code.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 px-4 max-w-md mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-card rounded-xl" />
        <div className="h-64 bg-card rounded-2xl border" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/20 py-16 px-4 text-center">
        <Card className="max-w-md mx-auto p-8 rounded-2xl shadow-sm space-y-4">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested order does not exist or has invalid assignment.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-6">

        {/* Courier Portal Header Banner */}
        <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Yalidine Courier Delivery Portal</span>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold bg-background">
            Agent #892
          </Badge>
        </div>

        {/* Parcel Information Summary */}
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <div className="p-4 bg-muted/30 border-b flex items-center justify-between text-xs">
            <div className="font-mono font-bold text-foreground">{order.orderNumber}</div>
            <Badge variant="default" className="text-[10px] uppercase font-bold">
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground block text-sm">{order.shippingAddress.recipientName}</span>
                <a
                  href={`tel:${order.shippingAddress.phone}`}
                  className="text-primary font-mono font-semibold flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" /> {order.shippingAddress.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium">{order.shippingAddress.addressLine}</p>
                <p>{order.shippingAddress.commune}, {order.shippingAddress.wilaya}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t text-muted-foreground">
              <Package className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium">
                  {order.items.length} item(s) • Total: <strong className="text-foreground">{order.totalAmount.toLocaleString()} DA</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Payment: {order.paymentStatus.toUpperCase()} ({order.paymentMethod.toUpperCase()})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery OTP Verification Card */}
        <Card className="border-2 border-primary/30 shadow-lg bg-card rounded-2xl p-6 space-y-6">
          
          <div className="text-center space-y-1">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Enter Customer Delivery OTP</h2>
            <p className="text-xs text-muted-foreground">
              Ask the recipient for their 6-digit code upon physical handover.
            </p>
          </div>

          {verificationResult?.success ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  Delivery Confirmed!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verified at {verificationResult.verifiedAt || 'Just now'}
                </p>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                Order marked as delivered. Buyer Protection initiated.
              </p>
              <Button asChild size="sm" className="rounded-xl w-full">
                <Link href="/marketplace">Return to Deliveries</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              
              {/* 6-Digit Inputs Grid */}
              <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isVerifying || verificationResult?.isLocked}
                    className={cn(
                      "w-12 h-14 text-center text-2xl font-bold font-mono rounded-xl border-2 bg-background transition-all",
                      digit ? "border-primary text-primary shadow-sm" : "border-muted-foreground/30",
                      verificationResult?.error && "border-destructive text-destructive animate-shake"
                    )}
                  />
                ))}
              </div>

              {/* Error & Warning Banners */}
              {verificationResult?.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{verificationResult.error}</p>
                    {verificationResult.remainingAttempts !== undefined && verificationResult.remainingAttempts > 0 && (
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {verificationResult.remainingAttempts} attempt(s) remaining before security lockout.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isVerifying || digits.join('').length !== 6 || verificationResult?.isLocked}
                className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              >
                {isVerifying ? 'Verifying OTP...' : 'Verify Delivery Handover'}
              </Button>
            </form>
          )}
        </Card>

        {/* Security Notice Footer */}
        <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
          🔒 Verification attempts and GPS coordinates are audited under Khidmatik Carrier Security Policy.
        </p>
      </div>
    </div>
  );
}
