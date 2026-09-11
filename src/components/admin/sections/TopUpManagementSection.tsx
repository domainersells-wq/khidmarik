'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { financialService } from '@/services/financialService';
import { TopUpRequest, TopUpStatus, TopUpRejectionReason } from '@/types/financials';
import {
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  FileText,
  ShieldCheck,
  Building,
  User,
  Calendar,
  CreditCard,
  Receipt,
  HelpCircle,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Zap,
  SlidersHorizontal,
  Bot,
  Layers,
  Sparkles,
  Copy,
  Paperclip,
  Download
} from 'lucide-react';

export function TopUpManagementSection() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const targetReqId = searchParams.get('requestId') || searchParams.get('id');

  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState(targetReqId || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [copiedDetailCode, setCopiedDetailCode] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    fileName?: string;
    title?: string;
  } | null>(null);
  const [previewDisplayUrl, setPreviewDisplayUrl] = useState<string | null>(null);

  const isPdfFile = (url?: string, fileName?: string) => {
    if (!url && !fileName) return false;
    const lowerUrl = (url || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    return (
      lowerUrl.startsWith('data:application/pdf') ||
      lowerUrl.endsWith('.pdf') ||
      lowerUrl.includes('.pdf?') ||
      lowerName.endsWith('.pdf')
    );
  };

  useEffect(() => {
    if (!previewFile) {
      setPreviewDisplayUrl(null);
      return;
    }

    if (previewFile.url.startsWith('data:')) {
      try {
        const isPdf = isPdfFile(previewFile.url, previewFile.fileName);
        const parts = previewFile.url.split(';base64,');
        const contentType = parts[0].split(':')[1] || (isPdf ? 'application/pdf' : 'application/octet-stream');
        const base64Data = parts[1] || '';
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: contentType });
        const objUrl = URL.createObjectURL(blob);
        setPreviewDisplayUrl(objUrl);
        return () => {
          URL.revokeObjectURL(objUrl);
        };
      } catch (e) {
        console.error('Error creating blob for preview:', e);
        setPreviewDisplayUrl(previewFile.url);
      }
    } else {
      setPreviewDisplayUrl(previewFile.url);
    }
  }, [previewFile]);

  const handleDownloadFile = (url: string, fileName?: string) => {
    try {
      const isPdf = isPdfFile(url, fileName);
      const fallbackName = fileName || (isPdf ? 'receipt_document.pdf' : 'receipt_document.png');

      if (url.startsWith('data:')) {
        const parts = url.split(';base64,');
        const contentType = parts[0].split(':')[1] || (isPdf ? 'application/pdf' : 'application/octet-stream');
        const base64Data = parts[1] || '';
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fallbackName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        toast({
          title: 'جاري تحميل الملف',
          description: `يتم تنزيل: ${fallbackName}`,
        });
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fallbackName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'جاري تحميل الملف',
          description: `يتم تنزيل: ${fallbackName}`,
        });
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      window.open(url, '_blank');
    }
  };

  const handleOpenInNewTab = (url: string, fileName?: string) => {
    try {
      if (url.startsWith('data:')) {
        const isPdf = isPdfFile(url, fileName);
        const parts = url.split(';base64,');
        const contentType = parts[0].split(':')[1] || (isPdf ? 'application/pdf' : 'application/octet-stream');
        const base64Data = parts[1] || '';
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Error opening file in new tab:', err);
      window.open(url, '_blank');
    }
  };

  // Verification Mode Settings
  const [autoVerifySettings, setAutoVerifySettings] = useState(financialService.getAutoVerificationSettings());

  // Form states
  const [rejectionReason, setRejectionReason] = useState<TopUpRejectionReason>('INVALID_TRANSACTION_CODE');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [infoRequestNotes, setInfoRequestNotes] = useState('');
  const [adminApprovalNotes, setAdminApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRequests = async () => {
    // 1. Instant local render
    const list = financialService.getTopUpRequests();
    setRequests(list);

    // Auto-open target request if URL has requestId parameter
    if (targetReqId) {
      const match = list.find(r => r.publicRequestNumber === targetReqId || r.id === targetReqId);
      if (match) {
        setSelectedRequest(match);
        setIsDetailOpen(true);
      }
    }

    // 2. Continuous server sync (handles requests submitted from Incognito, other browsers, or other devices)
    try {
      const synced = await financialService.syncTopUpsFromServer();
      setRequests(synced);
      if (targetReqId) {
        const match = synced.find(r => r.publicRequestNumber === targetReqId || r.id === targetReqId);
        if (match) {
          setSelectedRequest(match);
          setIsDetailOpen(true);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadRequests();

    // Listen for live top-up events from user profile, modals, and other tabs
    const handleTopUpEvent = () => {
      loadRequests();
    };

    window.addEventListener('khidmatik:topup-updated', handleTopUpEvent);
    window.addEventListener('khidmatik:admin-new-topup', handleTopUpEvent);
    window.addEventListener('storage', handleTopUpEvent);
    window.addEventListener('focus', handleTopUpEvent);

    // Active polling every 2.5s for zero-delay cross-tab synchronization
    const interval = setInterval(loadRequests, 2500);

    return () => {
      window.removeEventListener('khidmatik:topup-updated', handleTopUpEvent);
      window.removeEventListener('khidmatik:admin-new-topup', handleTopUpEvent);
      window.removeEventListener('storage', handleTopUpEvent);
      window.removeEventListener('focus', handleTopUpEvent);
      clearInterval(interval);
    };
  }, [targetReqId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedDetailCode(true);
    setTimeout(() => setCopiedDetailCode(false), 2000);
  };

  // Filtered requests
  const filteredRequests = requests.filter(req => {
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'UNDER_REVIEW') {
        if (req.status !== 'UNDER_REVIEW' && req.status !== 'PENDING_VERIFICATION' && req.status !== 'PENDING_PAYMENT_CONFIRMATION') {
          return false;
        }
      } else if (selectedStatus === 'APPROVED') {
        if (req.status !== 'APPROVED' && req.status !== 'CREDITED') {
          return false;
        }
      } else if (selectedStatus === 'INFO_REQUIRED') {
        if (req.status !== 'INFO_REQUIRED') return false;
      } else if (selectedStatus === 'REJECTED') {
        if (req.status !== 'REJECTED') return false;
      } else if (req.status !== selectedStatus) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = req.publicRequestNumber.toLowerCase().includes(q);
      const matchUser = req.userName.toLowerCase().includes(q);
      const matchCode = req.postalTransactionCode ? req.postalTransactionCode.toLowerCase().includes(q) : false;
      return matchNumber || matchUser || matchCode;
    }
    return true;
  });

  // Calculate Metrics directly from authoritative dataset
  const totalCount = requests.length;
  const underReviewCount = requests.filter(
    r => r.status === 'UNDER_REVIEW' || r.status === 'PENDING_VERIFICATION' || r.status === 'PENDING_PAYMENT_CONFIRMATION'
  ).length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'CREDITED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED' || r.status === 'INFO_REQUIRED').length;
  const totalApprovedVolume = requests
    .filter(r => r.status === 'APPROVED' || r.status === 'CREDITED')
    .reduce((sum, r) => sum + r.amount, 0);

  // Handle Mode Change
  const handleModeToggle = (newMode: 'manual' | 'automatic') => {
    const updated = { ...autoVerifySettings, mode: newMode };
    setAutoVerifySettings(updated);
    financialService.updateAutoVerificationSettings(updated);
    toast({
      title: newMode === 'automatic' ? '⚡ تم تفعيل وضع التحقق الآلي الفوري' : '📋 تم تفعيل وضع التدقيق اليدوي',
      description: newMode === 'automatic'
        ? 'سيتم تدقيق واعتماد الحوالات البريدية والإلكترونية فورياً عبر بوابات الدفع.'
        : 'سيتم تحويل جميع العمليات إلى مكتب التدقيق للمراجعة اليدوية قبل إيداع الرصيد.',
    });
  };

  // Run Batch Auto-Verification
  const handleRunAutoBatch = () => {
    setIsProcessing(true);
    try {
      const res = financialService.runAutoVerificationBatch();
      loadRequests();
      toast({
        title: '⚡ اكتمل فحص التحقق الآلي',
        description: `تمت معالجة ${res.processed} طلب، واعتماد ${res.approved} طلب مطابق بنجاح وإيداع الرصيد في محافظهم.`,
      });
    } catch (e: any) {
      toast({
        title: 'خطأ',
        description: e.message || 'تعذر تشغيل التحقق الآلي',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Approve
  const handleApprove = (req: TopUpRequest) => {
    setIsProcessing(true);
    try {
      const result = financialService.approveTopUpRequest(req.id, 'Admin Finance Desk', adminApprovalNotes);
      if (result.success) {
        toast({
          title: 'تم اعتماد شحن الرصيد بنجاح! ✅',
          description: `تم إضافة ${req.amount.toLocaleString()} DA لحساب ${req.userName} وتوثيق القيد المالي.`,
        });
        loadRequests();
        setIsDetailOpen(false);
        setAdminApprovalNotes('');
      } else {
        toast({
          title: 'تعذر الاعتماد',
          description: result.error || 'حدث خطأ أثناء معالجة الطلب',
          variant: 'destructive'
        });
      }
    } catch (e: any) {
      toast({
        title: 'خطأ في النظام',
        description: e.message || 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      const result = financialService.rejectTopUpRequest(
        selectedRequest.id,
        'Admin Finance Desk',
        rejectionReason,
        rejectionNotes
      );
      if (result.success) {
        toast({
          title: 'تم رفض طلب الشحن',
          description: `تم تسجيل الرفض وإشعار المستخدم بالسبب المالي.`,
        });
        loadRequests();
        setIsRejectDialogOpen(false);
        setIsDetailOpen(false);
        setRejectionNotes('');
      } else {
        toast({
          title: 'تعذر الرفض',
          description: result.error || 'حدث خطأ',
          variant: 'destructive'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Request More Info
  const handleInfoSubmit = () => {
    if (!selectedRequest || !infoRequestNotes.trim()) return;
    setIsProcessing(true);
    try {
      const result = financialService.requestTopUpMoreInfo(
        selectedRequest.id,
        'Admin Finance Desk',
        infoRequestNotes
      );
      if (result.success) {
        toast({
          title: 'تم إرسال طلب المعلومات الإضافية',
          description: `تم تنبيه المستخدم لتحديث المستندات وإعادة الإرسال.`,
        });
        loadRequests();
        setIsInfoDialogOpen(false);
        setIsDetailOpen(false);
        setInfoRequestNotes('');
      } else {
        toast({
          title: 'خطأ',
          description: result.error || 'تعذر إرسال الطلب',
          variant: 'destructive'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground" dir="rtl">
      {/* Header & Mode Switcher Strip */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card/80 p-5 rounded-3xl border border-border/80 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black font-headline tracking-tight text-foreground flex items-center gap-2">
                مكتب مطابقة وشحن الأرصدة والضمان
                <Badge variant="outline" className="text-[10px] font-mono">Top-Up Verification Desk</Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                مراجعة الحوالات البريدية، مطابقة أكواد العمليات، وإيداع الرصيد في محافظ المستخدمين فورياً
              </p>
            </div>
          </div>
        </div>

        {/* Dual Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border/60">
            <button
              onClick={() => handleModeToggle('manual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                autoVerifySettings.mode === 'manual'
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>مراجعة يدوية (Manual)</span>
            </button>
            <button
              onClick={() => handleModeToggle('automatic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                autoVerifySettings.mode === 'automatic'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>تحقق آلي فوري (Auto)</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigDialogOpen(true)}
            className="h-9 text-xs rounded-xl gap-1.5 border-border"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>إعدادات البوابات</span>
          </Button>

          <Button
            size="sm"
            onClick={handleRunAutoBatch}
            disabled={isProcessing || underReviewCount === 0}
            className="h-9 text-xs font-bold rounded-xl gap-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-sm"
          >
            <Bot className="h-4 w-4" />
            <span>اعتماد آلي للمطابق ({underReviewCount})</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={loadRequests} className="h-9 w-9 rounded-xl text-muted-foreground" title="تحديث">
            <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Auto-Verification Banner Alert */}
      {autoVerifySettings.mode === 'automatic' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>التحقق الآلي الفوري نشط:</strong> تتم مطابقة أرقام العمليات البريدية وإيصالات BaridiMob / CCP آلياً وإيداع الرصيد في محافظ المستخدمين حتى سقف <strong>{autoVerifySettings.autoApproveThresholdDZD.toLocaleString()} DA</strong>.
            </span>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px] shrink-0 font-mono">Instant Gateway Active</Badge>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4 border border-border/70 rounded-2xl bg-card shadow-xs">
          <span className="text-xs font-bold text-muted-foreground block">إجمالي الطلبات</span>
          <p className="text-2xl font-black text-foreground font-mono mt-1" dir="ltr">{totalCount}</p>
          <span className="text-[10px] text-muted-foreground">All Requests Synchronized</span>
        </Card>

        <Card className="p-4 border border-amber-500/30 rounded-2xl bg-amber-500/5 shadow-xs">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 animate-pulse" /> قيد التدقيق والمطابقة
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1" dir="ltr">{underReviewCount}</p>
          <span className="text-[10px] text-muted-foreground">Pending Desk Review</span>
        </Card>

        <Card className="p-4 border border-emerald-500/30 rounded-2xl bg-emerald-500/5 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> معتمدة ومكتملة
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1" dir="ltr">{approvedCount}</p>
          <span className="text-[10px] text-muted-foreground">Credited To Wallets</span>
        </Card>

        <Card className="p-4 border border-border/70 rounded-2xl bg-card shadow-xs">
          <span className="text-xs font-bold text-muted-foreground block">مرفوضة / توضيح</span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 font-mono mt-1" dir="ltr">{rejectedCount}</p>
          <span className="text-[10px] text-muted-foreground">Rejected / Inquired</span>
        </Card>

        <Card className="p-4 border border-primary/30 rounded-2xl bg-primary/5 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-xs font-bold text-primary block">حجم الإيداعات المعتمدة</span>
          <p className="text-xl font-black text-primary font-mono mt-1" dir="ltr">{totalApprovedVolume.toLocaleString()} DA</p>
          <span className="text-[10px] text-muted-foreground">Total Credited GMV</span>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 border border-border/80 rounded-2xl bg-card space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث برقم الطلب (TOP-2026-...)، اسم المستخدم، أو رمز العملية البريدية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9 h-10 text-xs rounded-xl bg-background"
            />
          </div>

          <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-5 h-10 rounded-xl p-1 bg-muted/60">
              <TabsTrigger value="ALL" className="text-xs font-bold rounded-lg">الكل ({totalCount})</TabsTrigger>
              <TabsTrigger value="UNDER_REVIEW" className="text-xs font-bold rounded-lg text-amber-700 dark:text-amber-300">
                قيد التدقيق ({underReviewCount})
              </TabsTrigger>
              <TabsTrigger value="APPROVED" className="text-xs font-bold rounded-lg text-emerald-700 dark:text-emerald-300">معتمدة ({approvedCount})</TabsTrigger>
              <TabsTrigger value="INFO_REQUIRED" className="text-xs font-bold rounded-lg text-blue-700 dark:text-blue-300">توضيح</TabsTrigger>
              <TabsTrigger value="REJECTED" className="text-xs font-bold rounded-lg text-red-700 dark:text-red-300">مرفوضة</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="border border-border/80 rounded-2xl overflow-hidden shadow-xs bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
              <tr>
                <th className="py-3 px-4">رقم الطلب</th>
                <th className="py-3 px-4">المستخدم</th>
                <th className="py-3 px-4">المبلغ وطريقة الدفع</th>
                <th className="py-3 px-4">رمز العملية البريدية</th>
                <th className="py-3 px-4">تاريخ التحويل</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="h-8 w-8 text-muted-foreground/50" />
                      <p className="font-bold">لا توجد طلبات شحن مطابقة للشروط المحددة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const isUnderReview = req.status === 'UNDER_REVIEW';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';
                  const isInfo = req.status === 'INFO_REQUIRED';

                  return (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground" dir="ltr">
                        {req.publicRequestNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{req.userName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono" dir="ltr">{req.userEmail || req.userId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-foreground font-mono" dir="ltr">
                          +{req.amount.toLocaleString()} DA
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">
                          {req.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {req.postalTransactionCode ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border" dir="ltr">
                              {req.postalTransactionCode}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400" title="تم تسجيل الرمز">✓</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">قيد الإرسال</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono" dir="ltr">
                        {req.transferDate || req.createdAt.split(' ')[0]}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                            isApproved ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            isUnderReview ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                            isInfo ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                            'bg-red-500/10 text-red-600 border border-red-500/20'
                          }`}>
                            {isApproved && <Check className="h-3 w-3" />}
                            {isUnderReview && <Clock className="h-3 w-3 animate-pulse" />}
                            {isInfo && <HelpCircle className="h-3 w-3" />}
                            {isRejected && <X className="h-3 w-3" />}
                            <span>
                              {isApproved ? 'معتمد ومضاف' :
                               isUnderReview ? 'قيد التدقيق' :
                               isInfo ? 'مطلوب توضيح' : 'مرفوض'}
                            </span>
                          </Badge>

                          {(req.userClarificationText || req.userClarificationAttachmentUrl) && (
                            <Badge className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1 shadow-xs" title="قدم العميل توضيحاً أو مستنداً إضافياً">
                              <Paperclip className="h-2.5 w-2.5" />
                              <span>وصل رد ومستند</span>
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsDetailOpen(true);
                            }}
                            className={`h-8 text-xs font-bold gap-1.5 rounded-xl ${
                              isUnderReview || (req.userClarificationText || req.userClarificationAttachmentUrl)
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                : ''
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>مطابقة وتدقيق</span>
                          </Button>
                          {(isUnderReview || (isInfo && (req.userClarificationText || req.userClarificationAttachmentUrl))) && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req)}
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-2.5 shadow-xs"
                              title="اعتماد فوري للرصيد"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>اعتماد</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top-Up Detail & Verification Desk Modal */}
      {selectedRequest && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 text-foreground" dir="rtl">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>مطابقة وتدقيق طلب الشحن ({selectedRequest.publicRequestNumber})</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    التدقيق المالي قبل اعتماد تحويل الأموال لمحفظة العميل وتوثيق القيود المزدوجة
                  </DialogDescription>
                </div>
                <Badge className="font-mono text-base px-3 py-1 font-black bg-primary text-primary-foreground" dir="ltr">
                  +{selectedRequest.amount.toLocaleString()} DA
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-3">
              {/* Verification Comparison Box */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>بيانات العملية المسجلة من العميل:</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">المبلغ المطلوب شحنه:</span>
                    <strong className="text-foreground font-mono text-sm" dir="ltr">{selectedRequest.amount.toLocaleString()} DA</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">طريقة الدفع:</span>
                    <strong className="text-foreground uppercase">{selectedRequest.paymentMethod}</strong>
                  </div>
                  <div className="col-span-2 p-3 rounded-xl bg-background border border-primary/30 space-y-1.5">
                    <span className="text-muted-foreground block text-[11px] font-bold">
                      رمز العملية البريدية أو التحويل البنكي (N° de transaction):
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-primary font-mono text-base font-black px-3 py-1 bg-primary/10 rounded-lg border border-primary/20" dir="ltr">
                        {selectedRequest.postalTransactionCode || 'لم يتم إدخاله من قِبل العميل'}
                      </strong>
                      {selectedRequest.postalTransactionCode && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(selectedRequest.postalTransactionCode!)}
                          className="h-8 text-xs font-bold gap-1 rounded-xl"
                        >
                          {copiedDetailCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedDetailCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      * طابق هذا الرمز مباشرة مع كشف حساب بريدي موب (BaridiMob) أو كشف الحساب الجاري لمكتب البريد قبل الاعتماد.
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">تاريخ تنفيذ التحويل:</span>
                    <strong className="text-foreground font-mono" dir="ltr">{selectedRequest.transferDate || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">اسم المرسل:</span>
                    <strong className="text-foreground">{selectedRequest.senderName || selectedRequest.userName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">حساب المرسل (CCP/RIP):</span>
                    <strong className="text-foreground font-mono" dir="ltr">{selectedRequest.senderAccount || 'غير محدد'}</strong>
                  </div>
                </div>
              </div>

              {/* Platform Account Information */}
              <div className="p-3.5 rounded-2xl border border-border bg-background space-y-2 text-xs">
                <h5 className="font-bold text-muted-foreground text-[11px]">حساب المنصة المستقبل المعتمد:</h5>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>CCP: <strong>{selectedRequest.platformCcpNumber}</strong></div>
                  <div>RIP: <strong>{selectedRequest.platformRipNumber}</strong></div>
                  <div className="col-span-2">صاحب الحساب: <strong>{selectedRequest.platformAccountName}</strong></div>
                </div>
              </div>

              {/* Initial Transfer Receipt if available */}
              {selectedRequest.receiptUrl && (
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-primary" />
                      وصل التحويل الأصلي المسجل:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-primary hover:underline font-bold gap-1"
                        onClick={() => setPreviewFile({
                          url: selectedRequest.receiptUrl!,
                          fileName: 'original_receipt',
                          title: 'معاينة وصل التحويل الأصلي'
                        })}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        تكبير الوصل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground font-bold gap-1"
                        onClick={() => handleDownloadFile(selectedRequest.receiptUrl!, 'original_receipt')}
                      >
                        <Download className="h-3.5 w-3.5" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                  {isPdfFile(selectedRequest.receiptUrl) ? (
                    <div className="p-3 bg-background rounded-xl border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-500" />
                        <span className="font-mono text-xs font-bold text-foreground">وصل التحويل بصيغة (PDF)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold gap-1 rounded-xl"
                          onClick={() => setPreviewFile({
                            url: selectedRequest.receiptUrl!,
                            fileName: 'original_receipt.pdf',
                            title: 'معاينة وصل التحويل الأصلي'
                          })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          معاينة
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold gap-1 rounded-xl text-primary"
                          onClick={() => handleDownloadFile(selectedRequest.receiptUrl!, 'original_receipt.pdf')}
                        >
                          <Download className="h-3.5 w-3.5" />
                          تحميل
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-56 rounded-xl overflow-hidden border border-border bg-black/5 flex items-center justify-center p-2">
                      <img
                        src={selectedRequest.receiptUrl}
                        alt="وصل التحويل"
                        className="max-h-52 object-contain rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                        onClick={() => setPreviewFile({
                          url: selectedRequest.receiptUrl!,
                          fileName: 'original_receipt.png',
                          title: 'معاينة وصل التحويل الأصلي'
                        })}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Admin Clarification Request Info */}
              {selectedRequest.requestedInfoNote && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4" /> طلب التوضيح أو المستند المرسل للعميل:
                    </span>
                    {selectedRequest.requestedInfoAt && (
                      <span className="font-mono text-[11px] text-muted-foreground">{selectedRequest.requestedInfoAt}</span>
                    )}
                  </div>
                  <p className="text-foreground bg-background/90 p-3 rounded-xl border border-blue-500/20 font-medium leading-relaxed">
                    "{selectedRequest.requestedInfoNote}"
                  </p>
                </div>
              )}

              {/* User Clarification Response & Document Attachment */}
              {(selectedRequest.userClarificationText || selectedRequest.userClarificationAttachmentUrl) && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-xs space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4" /> 📎 رد وتوضيح العميل والمستند المرفق:
                    </span>
                    {selectedRequest.userClarificationSubmittedAt && (
                      <span className="font-mono text-[11px] bg-background/90 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-muted-foreground font-bold">
                        تاريخ الرد: {selectedRequest.userClarificationSubmittedAt}
                      </span>
                    )}
                  </div>

                  {selectedRequest.userClarificationText && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-[11px] font-bold">توضيح ورسالة العميل:</span>
                      <p className="text-foreground bg-background p-3 rounded-xl border font-medium text-xs leading-relaxed">
                        {selectedRequest.userClarificationText}
                      </p>
                    </div>
                  )}

                  {selectedRequest.userClarificationAttachmentUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1">
                          <Receipt className="h-3.5 w-3.5 text-primary" />
                          المستند / الوصل الإضافي المرفق:
                          {selectedRequest.userClarificationFileName && (
                            <span className="font-mono text-foreground font-bold">({selectedRequest.userClarificationFileName})</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-bold gap-1 rounded-lg"
                            onClick={() => setPreviewFile({
                              url: selectedRequest.userClarificationAttachmentUrl!,
                              fileName: selectedRequest.userClarificationFileName,
                              title: 'معاينة وفحص مستند العميل المرفق'
                            })}
                          >
                            <Eye className="h-3 w-3" />
                            معاينة
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-bold gap-1 rounded-lg text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            onClick={() => handleDownloadFile(
                              selectedRequest.userClarificationAttachmentUrl!,
                              selectedRequest.userClarificationFileName
                            )}
                          >
                            <Download className="h-3 w-3" />
                            تحميل الملف
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] text-primary hover:underline font-bold inline-flex items-center gap-1"
                            onClick={() => handleOpenInNewTab(
                              selectedRequest.userClarificationAttachmentUrl!,
                              selectedRequest.userClarificationFileName
                            )}
                          >
                            <ExternalLink className="h-3 w-3" />
                            فتح في نافذة
                          </Button>
                        </div>
                      </div>

                      {isPdfFile(selectedRequest.userClarificationAttachmentUrl, selectedRequest.userClarificationFileName) ? (
                        <div className="p-4 bg-background rounded-2xl border-2 border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                <span>{selectedRequest.userClarificationFileName || 'مستند PDF رسمي'}</span>
                                <span className="text-[10px] px-2 py-0.5 bg-red-500/15 text-red-600 rounded font-mono font-bold">PDF Document</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">وثيقة بي دي إف رسمية أرفقها العميل رداً على طلب التوضيح.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button
                              size="sm"
                              className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground"
                              onClick={() => setPreviewFile({
                                url: selectedRequest.userClarificationAttachmentUrl!,
                                fileName: selectedRequest.userClarificationFileName,
                                title: 'معاينة وقراءة مستند PDF'
                              })}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              معاينة وفحص
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-bold gap-1.5 rounded-xl text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10"
                              onClick={() => handleDownloadFile(
                                selectedRequest.userClarificationAttachmentUrl!,
                                selectedRequest.userClarificationFileName
                              )}
                            >
                              <Download className="h-3.5 w-3.5" />
                              تحميل الملف
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group max-h-72 rounded-2xl overflow-hidden border border-border bg-black/5 flex items-center justify-center p-2.5">
                          <img
                            src={selectedRequest.userClarificationAttachmentUrl}
                            alt="مستند العميل"
                            className="max-h-64 object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.01] cursor-pointer"
                            onClick={() => setPreviewFile({
                              url: selectedRequest.userClarificationAttachmentUrl!,
                              fileName: selectedRequest.userClarificationFileName,
                              title: 'معاينة وفحص وصل العميل'
                            })}
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="pointer-events-auto h-9 text-xs font-bold gap-1.5 rounded-xl shadow-lg"
                              onClick={() => setPreviewFile({
                                url: selectedRequest.userClarificationAttachmentUrl!,
                                fileName: selectedRequest.userClarificationFileName,
                                title: 'معاينة وفحص وصل العميل'
                              })}
                            >
                              <Eye className="h-4 w-4" />
                              تكبير وفحص الوصل
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="pointer-events-auto h-9 text-xs font-bold gap-1.5 rounded-xl shadow-lg"
                              onClick={() => handleDownloadFile(
                                selectedRequest.userClarificationAttachmentUrl!,
                                selectedRequest.userClarificationFileName
                              )}
                            >
                              <Download className="h-4 w-4" />
                              تحميل الوصل
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* User Notes */}
              {selectedRequest.userNotes && (
                <div className="p-3.5 rounded-2xl bg-muted/20 border text-xs space-y-1">
                  <span className="text-muted-foreground text-[11px] font-bold">ملاحظات العميل الأولية:</span>
                  <p className="text-foreground">{selectedRequest.userNotes}</p>
                </div>
              )}

              {/* Admin Approval Notes Input */}
              {(selectedRequest.status === 'UNDER_REVIEW' || selectedRequest.status === 'INFO_REQUIRED') && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 text-xs">
                  <Label htmlFor="admin-approval-notes" className="font-bold text-foreground flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>ملاحظات التدقيق الإداري والاعتماد (اختياري - تُسجل في القيد المالي):</span>
                  </Label>
                  <Input
                    id="admin-approval-notes"
                    type="text"
                    value={adminApprovalNotes}
                    onChange={(e) => setAdminApprovalNotes(e.target.value)}
                    placeholder="مثال: تمت المطابقة بنجاح مع كشف حساب BaridiMob وتأكيد وصول المبلغ..."
                    className="h-9 text-xs rounded-xl bg-background"
                  />
                </div>
              )}

              {/* Review History */}
              {selectedRequest.reviewedBy && (
                <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>تمت المراجعة والاعتماد بواسطة: <strong>{selectedRequest.reviewedBy}</strong></span>
                    <span className="font-mono">{selectedRequest.reviewedAt}</span>
                  </div>
                  {selectedRequest.adminNotes && (
                    <p className="text-foreground font-medium">{selectedRequest.adminNotes}</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row gap-2 justify-between">
              <div className="flex gap-2">
                {(selectedRequest.status === 'UNDER_REVIEW' || selectedRequest.status === 'INFO_REQUIRED') && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setIsRejectDialogOpen(true);
                      }}
                      className="text-xs font-bold rounded-xl"
                    >
                      <X className="h-3.5 w-3.5 ml-1" />
                      رفض الطلب
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsInfoDialogOpen(true);
                      }}
                      className="text-xs font-bold rounded-xl text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                    >
                      <HelpCircle className="h-3.5 w-3.5 ml-1 text-blue-500" />
                      {selectedRequest.status === 'INFO_REQUIRED' ? 'تعديل طلب التوضيح' : 'طلب توضيح أو مستند'}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="text-xs rounded-xl">
                  إغلاق
                </Button>
                {(selectedRequest.status === 'UNDER_REVIEW' || selectedRequest.status === 'INFO_REQUIRED') && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={isProcessing}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    <span>اعتماد فوري وإيداع {selectedRequest.amount.toLocaleString()} DA</span>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Auto-Verification Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 text-foreground" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span>إعدادات التحقق الآلي وبوابات الدفع الإلكتروني</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              ضبط معايير القبول الآلي للحوالات المباشرة دون الحاجة لتدخل يدوي
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border">
              <div>
                <p className="font-bold text-foreground">تفعيل التحقق التلقائي المباشر (Auto-Verify)</p>
                <p className="text-[11px] text-muted-foreground">اعتماد فوري للحوالات المطابقة للقواعد المحددة</p>
              </div>
              <Switch
                checked={autoVerifySettings.enabled}
                onCheckedChange={(val) => {
                  const updated = { ...autoVerifySettings, enabled: val };
                  setAutoVerifySettings(updated);
                  financialService.updateAutoVerificationSettings(updated);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">الحد الأقصى للاعتماد الآلي للعملية الواحدة (DZD):</Label>
              <Input
                type="number"
                value={autoVerifySettings.autoApproveThresholdDZD}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  const updated = { ...autoVerifySettings, autoApproveThresholdDZD: val };
                  setAutoVerifySettings(updated);
                  financialService.updateAutoVerificationSettings(updated);
                }}
                className="h-10 text-xs font-mono rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">العمليات الأكبر من هذا السقف ستُحال تلقائياً للمراجعة البشرية كإجراء أمان إضافي.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
              <h5 className="font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>حماية المنصة من الضغط والازدواجية (Concurrency Lock):</span>
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                يستخدم النظام تلقائياً مفاتيح عدم التكرار (Idempotency Keys) وأقفال التزامن لمنع أي شحن مكرر عند وصول آلاف الطلبات في نفس اللحظة.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button onClick={() => setIsConfigDialogOpen(false)} className="w-full rounded-xl text-xs font-bold">
              حفظ وإغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-foreground" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>رفض طلب الشحن</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              حدد السبب المالي لرفض الطلب لإشعار العميل بدقة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">سبب الرفض:</Label>
              <Select value={rejectionReason} onValueChange={(v: any) => setRejectionReason(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="INVALID_TRANSACTION_CODE">رمز العملية غير مطابق لكشف الحساب</SelectItem>
                  <SelectItem value="DUPLICATE_CODE">رمز العملية مستخدم ومسجل مسبقاً</SelectItem>
                  <SelectItem value="AMOUNT_MISMATCH">المبلغ المحول يختلف عن المبلغ المطلوب</SelectItem>
                  <SelectItem value="UNREADABLE_RECEIPT">وصل التحويل غير مقروء أو غير واضح</SelectItem>
                  <SelectItem value="SUSPECTED_FRAUD">اشتباه أمني / حوالة غير موثقة</SelectItem>
                  <SelectItem value="OTHER">سبب مالي آخر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">ملاحظات موجهة للمستخدم:</Label>
              <Textarea
                placeholder="وضح للعميل سبب الرفض بالتفصيل..."
                value={rejectionNotes}
                onChange={e => setRejectionNotes(e.target.value)}
                className="text-xs rounded-xl min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRejectDialogOpen(false)} className="text-xs rounded-xl">
              إلغاء
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRejectSubmit} disabled={isProcessing} className="text-xs font-bold rounded-xl">
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Request Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-foreground" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              <span>طلب توضيح أو مستند إضافي</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              إرسال إشعار للمستخدم لتقديم وصل أوضح أو رقم عملية إضافي.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <Label className="text-xs font-bold">التوضيح المطلوب من المستخدم:</Label>
            <Textarea
              placeholder="اكتب التوضيح المطلوب (مثلاً: يرجى إعادة إرسال صورة واضحة لختم مكتب البريد)..."
              value={infoRequestNotes}
              onChange={e => setInfoRequestNotes(e.target.value)}
              className="text-xs rounded-xl min-h-[90px]"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsInfoDialogOpen(false)} className="text-xs rounded-xl">
              إلغاء
            </Button>
            <Button size="sm" onClick={handleInfoSubmit} disabled={isProcessing || !infoRequestNotes.trim()} className="text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document/Receipt Image & PDF Preview Lightbox */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-3xl p-4 text-foreground bg-card/95 backdrop-blur-md" dir="rtl">
          <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span>{previewFile?.title || 'معاينة وفحص المستند / الوصل بالحجم الكامل'}</span>
              {previewFile?.fileName && (
                <Badge variant="outline" className="text-[11px] font-mono font-bold">
                  {previewFile.fileName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 flex items-center justify-center min-h-[350px] max-h-[75vh] overflow-hidden bg-black/5 dark:bg-black/20 rounded-2xl p-2 border">
            {previewFile && previewDisplayUrl && (
              isPdfFile(previewFile.url, previewFile.fileName) ? (
                <div className="w-full h-[70vh] flex flex-col items-center justify-center relative">
                  <iframe
                    src={previewDisplayUrl}
                    className="w-full h-full rounded-xl border bg-white shadow-inner"
                    title={previewFile.fileName || 'معاينة ملف PDF'}
                  />
                </div>
              ) : (
                <div className="max-h-[70vh] w-full overflow-auto flex items-center justify-center">
                  <img
                    src={previewDisplayUrl}
                    alt={previewFile.fileName || 'معاينة المستند بالحجم الكامل'}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent && !parent.querySelector('.img-error-notice')) {
                        const div = document.createElement('div');
                        div.className = 'img-error-notice p-8 text-center space-y-3';
                        div.innerHTML = `
                          <div class="text-amber-500 font-bold text-sm">تعذر عرض الملف كصورة مباشرة في المتصفح</div>
                          <div class="text-xs text-muted-foreground">قد يكون الملف تالفاً أو بصيغة تتطلب الفتح الخارجي. يرجى الضغط على زر تحميل الملف أدناه.</div>
                        `;
                        parent.appendChild(div);
                      }
                    }}
                  />
                </div>
              )
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {previewFile && (
                <>
                  <Button
                    size="sm"
                    className="text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-xs"
                    onClick={() => handleDownloadFile(previewFile.url, previewFile.fileName)}
                  >
                    <Download className="h-4 w-4" />
                    <span>تحميل الملف للجهاز</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold gap-1.5 rounded-xl"
                    onClick={() => handleOpenInNewTab(previewFile.url, previewFile.fileName)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>فتح في علامة تبويب جديدة</span>
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewFile(null)}
              className="text-xs rounded-xl w-full sm:w-auto"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
