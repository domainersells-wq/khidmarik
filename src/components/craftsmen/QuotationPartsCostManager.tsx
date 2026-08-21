'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Wrench, 
  PackagePlus, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Percent, 
  Download, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Receipt,
  BellRing
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { QuotationDetails, SparePartItem } from '@/types/craftsmen';

interface QuotationPartsCostManagerProps {
  quotation: QuotationDetails;
  onUpdateQuotation: (updated: QuotationDetails) => void;
  userRole: 'craftsman' | 'customer' | 'admin';
  orderId: string;
  customerName: string;
  craftsmanName: string;
  isLocked?: boolean;
}

export function QuotationPartsCostManager({
  quotation,
  onUpdateQuotation,
  userRole,
  orderId,
  customerName,
  craftsmanName,
  isLocked = false
}: QuotationPartsCostManagerProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'labor' | 'parts' | 'invoice'>('labor');
  
  // Add Part Modal State
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartPrice, setNewPartPrice] = useState<number>(1200);
  const [newPartQuantity, setNewPartQuantity] = useState<number>(1);
  const [newPartReceiptPhoto, setNewPartReceiptPhoto] = useState<string>('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60');
  const [isReceiptAttached, setIsReceiptAttached] = useState(true);

  // Customer Approval Modal for a specific part
  const [reviewingPart, setReviewingPart] = useState<SparePartItem | null>(null);

  // Financial Calculations
  const totalLaborCost = quotation.laborCostDA + quotation.emergencySurgeFeeDA;
  const approvedParts = quotation.spareParts.filter(p => p.status === 'approved');
  const pendingParts = quotation.spareParts.filter(p => p.status === 'pending_approval');
  const totalApprovedPartsCost = approvedParts.reduce((sum, p) => sum + (p.priceDA * p.quantity), 0);
  const totalPendingPartsCost = pendingParts.reduce((sum, p) => sum + (p.priceDA * p.quantity), 0);
  
  const subtotalDA = totalLaborCost + totalApprovedPartsCost;
  const platformCommissionDA = Math.round(subtotalDA * quotation.platformCommissionRate);
  const netPayableDA = subtotalDA;

  const handleAddSparePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || newPartPrice <= 0) {
      toast({ title: isAr ? 'يرجى إدخال بيانات القطعة بشكل صحيح' : 'Invalid part data', variant: 'destructive' });
      return;
    }

    const newItem: SparePartItem = {
      id: `PART-${Date.now().toString().slice(-6)}`,
      name: newPartName.trim(),
      nameAr: newPartName.trim(),
      priceDA: Number(newPartPrice),
      quantity: Number(newPartQuantity),
      receiptPhotoUrl: newPartReceiptPhoto,
      receiptThumbnail: newPartReceiptPhoto,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending_approval'
    };

    const updatedParts = [...quotation.spareParts, newItem];
    onUpdateQuotation({
      ...quotation,
      spareParts: updatedParts
    });

    setIsAddPartOpen(false);
    setNewPartName('');
    setNewPartPrice(1500);

    toast({
      title: isAr ? 'تم إرسال طلب اعتماد قطعة الغيار للعميل' : 'Spare Part Sent for Approval',
      description: isAr ? 'تلقى العميل إشعاراً فورياً مع صورة الفاتورة للموافقة الرقمية بنقرة واحدة.' : 'Customer received push notification with invoice receipt photo.'
    });
  };

  const handleCustomerApprovePart = (partId: string, approve: boolean) => {
    const updated = quotation.spareParts.map(p => {
      if (p.id === partId) {
        return {
          ...p,
          status: approve ? ('approved' as const) : ('rejected' as const)
        };
      }
      return p;
    });

    onUpdateQuotation({
      ...quotation,
      spareParts: updated
    });

    setReviewingPart(null);

    toast({
      title: approve 
        ? (isAr ? '✓ تم اعتماد شراء وتركيب القطعة' : '✓ Spare Part Approved')
        : (isAr ? '✕ تم رفض القطعة' : '✕ Spare Part Rejected'),
      description: approve 
        ? (isAr ? 'تم تحديث فاتورة العمل وإشعار الحرفي بالبدء في التركيب.' : 'Updated quotation invoice and notified craftsman.')
        : (isAr ? 'تم إشعار الحرفي برفض شراء هذه القطعة.' : 'Craftsman notified.')
    });
  };

  const handleDownloadInvoicePDF = () => {
    toast({
      title: isAr ? '📄 جاري تحميل الفاتورة الرسمية (PDF)' : '📄 Downloading Official Invoice PDF',
      description: isAr ? `تم إنشاء فاتورة مفصلة للطلب #${orderId} تحتوي على وصولات قطع الغيار المعتمدة.` : `Invoice generated for #${orderId}`
    });
  };

  return (
    <Card className="shadow-md border overflow-hidden">
      {/* Header Tabs */}
      <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {isAr ? 'نظام التسعير وقطع الغيار الشفاف' : 'Quotation & Parts Cost System'}
              </CardTitle>
              {pendingParts.length > 0 && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] animate-pulse">
                  {pendingParts.length} {isAr ? 'بانتظار الموافقة' : 'Pending Approval'}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">
              {isAr 
                ? 'فصل دقيق بين تكلفة اليد العاملة وأسعار المواد مع إرفاق صور الفواتير والموافقة المسبقة' 
                : 'Transparent separation between labor fees and spare parts with receipt proof'}
            </CardDescription>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground block">{isAr ? 'الإجمالي المستحق حالياً:' : 'Current Net Total:'}</span>
            <span className="text-xl font-black text-primary font-mono">{netPayableDA.toLocaleString()} DA</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="labor" className="text-xs font-bold flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              {isAr ? 'أتعاب اليد العاملة' : 'Labor Cost'}
            </TabsTrigger>
            <TabsTrigger value="parts" className="text-xs font-bold flex items-center gap-1.5 relative">
              <PackagePlus className="h-3.5 w-3.5" />
              {isAr ? 'قطع الغيار والمواد' : 'Spare Parts & Materials'}
              {pendingParts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {pendingParts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoice" className="text-xs font-bold flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {isAr ? 'الفاتورة التجميعية (PDF)' : 'Itemized Invoice'}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: LABOR COST */}
          <TabsContent value="labor" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">{isAr ? 'أتعاب الصيانة المتفق عليها:' : 'Base Agreed Labor:'}</span>
                  <Badge variant="outline">{quotation.laborType === 'fixed_quote' ? (isAr ? 'سعر ثابت' : 'Fixed Quote') : (isAr ? 'بالساعة' : 'Hourly')}</Badge>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {quotation.laborCostDA.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">DA</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isAr ? 'تشمل التشخيص، الفك، الإصلاح والتجربة الميدانية' : 'Includes diagnosis, disassembly, fix & test'}
                </p>
              </div>

              {quotation.emergencySurgeFeeDA > 0 && (
                <div className="p-4 rounded-xl border border-red-200 dark:border-red-950 bg-red-50/40 dark:bg-red-950/20 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-red-700 dark:text-red-400 font-bold">{isAr ? 'علاوة الطوارئ والاستجابة الفورية:' : 'Emergency SOS Surge Fee:'}</span>
                    <Badge className="bg-red-600 text-white text-[10px]">SOS Priority</Badge>
                  </div>
                  <div className="text-2xl font-black text-red-600 font-mono">
                    +{quotation.emergencySurgeFeeDA.toLocaleString()} <span className="text-xs font-bold text-red-400">DA</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? 'تسعيرة التدخل السريع خارج أوقات العمل الرسمية' : 'Guaranteed priority response fee'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: SPARE PARTS & MATERIALS */}
          <TabsContent value="parts" className="space-y-4 pt-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  {isAr ? 'قائمة قطع الغيار المشتراة والمواد المستهلكة:' : 'Itemized Parts & Material Invoices:'}
                </h4>
              </div>

              {(userRole === 'craftsman' || userRole === 'admin') && !isLocked && (
                <Button
                  size="sm"
                  onClick={() => setIsAddPartOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isAr ? 'إضافة فاتورة قطعة غيار' : 'Add Spare Part Invoice'}
                </Button>
              )}
            </div>

            {quotation.spareParts.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                <PackagePlus className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'لم يتم تسجيل أي قطع غيار إضافية حتى الآن.' : 'No spare parts added to this job yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {quotation.spareParts.map((part) => (
                  <div
                    key={part.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                      part.status === 'approved' 
                        ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10' 
                        : part.status === 'pending_approval' 
                        ? 'border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20' 
                        : 'border-rose-200 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Receipt Thumbnail with Click-to-Zoom */}
                      {part.receiptPhotoUrl ? (
                        <button
                          type="button"
                          onClick={() => setReviewingPart(part)}
                          className="relative h-14 w-14 rounded-lg overflow-hidden border bg-black group shrink-0"
                          title={isAr ? 'عرض صورة وصل الفاتورة' : 'View receipt'}
                        >
                          <img 
                            src={part.receiptPhotoUrl} 
                            alt={part.name} 
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                            <Eye className="h-4 w-4" />
                          </div>
                        </button>
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground shrink-0">
                          <Receipt className="h-6 w-6" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white">{part.name}</h5>
                          <Badge 
                            className={`text-[9px] px-2 py-0.5 font-bold ${
                              part.status === 'approved' 
                                ? 'bg-emerald-600 text-white' 
                                : part.status === 'pending_approval' 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {part.status === 'approved' 
                              ? (isAr ? '✓ معتمدة من العميل' : '✓ Approved') 
                              : part.status === 'pending_approval' 
                              ? (isAr ? '⏳ بانتظار موافقة العميل' : '⏳ Pending Approval') 
                              : (isAr ? '✕ مرفوضة' : '✕ Rejected')}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {isAr ? `الكمية: ${part.quantity} | أضيفت: ${part.addedAt}` : `Qty: ${part.quantity} | Added: ${part.addedAt}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {(part.priceDA * part.quantity).toLocaleString()} DA
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          ({part.priceDA} DA {isAr ? 'للقطعة' : 'each'})
                        </span>
                      </div>

                      {/* Customer Actions on pending parts */}
                      {userRole === 'customer' && part.status === 'pending_approval' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleCustomerApprovePart(part.id, true)}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            {isAr ? 'موافقة' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCustomerApprovePart(part.id, false)}
                            className="h-8 border-rose-300 text-rose-600 hover:bg-rose-50 text-xs px-2"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: ITEMIZED INVOICE & PDF BREAKDOWN */}
          <TabsContent value="invoice" className="space-y-4 pt-3">
            <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {isAr ? 'فاتورة الخدمة وقطع الغيار الرسمية' : 'Official Service & Parts Invoice'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Order #{orderId} • {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-primary text-primary-foreground font-mono">
                  KHIDMATIK-ESCROW
                </Badge>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 text-muted-foreground border-b font-semibold">
                  <span>{isAr ? 'البند / التفاصيل' : 'Item / Description'}</span>
                  <span>{isAr ? 'المبلغ' : 'Amount'}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span>{isAr ? 'أتعاب اليد العاملة والصيانة' : 'Labor & Execution Fees'}</span>
                  <span className="font-mono font-bold">{quotation.laborCostDA.toLocaleString()} DA</span>
                </div>

                {quotation.emergencySurgeFeeDA > 0 && (
                  <div className="flex justify-between py-1 text-red-600 dark:text-red-400">
                    <span>{isAr ? 'علاوة الطوارئ الفورية (SOS Surge Rate)' : 'Emergency SOS Surge Fee'}</span>
                    <span className="font-mono font-bold">+{quotation.emergencySurgeFeeDA.toLocaleString()} DA</span>
                  </div>
                )}

                {approvedParts.map(p => (
                  <div key={p.id} className="flex justify-between py-1 text-slate-700 dark:text-slate-300">
                    <span>{isAr ? `قطعة غيار: ${p.name} (x${p.quantity})` : `Part: ${p.name} (x${p.quantity})`}</span>
                    <span className="font-mono font-bold">+{(p.priceDA * p.quantity).toLocaleString()} DA</span>
                  </div>
                ))}

                <div className="flex justify-between py-2 border-t text-muted-foreground">
                  <span>{isAr ? 'عمولة المنصة والتأمين (5% مشمولة):' : 'Platform & Escrow Insurance (5% incl):'}</span>
                  <span className="font-mono font-semibold">{platformCommissionDA.toLocaleString()} DA</span>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-slate-900 dark:border-slate-100 text-sm font-black text-slate-900 dark:text-white">
                  <span>{isAr ? 'المبلغ الإجمالي النهائي للدفع:' : 'Final Net Total Payable:'}</span>
                  <span className="font-mono text-lg text-primary">{netPayableDA.toLocaleString()} DA</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={handleDownloadInvoicePDF}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  {isAr ? 'تحميل الفاتورة PDF مع الوصولات' : 'Download Invoice PDF with Receipts'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* MODAL 1: ADD SPARE PART (Craftsman) */}
      <Dialog open={isAddPartOpen} onOpenChange={setIsAddPartOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-primary" />
              {isAr ? 'إضافة فاتورة قطعة غيار جديدة' : 'Add Spare Part with Receipt'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr 
                ? 'يرجى إدخال اسم القطعة وسعر الشراء وإرفاق صورة الوصل للموافقة الفورية من العميل' 
                : 'Upload receipt photo and price. Customer will receive immediate 1-tap approval push'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSparePart} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">{isAr ? 'اسم القطعة أو المادة *' : 'Part Name / Material *'}</Label>
              <Input 
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="e.g. صمام مياه نحاسي 3/4 أو قاطع تيار 16A"
                className="text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">{isAr ? 'السعر (دج) *' : 'Price (DA) *'}</Label>
                <Input 
                  type="number"
                  value={newPartPrice}
                  onChange={(e) => setNewPartPrice(Number(e.target.value))}
                  className="text-xs font-mono mt-1"
                  required
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isAr ? 'الكمية' : 'Quantity'}</Label>
                <Input 
                  type="number"
                  value={newPartQuantity}
                  onChange={(e) => setNewPartQuantity(Number(e.target.value))}
                  className="text-xs font-mono mt-1"
                  min={1}
                />
              </div>
            </div>

            {/* Receipt Photo Attachment */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-bold">{isAr ? 'صورة وصل الشراء أو الفاتورة *' : 'Receipt / Invoice Photo *'}</Label>
              <div className="p-3 border-2 border-dashed rounded-xl flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50">
                <img 
                  src={newPartReceiptPhoto} 
                  alt="Receipt Preview" 
                  className="h-12 w-12 rounded-lg object-cover border" 
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isAr ? 'تم التقاط صورة الوصل' : 'Receipt Captured'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">High-Res Image (2.4 MB)</span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={() => toast({ title: isAr ? 'تم تحديث صورة الفاتورة' : 'Receipt Updated' })}
                >
                  <UploadCloud className="h-3.5 w-3.5 mr-1" />
                  {isAr ? 'تغيير' : 'Change'}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsAddPartOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {isAr ? 'إرسال للاعتماد والموافقة' : 'Send for Approval'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CUSTOMER ONE-TAP APPROVAL & RECEIPT ZOOM */}
      {reviewingPart && (
        <Dialog open={!!reviewingPart} onOpenChange={() => setReviewingPart(null)}>
          <DialogContent className="max-w-lg p-6 bg-white dark:bg-slate-900">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-600">
                <BellRing className="h-5 w-5 animate-bounce" />
                <DialogTitle className="text-base font-bold">
                  {isAr ? 'مراجعة واعتماد شراء قطعة غيار' : 'Review Spare Part Purchase'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                {isAr 
                  ? `قام الحرفي (${craftsmanName}) بإرفاق صورة الوصل التالية لطلب اعتماد تركيب القطعة` 
                  : `Craftsman ${craftsmanName} submitted receipt for one-tap approval`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Receipt Image High-Res Preview */}
              <div className="rounded-xl overflow-hidden border max-h-72 bg-black flex items-center justify-center">
                <img 
                  src={reviewingPart.receiptPhotoUrl} 
                  alt={reviewingPart.name} 
                  className="max-h-72 w-full object-contain" 
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-sm block">{reviewingPart.name}</span>
                  <span className="text-muted-foreground">{isAr ? `الكمية المطلوبة: ${reviewingPart.quantity}` : `Quantity: ${reviewingPart.quantity}`}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-primary">
                    {(reviewingPart.priceDA * reviewingPart.quantity).toLocaleString()} DA
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCustomerApprovePart(reviewingPart.id, false)}
                className="border-rose-300 text-rose-600 hover:bg-rose-50 font-bold"
              >
                <XCircle className="h-4 w-4 mr-1" />
                {isAr ? 'رفض الشراء' : 'Reject Part'}
              </Button>
              <Button
                type="button"
                onClick={() => handleCustomerApprovePart(reviewingPart.id, true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {isAr ? 'الموافقة الرقمية المسبقة' : 'Approve & Add to Job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
