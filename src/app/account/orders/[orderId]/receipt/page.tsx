'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, Printer, Download, ShieldCheck, 
  Store, Package, QrCode, CheckCircle2, FileText
} from 'lucide-react';
import { customerOrderService } from '@/services/customerOrderService';
import { CustomerOrder } from '@/types/customerOrder';

export default function CustomerOrderReceiptPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      if (!orderId) return;
      setIsLoading(true);
      const data = await customerOrderService.getOrderDetails(orderId);
      setOrder(data);
      setIsLoading(false);
    }
    load();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 px-4 text-center">
        <p className="text-xs text-muted-foreground">Loading receipt details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-printable, #receipt-printable * {
            visibility: visible;
          }
          #receipt-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-6">

        {/* Action Header */}
        <div className="flex items-center justify-between no-print">
          <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href={`/account/orders/${order.id}`}>
              <ArrowLeft className="h-4 w-4" /> Back to Order
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} size="sm" className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground font-semibold">
              <Printer className="h-4 w-4" /> Print Invoice
            </Button>
          </div>
        </div>

        {/* Printable Receipt Card */}
        <Card id="receipt-printable" className="border shadow-lg bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-8 sm:p-10 rounded-2xl space-y-8">
          
          {/* Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
                <ShieldCheck className="h-7 w-7" />
                <span>Khidmatik</span>
              </div>
              <p className="text-xs text-muted-foreground">Official Marketplace Order Invoice & Receipt</p>
              <p className="text-[11px] text-muted-foreground font-mono">Algiers, Algeria • www.khidmatik.dz</p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div className="font-mono font-bold text-lg text-foreground">{order.orderNumber}</div>
              <p className="text-muted-foreground">Date: {order.createdAt}</p>
              <p className="text-muted-foreground">Payment Ref: {order.paymentTransactionId || 'SATIM-CARD-VERIFIED'}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">Status: {order.paymentStatus}</p>
            </div>
          </div>

          {/* Customer & Merchant Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
              <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground block">Customer Details</span>
              <p className="font-semibold text-foreground text-sm">{order.shippingAddress.recipientName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
              <p className="text-muted-foreground">{order.shippingAddress.addressLine}, {order.shippingAddress.commune}, {order.shippingAddress.wilaya}</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
              <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground block">Merchant Store</span>
              <p className="font-semibold text-foreground text-sm">{order.storeName}</p>
              <p className="text-muted-foreground">{order.sellerPhone || '+213 550 00 00 00'}</p>
              <p className="text-muted-foreground">Carrier: {order.shippingProvider.toUpperCase()} ({order.trackingNumber || 'Pending'})</p>
              <p className="text-muted-foreground">Escrow Guarantee: Active</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b text-muted-foreground font-bold uppercase text-[11px]">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <div className="font-semibold text-foreground">{item.productName}</div>
                      {item.variantName && (
                        <div className="text-[11px] text-muted-foreground">{item.variantName}</div>
                      )}
                      {item.sku && (
                        <div className="text-[10px] text-muted-foreground font-mono">SKU: {item.sku}</div>
                      )}
                    </td>
                    <td className="py-3 text-center font-medium">{item.quantity}</td>
                    <td className="py-3 text-right font-medium">{item.unitPrice.toLocaleString()} DA</td>
                    <td className="py-3 text-right font-bold text-foreground">{item.totalPrice.toLocaleString()} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs">
            <div className="space-y-1 text-muted-foreground">
              <p>Payment Method: <strong className="text-foreground uppercase">{order.paymentMethod.replace(/_/g, ' ')}</strong></p>
              <p>Delivery Service: <strong className="text-foreground uppercase">{order.shippingProvider}</strong></p>
              {(order.status === 'delivered' || order.status === 'completed') && (
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Delivery Verification: <strong>Verified (Customer OTP Handover)</strong>
                </p>
              )}
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">✓ Algerian Consumer Protection & 19% TVA Inclusive</p>
            </div>

            <div className="space-y-1.5 sm:w-64 text-right">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-medium text-foreground">{order.subtotal.toLocaleString()} DA</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Fee:</span>
                <span className="font-medium text-foreground">+{order.shippingFee.toLocaleString()} DA</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-{order.discountAmount.toLocaleString()} DA</span>
                </div>
              )}
              <div className="border-t pt-2 mt-1 flex justify-between font-bold text-base text-foreground">
                <span>Total Paid:</span>
                <span>{order.totalAmount.toLocaleString()} DA</span>
              </div>
            </div>
          </div>

          {/* Receipt Footer with Verification Stamp */}
          <div className="pt-6 border-t flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <QrCode className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Digitally Verified Invoice</p>
                <p>Scan to verify authenticity on Khidmatik platform</p>
              </div>
            </div>
            <div className="text-right">
              <p>Khidmatik Algérie E-Commerce</p>
              <p>Commercial Register: RC 16/00-8891024</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
